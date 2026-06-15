import { MemeRepository } from '../../domain/repositories/MemeRepository.js';
import { Meme } from '../../domain/models/Meme.js';

export class UnvoteMeme {
  constructor(private memeRepository: MemeRepository) {}

  async execute(id: number): Promise<Meme> {
    const meme = await this.memeRepository.getById(id);
    if (!meme) {
      throw new Error('Memea ez da aurkitu.');
    }
    if (meme.votes > 0) {
      meme.votes -= 1;
      await this.memeRepository.update(meme);
    }
    return meme;
  }
}
