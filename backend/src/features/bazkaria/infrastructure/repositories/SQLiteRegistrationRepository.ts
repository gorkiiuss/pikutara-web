import { Registration } from '../../domain/models/Registration.js';
import { RegistrationRepository } from '../../domain/repositories/RegistrationRepository.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLiteRegistrationRepository implements RegistrationRepository {
  async findAll(): Promise<Registration[]> {
    return query(`
      SELECT r.*, k.izena as konpartsakide_izena
      FROM bazkaria_registrations r
      LEFT JOIN konpartsakideak k ON r.konpartsakide_id = k.id
      ORDER BY r.created_at DESC
    `);
  }

  async findById(id: number): Promise<Registration | null> {
    const row = await get('SELECT * FROM bazkaria_registrations WHERE id = ?', [id]);
    return row || null;
  }

  async findByEmailAndName(email: string, izena: string, abizenak: string): Promise<Registration | null> {
    const row = await get(
      `SELECT * FROM bazkaria_registrations 
       WHERE LOWER(email) = ? AND LOWER(izena) = ? AND LOWER(abizenak) = ?`,
      [email.trim().toLowerCase(), izena.trim().toLowerCase(), abizenak.trim().toLowerCase()]
    );
    return row || null;
  }

  async findByEmailAndNameAndMote(email: string, izena: string, abizenak: string, mote: string): Promise<Registration | null> {
    const row = await get(
      `SELECT * FROM bazkaria_registrations 
       WHERE LOWER(email) = ? AND LOWER(izena) = ? AND LOWER(abizenak) = ? AND LOWER(mote) = ?`,
      [
        email.trim().toLowerCase(),
        izena.trim().toLowerCase(),
        abizenak.trim().toLowerCase(),
        mote.trim().toLowerCase()
      ]
    );
    return row || null;
  }

  async save(r: Registration): Promise<void> {
    await run(
      `INSERT INTO bazkaria_registrations (izena, abizenak, email, menu_type, ordainketa_modua, konpartsakide_id, oharrak, mote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.izena,
        r.abizenak,
        r.email,
        r.menu_type,
        r.ordainketa_modua,
        r.konpartsakide_id || null,
        r.oharrak || null,
        r.mote || null
      ]
    );
  }

  async updatePaymentStatus(id: number, isPaid: number): Promise<void> {
    await run('UPDATE bazkaria_registrations SET is_paid = ? WHERE id = ?', [isPaid, id]);
  }

  async delete(id: number): Promise<void> {
    await run('DELETE FROM bazkaria_registrations WHERE id = ?', [id]);
  }
}
