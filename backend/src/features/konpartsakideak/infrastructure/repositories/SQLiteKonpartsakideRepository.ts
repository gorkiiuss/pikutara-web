import { Konpartsakide } from '../../domain/models/Konpartsakide.js';
import { KonpartsakideRepository } from '../../domain/repositories/KonpartsakideRepository.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLiteKonpartsakideRepository implements KonpartsakideRepository {
  async findAll(): Promise<Konpartsakide[]> {
    return query('SELECT * FROM konpartsakideak ORDER BY izena ASC');
  }

  async findMoneyCollectors(): Promise<Konpartsakide[]> {
    return query(
      'SELECT id, izena, instagram, telefono FROM konpartsakideak WHERE dirua_jaso = 1 ORDER BY izena ASC'
    );
  }

  async findById(id: number): Promise<Konpartsakide | null> {
    const row = await get('SELECT * FROM konpartsakideak WHERE id = ?', [id]);
    return row || null;
  }

  async save(k: Konpartsakide): Promise<void> {
    await run(
      'INSERT INTO konpartsakideak (izena, dirua_jaso, instagram, telefono) VALUES (?, ?, ?, ?)',
      [k.izena, k.dirua_jaso, k.instagram || '', k.telefono || '']
    );
  }

  async update(id: number, k: Partial<Konpartsakide>): Promise<void> {
    await run(
      'UPDATE konpartsakideak SET izena = ?, dirua_jaso = ?, instagram = ?, telefono = ? WHERE id = ?',
      [k.izena, k.dirua_jaso, k.instagram || '', k.telefono || '', id]
    );
  }

  async delete(id: number): Promise<void> {
    await run('DELETE FROM konpartsakideak WHERE id = ?', [id]);
  }
}
