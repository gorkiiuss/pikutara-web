import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { TagMapping } from '../../domain/models/RulesModels.js';

export class BulkImportTagMappings {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(rawMappings: any[]): Promise<number> {
    if (!rawMappings || !Array.isArray(rawMappings)) {
      throw new Error('Array bat espero zen.');
    }

    const mappingsToSave: TagMapping[] = [];
    for (const m of rawMappings) {
      if (m && typeof m === 'object') {
        const orig = m.original_tag || m.original;
        const canon = m.canonical_tag || m.canonical;
        if (orig && typeof orig === 'string' && canon && typeof canon === 'string') {
          const cleanOrig = orig.trim();
          const cleanCanon = canon.trim();
          if (cleanOrig.toLowerCase() !== cleanCanon.toLowerCase()) {
            mappingsToSave.push(new TagMapping(cleanOrig, cleanCanon));
          }
        }
      }
    }

    await this.rulesRepository.bulkSaveTagMappings(mappingsToSave);
    return mappingsToSave.length;
  }
}
