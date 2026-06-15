import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { TagMapping } from '../../domain/models/RulesModels.js';

export class ListTagMappings {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(): Promise<TagMapping[]> {
    return this.rulesRepository.findTagMappings();
  }
}
