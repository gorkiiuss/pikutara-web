import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { TagMapping } from '../../domain/models/RulesModels.js';

export interface SaveTagMappingDTO {
  originalTag: string;
  canonicalTag: string;
}

export class SaveTagMapping {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(dto: SaveTagMappingDTO): Promise<void> {
    const cleanOrig = dto.originalTag.trim();
    const cleanCanon = dto.canonicalTag.trim();

    if (!cleanOrig || !cleanCanon) {
      throw new Error('Datu baliogabeak.');
    }

    if (cleanOrig.toLowerCase() === cleanCanon.toLowerCase()) {
      throw new Error('Ezin da etiketa bat bere buruarekin lotu.');
    }

    const mapping = new TagMapping(cleanOrig, cleanCanon);
    await this.rulesRepository.saveTagMapping(mapping);
  }
}
