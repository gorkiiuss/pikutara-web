import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { GarbageTag } from '../../domain/models/RulesModels.js';

export class ListGarbageTags {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(): Promise<GarbageTag[]> {
    return this.rulesRepository.findGarbageTags();
  }
}
