import { PosterRepository } from '../../domain/repositories/PosterRepository.js';
import { Poster } from '../../domain/models/Poster.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLitePosterRepository implements PosterRepository {
  async getAll(): Promise<Poster[]> {
    const rows = await query('SELECT id, title, event_date, description, bands, file_path, created_at FROM posters ORDER BY created_at DESC');
    return rows.map(r => new Poster(r.id, r.title, r.event_date, r.description, r.bands, r.file_path, r.created_at));
  }

  async getById(id: number): Promise<Poster | null> {
    const row = await get('SELECT id, title, event_date, description, bands, file_path, created_at FROM posters WHERE id = ?', [id]);
    if (!row) return null;
    return new Poster(row.id, row.title, row.event_date, row.description, row.bands, row.file_path, row.created_at);
  }

  async create(poster: Poster): Promise<Poster> {
    const result = await run(
      'INSERT INTO posters (title, event_date, description, bands, file_path) VALUES (?, ?, ?, ?, ?)',
      [poster.title, poster.eventDate, poster.description, poster.bands, poster.filePath]
    );
    poster.id = result.lastID;
    return poster;
  }

  async update(poster: Poster): Promise<boolean> {
    const result = await run(
      'UPDATE posters SET title = ?, event_date = ?, description = ?, bands = ?, file_path = ? WHERE id = ?',
      [poster.title, poster.eventDate, poster.description, poster.bands, poster.filePath, poster.id]
    );
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await run('DELETE FROM posters WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
