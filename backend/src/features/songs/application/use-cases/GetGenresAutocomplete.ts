import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export class GetGenresAutocomplete {
  constructor(private songRepository: SongRepository) {}

  async execute(): Promise<string[]> {
    const songs = await this.songRepository.findAll();
    const mappingsMap = await ExternalMetadataService.loadTagMappingsMap();
    const genreSet = new Set<string>();
    songs.forEach(s => {
      const parsed = ExternalMetadataService.applyTagMappings(s.genres, mappingsMap);
      parsed.forEach(g => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }
}
