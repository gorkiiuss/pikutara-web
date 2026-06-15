import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { query, run } from '../../../../shared/database.js';

export class AddGarbageTag {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(tag: string): Promise<void> {
    const cleanTag = tag.trim();
    if (!cleanTag) {
      throw new Error('Etiketa baliogabea.');
    }
    const lowerCleanTag = cleanTag.toLowerCase();

    // 1. Add to garbage_tags
    await this.rulesRepository.addGarbageTag(cleanTag);

    // 2. Synchronize: remove the newly added garbage tag from all songs in database
    const songs = await query('SELECT id, genres FROM songs');
    for (const song of songs) {
      let genres: string[] = [];
      try {
        genres = JSON.parse(song.genres || '[]');
      } catch (e) {}

      if (Array.isArray(genres)) {
        const filtered = genres.filter(g => g.toLowerCase() !== lowerCleanTag);
        if (filtered.length !== genres.length) {
          await run('UPDATE songs SET genres = ? WHERE id = ?', [JSON.stringify(filtered), song.id]);
        }
      }
    }
  }
}
