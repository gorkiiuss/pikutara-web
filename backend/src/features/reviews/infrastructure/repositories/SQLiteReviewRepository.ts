import { ReviewRepository } from '../../domain/repositories/ReviewRepository.js';
import { Review } from '../../domain/models/Review.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLiteReviewRepository implements ReviewRepository {
  async getAll(): Promise<Review[]> {
    const rows = await query('SELECT id, rating, comment, ip_address, created_at FROM playlist_reviews ORDER BY created_at DESC');
    return rows.map(r => new Review(r.id, r.rating, r.comment, r.ip_address, r.created_at));
  }

  async getById(id: number): Promise<Review | null> {
    const row = await get('SELECT id, rating, comment, ip_address, created_at FROM playlist_reviews WHERE id = ?', [id]);
    if (!row) return null;
    return new Review(row.id, row.rating, row.comment, row.ip_address, row.created_at);
  }

  async getByIpAddress(ipAddress: string): Promise<Review | null> {
    const row = await get('SELECT id, rating, comment, ip_address, created_at FROM playlist_reviews WHERE ip_address = ?', [ipAddress]);
    if (!row) return null;
    return new Review(row.id, row.rating, row.comment, row.ip_address, row.created_at);
  }

  async create(review: Review): Promise<Review> {
    const result = await run(
      'INSERT INTO playlist_reviews (rating, comment, ip_address) VALUES (?, ?, ?)',
      [review.rating, review.comment, review.ipAddress]
    );
    review.id = result.lastID;
    return review;
  }

  async delete(id: number): Promise<boolean> {
    const result = await run('DELETE FROM playlist_reviews WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
