import fs from 'fs';
import path from 'path';
import { MemeRepository } from '../../domain/repositories/MemeRepository.js';

export class DeleteMeme {
  constructor(private memeRepository: MemeRepository) {}

  async execute(id: number): Promise<boolean> {
    const meme = await this.memeRepository.getById(id);
    if (!meme) {
      throw new Error('Memea ez da aurkitu.');
    }

    // Delete physical image file
    const physicalPath = path.join(process.cwd(), meme.imagePath);
    if (fs.existsSync(physicalPath)) {
      try {
        fs.unlinkSync(physicalPath);
      } catch (e) {
        console.error('Error unlinking meme file:', e);
      }
    }

    return this.memeRepository.delete(id);
  }
}
