import { RulesRepository } from '../../domain/repositories/RulesRepository.js';

export class DeleteGenreHierarchy {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(genre: string): Promise<void> {
    if (!genre || !genre.trim()) {
      throw new Error('Datu baliogabeak.');
    }
    await this.rulesRepository.deleteGenreHierarchy(genre.trim());
  }
}
