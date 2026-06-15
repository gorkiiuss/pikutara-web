import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { Song } from '../../domain/models/Song.js';
import { query, run, get } from '../../../../shared/database.js';
import { safeParseArray } from '../../../../shared/helpers.js';

export class SQLiteSongRepository implements SongRepository {
  private mapRowToSong(row: any): Song {
    return new Song(
      row.id,
      row.url,
      row.real_title,
      row.real_artist,
      safeParseArray(row.proposed_titles),
      safeParseArray(row.proposed_artists),
      safeParseArray(row.submitters),
      safeParseArray(row.comments),
      safeParseArray(row.ips),
      row.status,
      safeParseArray(row.genres),
      row.accepted_by,
      row.created_at,
      row.lyrics,
      safeParseArray(row.language)
    );
  }

  async findAccepted(): Promise<Song[]> {
    const rows = await query("SELECT * FROM songs WHERE status = 'accepted' ORDER BY created_at DESC");
    return rows.map(r => this.mapRowToSong(r));
  }

  async findPending(): Promise<Song[]> {
    const rows = await query("SELECT * FROM songs WHERE status = 'pending' ORDER BY created_at ASC");
    return rows.map(r => this.mapRowToSong(r));
  }

  async findById(id: number): Promise<Song | null> {
    const row = await get('SELECT * FROM songs WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapRowToSong(row);
  }

  async findByUrl(url: string): Promise<Song | null> {
    const row = await get('SELECT * FROM songs WHERE url = ?', [url]);
    if (!row) return null;
    return this.mapRowToSong(row);
  }

  async findAll(): Promise<Song[]> {
    const rows = await query('SELECT * FROM songs ORDER BY created_at DESC');
    return rows.map(r => this.mapRowToSong(r));
  }

  async save(song: Song): Promise<Song> {
    if (song.id !== null) {
      await run(
        `UPDATE songs SET 
          url = ?, 
          real_title = ?, 
          real_artist = ?, 
          proposed_titles = ?, 
          proposed_artists = ?, 
          submitters = ?, 
          comments = ?, 
          ips = ?, 
          status = ?, 
          genres = ?, 
          accepted_by = ?,
          lyrics = ?,
          language = ?
        WHERE id = ?`,
        [
          song.url,
          song.realTitle,
          song.realArtist,
          JSON.stringify(song.proposedTitles),
          JSON.stringify(song.proposedArtists),
          JSON.stringify(song.submitters),
          JSON.stringify(song.comments),
          JSON.stringify(song.ips),
          song.status,
          JSON.stringify(song.genres),
          song.acceptedBy,
          song.lyrics,
          JSON.stringify(song.language),
          song.id
        ]
      );
      return song;
    } else {
      const result = await run(
        `INSERT INTO songs (
          url, 
          real_title, 
          real_artist, 
          proposed_titles, 
          proposed_artists, 
          submitters, 
          comments, 
          ips, 
          status, 
          genres, 
          accepted_by,
          lyrics,
          language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          song.url,
          song.realTitle,
          song.realArtist,
          JSON.stringify(song.proposedTitles),
          JSON.stringify(song.proposedArtists),
          JSON.stringify(song.submitters),
          JSON.stringify(song.comments),
          JSON.stringify(song.ips),
          song.status,
          JSON.stringify(song.genres),
          song.acceptedBy,
          song.lyrics,
          JSON.stringify(song.language)
        ]
      );
      song.id = result.lastID;
      return song;
    }
  }

  async delete(id: number): Promise<void> {
    await run('DELETE FROM songs WHERE id = ?', [id]);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await run(`DELETE FROM songs WHERE id IN (${placeholders})`, ids);
  }

  async findUntagged(): Promise<Song[]> {
    const rows = await query("SELECT * FROM songs WHERE genres = '[]' OR genres = '' OR genres IS NULL ORDER BY created_at DESC");
    return rows.map(r => this.mapRowToSong(r));
  }

  async updateLyrics(id: number, lyrics: string): Promise<void> {
    await run("UPDATE songs SET lyrics = ? WHERE id = ?", [lyrics, id]);
  }
}
