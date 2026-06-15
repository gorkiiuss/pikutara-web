import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export interface ResolveSongGenresSingleDTO {
  id: number;
  title?: string;
  artist?: string;
}

export class ResolveSongGenresSingle {
  constructor(private songRepository: SongRepository) {}

  async execute(dto: ResolveSongGenresSingleDTO): Promise<string[]> {
    const song = await this.songRepository.findById(dto.id);
    if (!song) {
      throw new Error('Ez da abestia aurkitu.');
    }

    const title = dto.title || song.realTitle || '';
    const artist = dto.artist || song.realArtist || '';

    if (!title || !artist) {
      throw new Error('Metadatu eza: abestiak ez dauka izenbururik edo artistarik.');
    }

    const genres = await ExternalMetadataService.resolveSongGenres(title, artist);
    song.genres = genres;
    await this.songRepository.save(song);

    return genres;
  }
}
