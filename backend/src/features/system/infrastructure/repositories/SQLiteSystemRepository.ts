import { SystemRepository } from '../../domain/repositories/SystemRepository.js';
import { Section } from '../../domain/models/Section.js';
import { query, run, get } from '../../../../shared/database.js';

export class SQLiteSystemRepository implements SystemRepository {
  async getSections(): Promise<Section[]> {
    const rows = await query('SELECT key, name, is_active FROM sections');
    return rows.map(r => new Section(r.key, r.name, r.is_active === 1));
  }

  async getSectionByKey(key: string): Promise<Section | null> {
    const row = await get('SELECT key, name, is_active FROM sections WHERE key = ?', [key]);
    if (!row) return null;
    return new Section(row.key, row.name, row.is_active === 1);
  }

  async updateSection(section: Section): Promise<boolean> {
    const result = await run('UPDATE sections SET is_active = ? WHERE key = ?', [
      section.isActive ? 1 : 0,
      section.key
    ]);
    return result.changes > 0;
  }

  async incrementPageView(path: string): Promise<number> {
    const row = await get('SELECT views FROM page_views WHERE path = ?', [path]);
    if (row) {
      const newViews = row.views + 1;
      await run('UPDATE page_views SET views = ? WHERE path = ?', [newViews, path]);
      return newViews;
    } else {
      await run('INSERT INTO page_views (path, views) VALUES (?, 1)', [path]);
      return 1;
    }
  }
}
