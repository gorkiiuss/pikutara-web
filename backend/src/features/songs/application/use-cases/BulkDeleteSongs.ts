import { SongRepository } from '../../domain/repositories/SongRepository.js';

export class BulkDeleteSongs {
  constructor(private songRepository: SongRepository) {}

  async execute(ids: number[]): Promise<number> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Ez da ID zerrendarik bidali.');
    }
    await this.songRepository.bulkDelete(ids);
    return ids.length;
  }
}
