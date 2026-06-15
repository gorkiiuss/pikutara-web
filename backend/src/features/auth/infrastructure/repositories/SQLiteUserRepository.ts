import { UserRepository } from '../../domain/repositories/UserRepository.js';
import { User } from '../../domain/models/User.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLiteUserRepository implements UserRepository {
  async getAll(): Promise<User[]> {
    const rows = await query('SELECT id, username, password_hash, salt, role, created_at FROM users ORDER BY username ASC');
    return rows.map(r => new User(r.id, r.username, r.password_hash, r.salt, r.role, r.created_at));
  }

  async getById(id: number): Promise<User | null> {
    const row = await get('SELECT id, username, password_hash, salt, role, created_at FROM users WHERE id = ?', [id]);
    if (!row) return null;
    return new User(row.id, row.username, row.password_hash, row.salt, row.role, row.created_at);
  }

  async getByUsername(username: string): Promise<User | null> {
    const row = await get('SELECT id, username, password_hash, salt, role, created_at FROM users WHERE username = ?', [username]);
    if (!row) return null;
    return new User(row.id, row.username, row.password_hash, row.salt, row.role, row.created_at);
  }

  async create(user: User): Promise<User> {
    const result = await run(
      'INSERT INTO users (username, password_hash, salt, role) VALUES (?, ?, ?, ?)',
      [user.username, user.passwordHash, user.salt, user.role]
    );
    user.id = result.lastID;
    return user;
  }

  async delete(id: number): Promise<boolean> {
    const result = await run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
