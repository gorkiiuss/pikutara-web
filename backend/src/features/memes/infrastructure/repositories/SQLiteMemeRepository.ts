import { MemeRepository } from '../../domain/repositories/MemeRepository.js';
import { Meme } from '../../domain/models/Meme.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLiteMemeRepository implements MemeRepository {
  async getAll(): Promise<Meme[]> {
    const rows = await query('SELECT id, title, contact, image_path, votes, is_approved, created_at FROM memes ORDER BY created_at DESC');
    return rows.map(r => new Meme(r.id, r.title, r.contact, r.image_path, r.votes, r.is_approved === 1, r.created_at));
  }

  async getApproved(): Promise<Meme[]> {
    const rows = await query('SELECT id, title, contact, image_path, votes, is_approved, created_at FROM memes WHERE is_approved = 1 ORDER BY votes DESC, created_at DESC');
    return rows.map(r => new Meme(r.id, r.title, r.contact, r.image_path, r.votes, r.is_approved === 1, r.created_at));
  }

  async getById(id: number): Promise<Meme | null> {
    const row = await get('SELECT id, title, contact, image_path, votes, is_approved, created_at FROM memes WHERE id = ?', [id]);
    if (!row) return null;
    return new Meme(row.id, row.title, row.contact, row.image_path, row.votes, row.is_approved === 1, row.created_at);
  }

  async create(meme: Meme): Promise<Meme> {
    const result = await run(
      'INSERT INTO memes (title, contact, image_path, votes, is_approved) VALUES (?, ?, ?, ?, ?)',
      [meme.title, meme.contact, meme.imagePath, meme.votes, meme.isApproved ? 1 : 0]
    );
    meme.id = result.lastID;
    return meme;
  }

  async update(meme: Meme): Promise<boolean> {
    const result = await run(
      'UPDATE memes SET title = ?, contact = ?, image_path = ?, votes = ?, is_approved = ? WHERE id = ?',
      [meme.title, meme.contact, meme.imagePath, meme.votes, meme.isApproved ? 1 : 0, meme.id]
    );
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await run('DELETE FROM memes WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
