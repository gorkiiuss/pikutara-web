import { SongRepository } from '../../domain/repositories/SongRepository.js';

export interface SwipeSongDTO {
  id: number;
  status: 'accepted' | 'rejected';
  genres?: string[];
  adminUser: string;
}

export class SwipeSong {
  constructor(private songRepository: SongRepository) {}

  async execute(dto: SwipeSongDTO): Promise<void> {
    const song = await this.songRepository.findById(dto.id);
    if (!song) {
      throw new Error('Ez da abestia aurkitu.');
    }

    if (!['accepted', 'rejected'].includes(dto.status)) {
      throw new Error('Estatus okerra.');
    }

    song.status = dto.status;
    if (dto.genres) {
      song.genres = dto.genres;
    }
    song.acceptedBy = dto.adminUser;

    await this.songRepository.save(song);
  }
}
