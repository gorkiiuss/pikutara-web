import { PosterRepository } from '../../domain/repositories/PosterRepository.js';
import { Poster } from '../../domain/models/Poster.js';

export class ListPosters {
  constructor(private posterRepository: PosterRepository) {}

  async execute(): Promise<Poster[]> {
    return this.posterRepository.getAll();
  }
}
