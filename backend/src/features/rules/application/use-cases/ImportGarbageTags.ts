import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { query, run } from '../../../../shared/database.js';

export class ImportGarbageTags {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(tags: string[]): Promise<number> {
    if (!tags || !Array.isArray(tags)) {
      throw new Error('Etiketa zerrenda okerra.');
    }

    let importedCount = 0;
    for (const tag of tags) {
      if (tag && typeof tag === 'string' && tag.trim()) {
        const cleanTag = tag.trim();
        const lowerCleanTag = cleanTag.toLowerCase();

        await this.rulesRepository.addGarbageTag(cleanTag);

        // Clean existing songs
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
        importedCount++;
      }
    }
    return importedCount;
  }
}
