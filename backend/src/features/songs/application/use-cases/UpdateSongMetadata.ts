import { SongRepository } from '../../domain/repositories/SongRepository.js';

export interface UpdateSongMetadataDTO {
  id: number;
  title: string;
  artist: string;
  genres: string[];
  submitters: string[];
  comments: string[];
}

export class UpdateSongMetadata {
  constructor(private songRepository: SongRepository) {}

  async execute(dto: UpdateSongMetadataDTO): Promise<void> {
    const song = await this.songRepository.findById(dto.id);
    if (!song) {
      throw new Error('Ez da abestia aurkitu.');
    }

    const { title, artist, genres, submitters, comments } = dto;
    if (
      !title ||
      !artist ||
      !genres ||
      !Array.isArray(genres) ||
      !submitters ||
      !Array.isArray(submitters) ||
      !comments ||
      !Array.isArray(comments)
    ) {
      throw new Error('Datu baliogabeak.');
    }

    song.realTitle = title.trim();
    song.realArtist = artist.trim();
    song.genres = genres;
    song.submitters = submitters;
    song.comments = comments;

    await this.songRepository.save(song);
  }
}
