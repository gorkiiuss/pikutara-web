import fs from 'fs';
import path from 'path';
import { PosterRepository } from '../../domain/repositories/PosterRepository.js';

export class DeletePoster {
  constructor(private posterRepository: PosterRepository) {}

  async execute(id: number): Promise<boolean> {
    const existing = await this.posterRepository.getById(id);
    if (!existing) {
      throw new Error('Ez da kartela aurkitu.');
    }

    // Delete physical file
    const physicalPath = path.join(process.cwd(), existing.filePath);
    if (fs.existsSync(physicalPath)) {
      try {
        fs.unlinkSync(physicalPath);
      } catch (e) {
        console.error('Error unlinking poster file:', e);
      }
    }

    return this.posterRepository.delete(id);
  }
}
