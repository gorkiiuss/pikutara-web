import fs from 'fs';
import path from 'path';
import { PosterRepository } from '../../domain/repositories/PosterRepository.js';
import { Poster } from '../../domain/models/Poster.js';

export interface EditPosterDTO {
  id: number;
  title: string;
  eventDate: string;
  description?: string;
  bands?: string;
  filename?: string;
}

export class EditPoster {
  constructor(private posterRepository: PosterRepository) {}

  async execute(dto: EditPosterDTO): Promise<boolean> {
    Poster.validate(dto.title, dto.eventDate);

    const existing = await this.posterRepository.getById(dto.id);
    if (!existing) {
      throw new Error('Ez da kartela aurkitu.');
    }

    existing.title = dto.title.trim();
    existing.eventDate = dto.eventDate.trim();
    existing.description = dto.description ? dto.description.trim() : null;

    if (dto.bands !== undefined) {
      const parsed = dto.bands.split(',').map(b => b.trim()).filter(Boolean);
      existing.bands = JSON.stringify(parsed);
    }

    // Handle file replacement
    if (dto.filename) {
      const oldPhysicalPath = path.join(process.cwd(), existing.filePath);
      if (fs.existsSync(oldPhysicalPath)) {
        try {
          fs.unlinkSync(oldPhysicalPath);
        } catch (e) {
          console.error('Error unlinking old file:', e);
        }
      }
      existing.filePath = `/uploads/posters/${dto.filename}`;
    }

    return this.posterRepository.update(existing);
  }
}
