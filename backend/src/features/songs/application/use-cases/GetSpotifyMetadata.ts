import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export class GetSpotifyMetadata {
  async execute(url: string): Promise<any> {
    if (!url) {
      throw new Error('URL falta da.');
    }

    let title = '';
    let artist = '';
    let thumbnail_url = '';
    let preview_url = '';

    // 1. Try Embed NEXT_DATA
    const trackIdMatch = url.match(/\/track\/([^/?#]+)/);
    if (trackIdMatch) {
      const trackId = trackIdMatch[1];
      try {
        const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
        const embedRes = await fetch(embedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        if (embedRes.ok) {
          const html = await embedRes.text();
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
          if (nextDataMatch) {
            const data = JSON.parse(nextDataMatch[1]);
            const entity = data.props?.pageProps?.state?.data?.entity;
            if (entity) {
              title = entity.name || entity.title || '';
              artist = entity.artists ? entity.artists.map((a: any) => a.name).join(', ') : '';
              preview_url = entity.audioPreview?.url || '';

              const images = entity.visualIdentity?.image || [];
              if (images.length > 0) {
                const bestImage = images.find((img: any) => img.maxWidth === 640) || images[0];
                thumbnail_url = bestImage.url || '';
              }
            }
          }
        }
      } catch (embedErr) {
        console.error("Error scraping Spotify embed in use case:", embedErr);
      }
    }

    // 2. Fallback to oEmbed + scrape
    if (!title || !artist) {
      try {
        const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (response.ok) {
          const data: any = await response.json();
          title = title || data.title || '';
          thumbnail_url = thumbnail_url || data.thumbnail_url || '';
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
            artist = artist || twitterMatch[1].trim();
          } else {
            const musicianMatch = html.match(/<meta name="music:musician_description" content="([^"]+)"/);
            if (musicianMatch) {
              artist = artist || musicianMatch[1].trim();
            } else {
              const descMatch = html.match(/Song · ([^·]+) ·/);
              if (descMatch) {
                artist = artist || descMatch[1].trim();
              }
            }
          }
        }
      } catch (fbErr) {
        console.error("Error in Spotify metadata fallback in use case:", fbErr);
      }
    }

    return {
      thumbnail_url,
      title,
      artist,
      preview_url
    };
  }
}
