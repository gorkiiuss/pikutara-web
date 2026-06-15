import { PosterRepository } from '../../domain/repositories/PosterRepository.js';
import { Poster } from '../../domain/models/Poster.js';

export interface CreatePosterDTO {
  title: string;
  eventDate: string;
  description?: string;
  bands?: string;
  filename?: string;
}

export class CreatePoster {
  constructor(private posterRepository: PosterRepository) {}

  async execute(dto: CreatePosterDTO): Promise<Poster> {
    Poster.validate(dto.title, dto.eventDate);

    if (!dto.filename) {
      throw new Error('Irudi fitxategia beharrezkoa da.');
    }

    let bandsJson = '[]';
    if (dto.bands && dto.bands.trim().length > 0) {
      const parsed = dto.bands.split(',').map(b => b.trim()).filter(Boolean);
      bandsJson = JSON.stringify(parsed);
    }

    const filePath = `/uploads/posters/${dto.filename}`;
    const newPoster = new Poster(
      null,
      dto.title.trim(),
      dto.eventDate.trim(),
      dto.description ? dto.description.trim() : null,
      bandsJson,
      filePath
    );

    return this.posterRepository.create(newPoster);
  }
}
