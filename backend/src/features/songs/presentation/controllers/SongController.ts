import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { SQLiteSongRepository } from '../../infrastructure/repositories/SQLiteSongRepository.js';

import { ListSongs } from '../../application/use-cases/ListSongs.js';
import { ListPendingSongs } from '../../application/use-cases/ListPendingSongs.js';
import { GetSongStats } from '../../application/use-cases/GetSongStats.js';
import { ProposeSong } from '../../application/use-cases/ProposeSong.js';
import { SwipeSong } from '../../application/use-cases/SwipeSong.js';
import { DirectAddSong } from '../../application/use-cases/DirectAddSong.js';
import { ReResolveAllSongs } from '../../application/use-cases/ReResolveAllSongs.js';
import { DeleteSong } from '../../application/use-cases/DeleteSong.js';
import { BulkDeleteSongs } from '../../application/use-cases/BulkDeleteSongs.js';
import { ResolveSongGenresSingle } from '../../application/use-cases/ResolveSongGenresSingle.js';
import { UpdateSongMetadata } from '../../application/use-cases/UpdateSongMetadata.js';
import { GetGenresAutocomplete } from '../../application/use-cases/GetGenresAutocomplete.js';
import { GetSpotifyMetadata } from '../../application/use-cases/GetSpotifyMetadata.js';
import { WebhookUpdateSong } from '../../application/use-cases/WebhookUpdateSong.js';

const songRepository = new SQLiteSongRepository();

