import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { GenreHierarchy } from '../../domain/models/RulesModels.js';

export class BulkImportGenreHierarchies {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(rawHierarchy: any[]): Promise<number> {
    if (!rawHierarchy || !Array.isArray(rawHierarchy)) {
      throw new Error('Array bat espero zen.');
    }

    const hierarchiesToSave: GenreHierarchy[] = [];
    for (const h of rawHierarchy) {
      if (h && typeof h === 'object') {
        const gen = h.genre;
        const parent = h.parent_genre || h.parent;
        if (gen && typeof gen === 'string' && parent && typeof parent === 'string') {
          const cleanGenre = gen.trim();
          const cleanParent = parent.trim();
          if (cleanGenre.toLowerCase() !== cleanParent.toLowerCase()) {
            hierarchiesToSave.push(new GenreHierarchy(cleanGenre, cleanParent));
          }
        }
      }
    }

    await this.rulesRepository.bulkSaveGenreHierarchies(hierarchiesToSave);
    return hierarchiesToSave.length;
  }
}
