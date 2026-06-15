import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export class ReResolveAllSongs {
  constructor(private songRepository: SongRepository) {}

  async execute(onProgress: (data: any) => void): Promise<void> {
    const songs = await this.songRepository.findAll();
    const totalCount = songs.length;
    onProgress({ status: 'init', total: totalCount });

    let processedCount = 0;
    for (const song of songs) {
      processedCount++;
      
      let title = song.realTitle || '';
      let artist = song.realArtist || '';
      
      if (!title || !artist) {
        title = song.proposedTitles[0] || '';
        artist = song.proposedArtists[0] || '';
      }

      const itemLabel = (title && artist) ? `${title} - ${artist}` : `Song #${song.id}`;
      onProgress({ 
        status: 'progress', 
        current: processedCount, 
        total: totalCount, 
        item: itemLabel
      });

      if (title && artist) {
        try {
          const newGenres = await ExternalMetadataService.resolveSongGenres(title, artist);
          song.genres = newGenres;
          await this.songRepository.save(song);
        } catch (err: any) {
          console.error(`Error auto-resolving bulk genres for song ID ${song.id}:`, err.message);
        }
      }
    }

    onProgress({ status: 'complete' });
  }
}
