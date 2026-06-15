import { RulesRepository } from '../../domain/repositories/RulesRepository.js';

export class DeleteGarbageTag {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(tag: string): Promise<void> {
    if (!tag || !tag.trim()) {
      throw new Error('Etiketa baliogabea.');
    }
    await this.rulesRepository.deleteGarbageTag(tag.trim());
  }
}
