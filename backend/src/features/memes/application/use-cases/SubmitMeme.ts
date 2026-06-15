import { MemeRepository } from '../../domain/repositories/MemeRepository.js';
import { Meme } from '../../domain/models/Meme.js';

export interface SubmitMemeDTO {
  title: string;
  contact: string;
  filename?: string;
}

export class SubmitMeme {
  constructor(private memeRepository: MemeRepository) {}

  async execute(dto: SubmitMemeDTO): Promise<Meme> {
    Meme.validate(dto.title, dto.contact);

    if (!dto.filename) {
      throw new Error('Irudi fitxategia beharrezkoa da.');
    }

    const imagePath = `/uploads/memes/${dto.filename}`;
    const newMeme = new Meme(
      null,
      dto.title.trim(),
      dto.contact.trim(),
      imagePath,
      0,
      false // New memes are pending approval by default
    );

    return this.memeRepository.create(newMeme);
  }
}
