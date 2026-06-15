import { RulesRepository } from '../../domain/repositories/RulesRepository.js';

export class GetPublicGenreHierarchy {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(): Promise<Record<string, string>> {
    const list = await this.rulesRepository.findGenreHierarchies();
    const map: Record<string, string> = {};
    for (const h of list) {
      map[h.genre.toLowerCase()] = h.parentGenre;
    }
    return map;
  }
}
