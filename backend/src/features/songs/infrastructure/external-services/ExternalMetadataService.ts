import { execFile } from 'child_process';
import util from 'util';
import { query } from '../../../../shared/database.js';

const execFilePromise = util.promisify(execFile);

export class ExternalMetadataService {
  static extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const shortsMatch = url.match(/\/shorts\/([^&?]+)/);
    if (shortsMatch) return shortsMatch[1];
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  }

  static async checkYouTubeVideoType(videoId: string): Promise<{
    isValid: boolean;
    musicVideoType: string;
    title: string;
    author: string;
    error?: string;
  }> {
    const url = 'https://music.youtube.com/youtubei/v1/player?prettyPrint=false';
    const payload = {
      videoId: videoId,
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '1.20231204.01.00',
          hl: 'en',
          gl: 'US'
        }
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`YouTube Music API error: ${res.status}`);
      }

      const data: any = await res.json();
      const videoDetails = data.videoDetails || {};
      const musicVideoType = videoDetails.musicVideoType;
      const status = data.playabilityStatus?.status;
      
      // If the video is unplayable or blocked (very common for bot IPs or geo-restrictions),
      // we allow it so we do not block valid songs.
      const isPlayableOrBlocked = status !== 'OK';

      // We allow ATV (Art Tracks), OMV (Official Music Videos), UGC (User Generated Content - e.g. indie releases),
      // and OFFICIAL_SOURCE_MUSIC, or if the video playability status was blocked/unplayable.
      const isValid = 
        musicVideoType === 'MUSIC_VIDEO_TYPE_ATV' || 
        musicVideoType === 'MUSIC_VIDEO_TYPE_OMV' || 
        musicVideoType === 'MUSIC_VIDEO_TYPE_UGC' ||
        musicVideoType === 'MUSIC_VIDEO_TYPE_OFFICIAL_SOURCE_MUSIC' ||
        isPlayableOrBlocked;
      
      return {
        isValid,
        musicVideoType: musicVideoType || 'UNKNOWN',
        title: videoDetails.title || '',
        author: videoDetails.author || ''
      };
    } catch (err: any) {
      console.error(`Error querying InnerTube for ${videoId}:`, err.message);
      return {
        isValid: true, // Allow it to pass as a fallback so network/API changes don't break the service
        error: `Ezin izan da bideoa egiaztatu: ${err.message}`,
        musicVideoType: 'ERROR',
        title: '',
        author: ''
      };
    }
  }

  static async tryResolveOfficialVideoId(videoId: string): Promise<string | null> {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const res = await fetch(watchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      if (!res.ok) {
        return null;
      }
      
      const html = await res.text();
      const match = html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});/);
      if (!match) {
        return null;
      }
      
      const initialData = JSON.parse(match[1]);
      let foundId: string | null = null;
      
      function recurse(obj: any) {
        if (!obj || foundId) return;
        if (typeof obj === 'object') {
          if (obj.videoAttributeViewModel && obj.videoAttributeViewModel.onTap) {
            const cmd = obj.videoAttributeViewModel.onTap.innertubeCommand;
            if (cmd && cmd.watchEndpoint && cmd.watchEndpoint.videoId) {
              foundId = cmd.watchEndpoint.videoId;
              return;
            }
          }
          for (const k in obj) {
            recurse(obj[k]);
          }
        }
      }
      
      if (initialData && initialData.engagementPanels) {
        recurse(initialData.engagementPanels);
      }
      
      return foundId;
    } catch (err: any) {
      console.error(`Error resolving official release for ${videoId}:`, err.message);
      return null;
    }
  }

  static async resolveRealMetadata(url: string): Promise<{ title: string; artist: string }> {
    let realTitle = '';
    let realArtist = '';
    
    try {
      if (url.includes('spotify.com')) {
        const trackIdMatch = url.match(/\/track\/([^/?#]+)/);
        if (trackIdMatch) {
          const trackId = trackIdMatch[1];
          try {
            const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
            const response = await fetch(embedUrl, {
              headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
              }
            });
            if (response.ok) {
              const html = await response.text();
              const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
              if (nextDataMatch) {
                const data = JSON.parse(nextDataMatch[1]);
                const entity = data.props?.pageProps?.state?.data?.entity;
                if (entity) {
                  if (entity.isPlayable === false) {
                    throw new Error("Spotify abesti hau ez dago erabilgarri (katalogotik kendu da edo eskualde honetan blokeatuta dago)");
                  }
                  realTitle = entity.name || entity.title || '';
                  realArtist = entity.artists ? entity.artists.map((a: any) => a.name).join(', ') : '';
                }
              }
            }
          } catch (embedErr: any) {
            console.error("Error parsing Spotify embed in resolveRealMetadata:", embedErr);
            if (embedErr.message && embedErr.message.includes("ez dago erabilgarri")) {
              throw embedErr;
            }
          }
        }

        if (!realTitle || !realArtist) {
          const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
          const response = await fetch(oEmbedUrl);
          if (response.ok) {
            const data: any = await response.json();
            realTitle = data.title || '';
          }
          
          const htmlRes = await fetch(url, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
              'Accept-Language': 'eu,es;q=0.9,en;q=0.8'
            }
          });
          if (htmlRes.ok) {
            const html = await htmlRes.text();
            const twitterMatch = html.match(/<meta name="twitter:description" content="([^"·]+) ·/);
            if (twitterMatch) {
              realArtist = twitterMatch[1].trim();
            } else {
              const musicianMatch = html.match(/<meta name="music:musician_description" content="([^"]+)"/);
              if (musicianMatch) {
                realArtist = musicianMatch[1].trim();
              } else {
                const descMatch = html.match(/Song · ([^·]+) ·/);
                if (descMatch) {
                  realArtist = descMatch[1].trim();
                }
              }
            }
          }
        }
      } else {
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data: any = await response.json();
          realTitle = data.title || '';
          realArtist = data.author_name || '';
          
          if (realTitle.includes(' - ')) {
            const parts = realTitle.split(' - ');
            const possibleArtist = parts[0].trim();
            const possibleTitle = parts[1].replace(/(official video|videoclip|visualizer|lyric video|official music video|video oficial|oficial video|bideoa|bideoklipa|bideoklip ofiziala|lyric|audio|hd|4k|remastered)/gi, "").replace(/[\(\[【].*?[\)\]】]/g, "").trim();
            realArtist = possibleArtist;
            realTitle = possibleTitle;
          }
        }
      }
    } catch (e: any) {
      console.error("Error resolving real metadata:", e);
      if (e.message && e.message.includes("ez dago erabilgarri")) {
        throw e;
      }
    }

    if (realArtist) {
      realArtist = realArtist.replace(/\s*-\s*Topic\s*$/gi, '').trim();
      const lowerArtist = realArtist.toLowerCase();
      if (lowerArtist === 'release' || lowerArtist === 'various artists' || lowerArtist === 'various artist' || lowerArtist === 'artistas varios' || lowerArtist === 'varios artistas') {
        throw new Error('Ezin da abesti hau onartu: artista ezezaguna edo generikoa da ("Release" edo "Various Artists").');
      }
    }
    
    return {
      title: realTitle || 'Ezezaguna',
      artist: realArtist || 'Ezezaguna'
    };
  }

  static generateSearchQueries(title: string): string[] {
    const queries = new Set<string>();
    const rawTitle = title;
    
    const junkRegex = /(official video|videoclip|visualizer|lyric video|official music video|video oficial|oficial video|bideoa|bideoklipa|bideoklip ofiziala|lyric|audio|hd|4k|remastered)/gi;
    const cleanTitle = rawTitle.replace(junkRegex, "").trim();
    if (cleanTitle) queries.add(cleanTitle);

    const noBrackets = cleanTitle.replace(/[\(\[【].*?[\)\]】]/g, "").trim();
    if (noBrackets.length > 3) queries.add(noBrackets);

    const chunks = cleanTitle.split(/[-|/:~]+/);
    chunks.forEach(chunk => {
      const trimmed = chunk.trim();
      if (trimmed.length > 3 && !["remix", "feat", "ft", "prod"].includes(trimmed.toLowerCase())) {
        queries.add(trimmed);
      }
    });

    return Array.from(queries).sort((a, b) => b.length - a.length);
  }

  static async resolveSongGenres(title: string, artist: string): Promise<string[]> {
    const queries = this.generateSearchQueries(title);
    const apiKey = '00fd0a69ecb0b8da72beae351a1268ad';
    
    let bestMatch: any = null;
    for (const query of queries) {
      try {
        let searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${apiKey}&format=json&limit=1`;
        if (artist && artist !== 'Ezezaguna') {
          searchUrl += `&artist=${encodeURIComponent(artist.trim())}`;
        }
        
        const res = await fetch(searchUrl);
        const data: any = await res.json();
        const tracks = data.results?.trackmatches?.track;
        if (tracks) {
          const trackArray = Array.isArray(tracks) ? tracks : [tracks];
          if (trackArray.length > 0) {
            bestMatch = trackArray[0];
            break;
          }
        }
      } catch (e) {
        console.error("Last.fm search error for query", query, ":", e);
      }
    }

    if (!bestMatch && artist && artist !== 'Ezezaguna') {
      for (const query of queries) {
        try {
          const searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${apiKey}&format=json&limit=1`;
          const res = await fetch(searchUrl);
          const data: any = await res.json();
          const tracks = data.results?.trackmatches?.track;
          if (tracks) {
            const trackArray = Array.isArray(tracks) ? tracks : [tracks];
            if (trackArray.length > 0) {
              bestMatch = trackArray[0];
              break;
            }
          }
        } catch (e) {
          console.error("Last.fm fallback search error for query", query, ":", e);
        }
      }
    }

    if (!bestMatch) return [];

    const extractTagNames = (toptags: any) => {
      if (!toptags || !toptags.tag) return [];
      const tags = Array.isArray(toptags.tag) ? toptags.tag : [toptags.tag];
      return tags.slice(0, 5).map((t: any) => t.name.trim());
    };

    let tags: string[] = [];
    const originalArtist = bestMatch.artist.trim();
    try {
      const trackTagsUrl = `https://ws.audioscrobbler.com/2.0/?method=track.gettoptags&artist=${encodeURIComponent(originalArtist)}&track=${encodeURIComponent(bestMatch.name)}&api_key=${apiKey}&format=json`;
      const res = await fetch(trackTagsUrl);
      const data: any = await res.json();
      tags = extractTagNames(data.toptags);
    } catch (e) {
      console.error("Error fetching track tags (unsplit):", e);
    }

    if (tags.length === 0) {
      try {
        const artistTagsUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(originalArtist)}&api_key=${apiKey}&format=json`;
        const res = await fetch(artistTagsUrl);
        const data: any = await res.json();
        tags = extractTagNames(data.toptags);
      } catch (e) {
        console.error("Error fetching artist tags (unsplit):", e);
      }
    }

    if (tags.length === 0) {
      const queryArtist = originalArtist.split(/[,&]|\b(?:feat|ft|and|y|with)\b/i)[0].trim();
      if (queryArtist !== originalArtist) {
        try {
          const trackTagsUrl = `https://ws.audioscrobbler.com/2.0/?method=track.gettoptags&artist=${encodeURIComponent(queryArtist)}&track=${encodeURIComponent(bestMatch.name)}&api_key=${apiKey}&format=json`;
          const res = await fetch(trackTagsUrl);
          const data: any = await res.json();
          tags = extractTagNames(data.toptags);
        } catch (e) {
          console.error("Error fetching track tags (split):", e);
        }

        if (tags.length === 0) {
          try {
            const artistTagsUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(queryArtist)}&api_key=${apiKey}&format=json`;
            const res = await fetch(artistTagsUrl);
            const data: any = await res.json();
            tags = extractTagNames(data.toptags);
          } catch (e) {
            console.error("Error fetching artist tags (split):", e);
          }
        }
      }
    }

    const formattedTags = tags.map(t => 
      t.split(' ')
       .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
       .join(' ')
    );
    
    try {
      const garbageRows = await query("SELECT tag FROM garbage_tags");
      const garbageSet = new Set(garbageRows.map(r => r.tag.toLowerCase()));
      return formattedTags.filter(t => !garbageSet.has(t.toLowerCase()));
    } catch (e) {
      console.error("Error reading garbage tags:", e);
      return formattedTags;
    }
  }

  static async getSpotifyAccessToken(): Promise<string | null> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    try {
      const creds = Buffer.from(clientId + ':' + clientSecret).toString('base64');
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + creds,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      if (res.ok) {
        const data: any = await res.json();
        return data.access_token;
      } else {
        console.error("Spotify token request failed with status:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Error getting Spotify client credentials token:", err);
    }
    return null;
  }

  static async fetchSpotifyPlaylistTracks(playlistId: string, accessToken: string): Promise<string[]> {
    const trackUrls: string[] = [];
    let nextUrl: string | null = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks?limit=100';

    while (nextUrl) {
      try {
        const res = await fetch(nextUrl, {
          headers: {
            'Authorization': 'Bearer ' + accessToken
          }
        });
        if (!res.ok) {
          console.error('Spotify API error ' + res.status + ' fetching tracks:', await res.text());
          break;
        }
        const data: any = await res.json();
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            if (item.track && item.track.id) {
              trackUrls.push('https://open.spotify.com/track/' + item.track.id);
            }
          }
        }
        nextUrl = data.next;
      } catch (err) {
        console.error("Error fetching page from Spotify API:", err);
        break;
      }
    }
    return trackUrls;
  }

  static async parsePlaylist(url: string): Promise<string[]> {
    const urls: string[] = [];
    
    if (url.includes('spotify.com/playlist/') || url.includes('spotify.com/embed/playlist/')) {
      const playlistIdMatch = url.match(/\/playlist\/([^/?#]+)/);
      if (playlistIdMatch) {
        const playlistId = playlistIdMatch[1];
        
        const token = await this.getSpotifyAccessToken();
        if (token) {
          try {
            const apiTracks = await this.fetchSpotifyPlaylistTracks(playlistId, token);
            if (apiTracks.length > 0) {
              console.log('Successfully retrieved ' + apiTracks.length + ' tracks from Spotify API for playlist ' + playlistId);
              return apiTracks;
            }
          } catch (apiErr: any) {
            console.warn("Spotify API retrieval failed, falling back to scraper:", apiErr.message);
          }
        } else {
          console.log("No SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET configured. Falling back to public embed scraper (limited to 100 tracks).");
        }

        try {
          const embedUrl = 'https://open.spotify.com/embed/playlist/' + playlistId;
          const response = await fetch(embedUrl, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          if (response.ok) {
            const html = await response.text();
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (nextDataMatch) {
              const data = JSON.parse(nextDataMatch[1]);
              const trackList = data.props?.pageProps?.state?.data?.entity?.trackList;
              if (Array.isArray(trackList)) {
                trackList.forEach((item: any) => {
                  if (item.uri && item.uri.startsWith('spotify:track:')) {
                    const trackId = item.uri.split(':')[2];
                    urls.push('https://open.spotify.com/track/' + trackId);
                  }
                });
              }
            }
          }
        } catch (e) {
          console.error("Error parsing Spotify playlist scraper:", e);
        }
      }
    } else if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
      const playlistIdMatch = url.match(/[&?]list=([^&]+)/);
      if (playlistIdMatch) {
        const playlistId = playlistIdMatch[1];
        const playlistUrl = 'https://www.youtube.com/playlist?list=' + playlistId;
        
        try {
          const { stdout } = await execFilePromise('/home/gorkius/.local/bin/yt-dlp', [
            '--flat-playlist',
            '--print', 'id',
            playlistUrl
          ], { timeout: 30000 });
          
          const ids = stdout.split('\n').map(id => id.trim()).filter(Boolean);
          if (ids.length > 0) {
            ids.forEach(id => {
              urls.push('https://www.youtube.com/watch?v=' + id);
            });
            console.log('yt-dlp successfully parsed ' + urls.length + ' tracks from YouTube playlist.');
            return urls;
          }
        } catch (yterr: any) {
          console.warn("yt-dlp failed, falling back to YouTube HTML scraper:", yterr.message);
        }

        try {
          const response = await fetch(playlistUrl, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cookie': 'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg'
            }
          });
          if (response.ok) {
            const html = await response.text();
            const match = html.match(/var ytInitialData = (\{[\s\S]*?\});/);
            if (match) {
              const data = JSON.parse(match[1]);
              const videoIds: string[] = [];
              function searchVideoIds(obj: any) {
                if (!obj) return;
                if (typeof obj === 'object') {
                  if (obj.videoId) {
                    videoIds.push(obj.videoId);
                  }
                  for (const k in obj) {
                    searchVideoIds(obj[k]);
                  }
                }
              }
              searchVideoIds(data);
              const uniqueIds = Array.from(new Set(videoIds));
              uniqueIds.forEach(id => {
                urls.push('https://www.youtube.com/watch?v=' + id);
              });
            }
          }
        } catch (e) {
          console.error("Error parsing YouTube playlist fallback:", e);
        }
      }
    }
    
    return urls;
  }

  static async loadTagMappingsMap(): Promise<Map<string, string>> {
    try {
      const mappings = await query('SELECT original_tag, canonical_tag FROM tag_mappings');
      const mappingsMap = new Map<string, string>();
      mappings.forEach(m => {
        mappingsMap.set(m.original_tag.trim().toLowerCase(), m.canonical_tag.trim());
      });
      return mappingsMap;
    } catch (e) {
      console.error("Error loading tag mappings:", e);
      return new Map();
    }
  }

  static applyTagMappings(genres: string[], mappingsMap: Map<string, string>): string[] {
    if (!Array.isArray(genres)) return [];
    const mapped = genres.map(g => {
      if (typeof g !== 'string') return g;
      const trimmed = g.trim();
      const lower = trimmed.toLowerCase();
      if (mappingsMap && mappingsMap.has(lower)) {
        return mappingsMap.get(lower)!;
      }
      return trimmed;
    }).filter(Boolean);
    
    const seen = new Set<string>();
    const unique: string[] = [];
    mapped.forEach(g => {
      const lower = g.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(g);
      }
    });
    return unique;
  }
}
