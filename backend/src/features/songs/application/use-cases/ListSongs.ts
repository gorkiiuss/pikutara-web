import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { Song } from '../../domain/models/Song.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export class ListSongs {
  constructor(private songRepository: SongRepository) {}

  async execute(): Promise<Song[]> {
    const songs = await this.songRepository.findAccepted();
    const mappingsMap = await ExternalMetadataService.loadTagMappingsMap();
    songs.forEach(s => {
      s.genres = ExternalMetadataService.applyTagMappings(s.genres, mappingsMap);
    });
    return songs;
  }
}