export class SongController {
  static async listSongs(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new ListSongs(songRepository);
      const songs = await useCase.execute();
      res.json(songs.map(s => ({
        id: s.id,
        url: s.url,
        real_title: s.realTitle,
        real_artist: s.realArtist,
        proposed_titles: s.proposedTitles,
        proposed_artists: s.proposedArtists,
        submitters: s.submitters,
        comments: s.comments,
        ips: s.ips,
        status: s.status,
        genres: s.genres,
        accepted_by: s.acceptedBy,
        created_at: s.createdAt
      })));
    } catch (err: any) {
      console.error('Error in listSongs controller:', err);
      res.status(500).json({ error: 'Errorea datu-basean' });
    }
  }

  static async proposeSong(req: Request, res: Response): Promise<void> {
    try {
      const { url, title, artist, submittedBy, comment } = req.body;
      const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

      const useCase = new ProposeSong(songRepository);
      const result = await useCase.execute({ url, title, artist, submittedBy, comment, ip });
      
      if (result.message) {
        res.status(201).json({ success: true, message: result.message });
      } else {
        res.status(201).json({ success: true });
      }
    } catch (err: any) {
      console.error('Error in proposeSong controller:', err);
      if (err.message && (err.message.includes('ez dago erabilgarri') || err.message.includes('artista ezezaguna edo generikoa'))) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: err.message || 'Errorea abestia gordetzean.' });
    }
  }

  static async listPendingSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new ListPendingSongs(songRepository);
      const songs = await useCase.execute();
      res.json(songs.map(s => ({
        id: s.id,
        url: s.url,
        real_title: s.realTitle,
        real_artist: s.realArtist,
        proposed_titles: s.proposedTitles,
        proposed_artists: s.proposedArtists,
        submitters: s.submitters,
        comments: s.comments,
        ips: s.ips,
        status: s.status,
        genres: s.genres,
        accepted_by: s.acceptedBy,
        created_at: s.createdAt
      })));
    } catch (err: any) {
      console.error('Error in listPendingSongs controller:', err);
      res.status(500).json({ error: 'Errorea kantuak lortzean' });
    }
  }

  static async getSongStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new GetSongStats(songRepository);
      const stats = await useCase.execute();
      res.json(stats);
    } catch (err: any) {
      console.error('Error in getSongStats controller:', err);
      res.status(500).json({ error: 'Errorea estatistikak lortzean' });
    }
  }

  static async swipeSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status, genres } = req.body;
      const adminUser = req.user ? req.user.username : 'admin';

      const useCase = new SwipeSong(songRepository);
      await useCase.execute({ id, status, genres, adminUser });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in swipeSong controller:', err);
      res.status(500).json({ error: err.message || 'Errorea eguneratzean.' });
    }
  }

  static async directAddSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { url, mode, submitter, comment } = req.body;
      const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
      const adminUser = req.user ? req.user.username : 'admin';

      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');

      const useCase = new DirectAddSong(songRepository);
      await useCase.execute(
        { url, mode, submitter, comment, ip, adminUser },
        (data) => {
          res.write(JSON.stringify(data) + '\n');
        }
      );
      res.end();
    } catch (err: any) {
      console.error('Error in directAddSong controller:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Errorea abestiak zuzenean gehitzean: ' + err.message });
      } else {
        res.write(JSON.stringify({ status: 'error', message: err.message }) + '\n');
        res.end();
      }
    }
  }

  static async reResolveAllSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');

      const useCase = new ReResolveAllSongs(songRepository);
      await useCase.execute((data) => {
        res.write(JSON.stringify(data) + '\n');
      });
      res.end();
    } catch (err: any) {
      console.error('Error in reResolveAllSongs controller:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Errorea generoak berriz eskuratzean: ' + err.message });
      } else {
        res.write(JSON.stringify({ status: 'error', message: err.message }) + '\n');
        res.end();
      }
    }
  }

  static async deleteSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const useCase = new DeleteSong(songRepository);
      await useCase.execute(id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in deleteSong controller:', err);
      res.status(500).json({ error: err.message || 'Errorea abestia ezabatzean.' });
    }
  }

  static async bulkDeleteSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const useCase = new BulkDeleteSongs(songRepository);
      const count = await useCase.execute(ids);
      res.json({ success: true, count });
    } catch (err: any) {
      console.error('Error in bulkDeleteSongs controller:', err);
      res.status(500).json({ error: err.message || 'Errorea abestiak inportatzean.' });
    }
  }

  static async resolveSongGenresSingle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { title, artist } = req.body;
      const useCase = new ResolveSongGenresSingle(songRepository);
      const genres = await useCase.execute({ id, title, artist });
      res.json({ success: true, genres });
    } catch (err: any) {
      console.error('Error in resolveSongGenresSingle controller:', err);
      res.status(500).json({ error: err.message || 'Errorea generoak ebaztean.' });
    }
  }

  static async updateSongMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { title, artist, genres, submitters, comments } = req.body;
      const useCase = new UpdateSongMetadata(songRepository);
      await useCase.execute({ id, title, artist, genres, submitters, comments });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in updateSongMetadata controller:', err);
      res.status(500).json({ error: err.message || 'Errorea eguneratzean.' });
    }
  }

  static async getGenresAutocomplete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new GetGenresAutocomplete(songRepository);
      const genres = await useCase.execute();
      res.json(genres);
    } catch (err: any) {
      console.error('Error in getGenresAutocomplete controller:', err);
      res.status(500).json({ error: 'Errorea generoak eskuratzean.' });
    }
  }

  static async getSpotifyMetadata(req: Request, res: Response): Promise<void> {
    try {
      const url = req.query.url as string;
      const useCase = new GetSpotifyMetadata();
      const metadata = await useCase.execute(url);
      res.json(metadata);
    } catch (err: any) {
      console.error('Error in getSpotifyMetadata controller:', err);
      res.status(500).json({ error: err.message || 'Errorea zerbitzarian.' });
    }
  }

  static async webhookUpdateSong(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status, genres } = req.body;
      const useCase = new WebhookUpdateSong(songRepository);
      await useCase.execute({ id, status, genres });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in webhookUpdateSong controller:', err);
      res.status(500).json({ error: err.message || 'Errorea eguneratzean.' });
    }
  }

  static async getUntaggedSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const songs = await songRepository.findUntagged();
      res.json(songs.map(s => ({
        id: s.id,
        url: s.url,
        real_title: s.realTitle,
        real_artist: s.realArtist,
        proposed_titles: s.proposedTitles,
        proposed_artists: s.proposedArtists,
        submitters: s.submitters,
        comments: s.comments,
        ips: s.ips,
        status: s.status,
        genres: s.genres,
        accepted_by: s.acceptedBy,
        created_at: s.createdAt
      })));
    } catch (err: any) {
      console.error('Error in getUntaggedSongs controller:', err);
      res.status(500).json({ error: 'Errorea sailkatu gabeko kantuak lortzean' });
    }
  }

  static async getSongLyrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const song = await songRepository.findById(id);
      if (!song) {
        res.status(404).json({ error: 'Ez da abestia aurkitu.' });
        return;
      }

      if (song.lyrics) {
        res.json({ lyrics: song.lyrics, source: 'cache' });
        return;
      }

      const trackQuery = encodeURIComponent(song.realTitle || '');
      const artistQuery = encodeURIComponent(song.realArtist || '');
      const url = `https://lrclib.net/api/search?track_name=${trackQuery}&artist_name=${artistQuery}`;

      const lrcRes = await fetch(url, {
        headers: {
          'User-Agent': 'Pikutara-TinderMusikal/1.0 (https://github.com/txartelari)'
        }
      });

      if (!lrcRes.ok) {
        res.json({ lyrics: null, error: 'API errorea letrak bilatzean.' });
        return;
      }

      const data: any = await lrcRes.json();

      if (!data || data.length === 0 || !data[0].plainLyrics) {
        res.json({ lyrics: null, error: 'Ez da letrarik aurkitu LRCLIB-en.' });
        return;
      }

      const lyricsText = data[0].plainLyrics;
      await songRepository.updateLyrics(id, lyricsText);

      res.json({ lyrics: lyricsText, source: 'lrclib' });
    } catch (err: any) {
      console.error('Error in getSongLyrics controller:', err);
      res.status(500).json({ error: 'Errorea letrak kargatzean.' });
    }
  }

  static async exportSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const allSongs = await songRepository.findAll();
      res.json(allSongs.map(s => ({
        id: s.id,
        url: s.url,
        real_title: s.realTitle,
        real_artist: s.realArtist,
        proposed_titles: s.proposedTitles,
        proposed_artists: s.proposedArtists,
        submitters: s.submitters,
        comments: s.comments,
        ips: s.ips,
        status: s.status,
        genres: s.genres,
        accepted_by: s.acceptedBy,
        created_at: s.createdAt,
        lyrics: s.lyrics,
        language: s.language
      })));
    } catch (err: any) {
      console.error('Error in exportSongs controller:', err);
      res.status(500).json({ error: 'Errorea kantuak esportatzean.' });
    }
  }

  static async tagSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { genres, artist } = req.body;
      if (!genres || !Array.isArray(genres) || genres.length === 0) {
        res.status(400).json({ error: 'Gutxienez genero bat behar da.' });
        return;
      }

      const song = await songRepository.findById(id);
      if (!song) {
        res.status(404).json({ error: 'Ez da abestia aurkitu.' });
        return;
      }

      song.genres = genres;
      await songRepository.save(song);

      const targetArtist = artist || song.realArtist;
      const splitArtists = (artistString: string): string[] => {
        if (!artistString || artistString === 'Ezezaguna') return [];
        return artistString.split(/\s*(?:,|&|\+|\by\b|\bft\.?\b|\bfeat\.?\b)\s*/i).map(a => a.trim());
      };

      const artistList = splitArtists(targetArtist || '');
      let affectedCount = 0;

      if (artistList.length > 0) {
        const { get, run } = await import('../../../../shared/database.js');
        let anyTagged = false;
        for (const a of artistList) {
          const exists = await get("SELECT 1 FROM artist_genres WHERE LOWER(artist) = LOWER(?)", [a]);
          if (exists) {
            anyTagged = true;
            break;
          }
        }

        if (!anyTagged) {
          const firstArtist = artistList[0];
          await run("INSERT OR REPLACE INTO artist_genres (artist, genres, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)", [
            firstArtist,
            JSON.stringify(genres)
          ]);

          const untaggedSongs = await songRepository.findUntagged();
          for (const uSong of untaggedSongs) {
            const uArtistList = splitArtists(uSong.realArtist || '');
            if (uArtistList.some(a => a.toLowerCase() === firstArtist.toLowerCase())) {
              uSong.genres = genres;
              await songRepository.save(uSong);
              affectedCount++;
            }
          }

          if (affectedCount > 0) {
            console.log(`[Optimizazioa - Tag] ${affectedCount} kantu automatikoki sailkatu dira "${firstArtist}" artistarentzat.`);
          }
        }
      }

      res.json({ success: true, affectedCount });
    } catch (err: any) {
      console.error('Error in tagSong controller:', err);
      res.status(500).json({ error: 'Errorea generoak gordetzean.' });
    }
  }
}
