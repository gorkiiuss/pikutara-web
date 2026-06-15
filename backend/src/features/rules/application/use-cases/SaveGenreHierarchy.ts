import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { GenreHierarchy } from '../../domain/models/RulesModels.js';

export interface SaveGenreHierarchyDTO {
  genre: string;
  parentGenre: string;
}

export class SaveGenreHierarchy {
  constructor(private rulesRepository: RulesRepository) {}

  async execute(dto: SaveGenreHierarchyDTO): Promise<void> {
    const cleanGenre = dto.genre.trim();
    const cleanParent = dto.parentGenre.trim();

    if (!cleanGenre || !cleanParent) {
      throw new Error('Datu baliogabeak.');
    }

    if (cleanGenre.toLowerCase() === cleanParent.toLowerCase()) {
      throw new Error('Ezin da genero bat bere buruaren azpiko genero izendatu.');
    }

    const hierarchy = new GenreHierarchy(cleanGenre, cleanParent);
    await this.rulesRepository.saveGenreHierarchy(hierarchy);
  }
}
