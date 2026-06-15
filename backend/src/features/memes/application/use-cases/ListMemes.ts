import { MemeRepository } from '../../domain/repositories/MemeRepository.js';
import { Meme } from '../../domain/models/Meme.js';

export class ListMemes {
  constructor(private memeRepository: MemeRepository) {}

  async execute(approvedOnly: boolean = false): Promise<Meme[]> {
    if (approvedOnly) {
      return this.memeRepository.getApproved();
    }
    return this.memeRepository.getAll();
  }
}
