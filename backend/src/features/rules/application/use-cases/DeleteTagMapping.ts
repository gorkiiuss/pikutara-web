import { RulesRepository } from '../../domain/repositories/RulesRepository.js';

export class DeleteTagMapping {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(originalTag: string): Promise<void> {
    if (!originalTag || !originalTag.trim()) {
      throw new Error('Datu baliogabeak.');
    }
    await this.rulesRepository.deleteTagMapping(originalTag.trim());
  }
}
