import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';
import { query } from '../../../../shared/database.js';

export class GetSongStats {
  constructor(private songRepository: SongRepository) {}

  async execute(): Promise<any> {
    const [songs, mappingsMap, genreHierarchy] = await Promise.all([
      this.songRepository.findAccepted(),
      ExternalMetadataService.loadTagMappingsMap(),
      query("SELECT genre, parent_genre FROM genre_hierarchy")
    ]);

    const hierarchyMap = new Map<string, string>();
    const hierarchyJson: Record<string, string> = {};
    genreHierarchy.forEach(h => {
      hierarchyMap.set(h.genre.trim().toLowerCase(), h.parent_genre.trim());
      hierarchyJson[h.genre.trim().toLowerCase()] = h.parent_genre.trim();
    });

    function getRootParentGenre(genre: string): string {
      let current = genre.trim();
      let depth = 0;
      const maxDepth = 10;
      while (hierarchyMap.has(current.toLowerCase()) && depth < maxDepth) {
        current = hierarchyMap.get(current.toLowerCase())!.trim();
        depth++;
      }
      return current;
    }

    const genreCounts: Record<string, number> = {};
    const parentCounts: Record<string, number> = {};
    let totalGenres = 0;

    songs.forEach(s => {
      const mappedGenres = ExternalMetadataService.applyTagMappings(s.genres, mappingsMap);
      mappedGenres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;

        const rootGen = getRootParentGenre(genre);
        parentCounts[rootGen] = (parentCounts[rootGen] || 0) + 1;

        totalGenres++;
      });
    });

    return {
      counts: genreCounts,
      parentCounts: parentCounts,
      hierarchy: hierarchyJson,
      total: totalGenres,
      songsCount: songs.length
    };
  }
}
