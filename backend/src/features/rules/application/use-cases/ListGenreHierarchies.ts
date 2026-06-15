import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { GenreHierarchy } from '../../domain/models/RulesModels.js';

export class ListGenreHierarchies {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(): Promise<GenreHierarchy[]> {
    return this.rulesRepository.findGenreHierarchies();
  }
}
