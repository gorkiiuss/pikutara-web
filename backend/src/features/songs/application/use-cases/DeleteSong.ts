import { SongRepository } from '../../domain/repositories/SongRepository.js';

export class DeleteSong {
  constructor(private songRepository: SongRepository) {}

  async execute(id: number): Promise<void> {
    const song = await this.songRepository.findById(id);
    if (!song) {
      throw new Error('Ez da abestia aurkitu.');
    }
    await this.songRepository.delete(id);
  }
}
