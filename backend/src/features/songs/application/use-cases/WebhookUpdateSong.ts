import { SongRepository } from '../../domain/repositories/SongRepository.js';

export interface WebhookUpdateSongDTO {
  id: number;
  status: string;
  genres?: string[];
}

export class WebhookUpdateSong {
  constructor(private songRepository: SongRepository) {}

  async execute(dto: WebhookUpdateSongDTO): Promise<void> {
    const song = await this.songRepository.findById(dto.id);
    if (!song) {
      throw new Error('Abestia ez da existitzen.');
    }

    if (!dto.status) {
      throw new Error('Estatusa falta da.');
    }

    if (dto.status === 'accepted' || dto.status === 'rejected' || dto.status === 'pending') {
      song.status = dto.status;
    } else {
      throw new Error('Estatus okerra.');
    }

    if (dto.genres) {
      song.genres = dto.genres;
    }

    await this.songRepository.save(song);
  }
}
