import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { Song } from '../../domain/models/Song.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export interface DirectAddSongDTO {
  url: string;
  mode: 'filter' | 'direct';
  submitter?: string;
  comment?: string;
  ip: string;
  adminUser: string;
}

export class DirectAddSong {
  constructor(private songRepository: SongRepository) {}

  async execute(
    dto: DirectAddSongDTO,
    onProgress: (data: any) => void
  ): Promise<void> {
    const { url, mode, submitter, comment, ip, adminUser } = dto;
    if (!url) {
      onProgress({ status: 'error', message: 'URL beharrezkoa da.' });
      return;
    }

    const rawUrls = url.split(/[\n\r\s,]+/).map(item => item.trim()).filter(Boolean);
    if (rawUrls.length === 0) {
      onProgress({ status: 'error', message: 'Ez da URL-rik aurkitu.' });
      return;
    }

    const gatheredSongUrls: string[] = [];
    for (const rawUrl of rawUrls) {
      const playlistUrls = await ExternalMetadataService.parsePlaylist(rawUrl);
      if (playlistUrls && playlistUrls.length > 0) {
        gatheredSongUrls.push(...playlistUrls);
      } else {
        gatheredSongUrls.push(rawUrl);
      }
    }

    const uniqueSongUrls = Array.from(new Set(gatheredSongUrls));
    if (uniqueSongUrls.length === 0) {
      onProgress({ status: 'error', message: 'Ez da abesti-estekarik aurkitu prozesatzeko.' });
      return;
    }

    const totalCount = uniqueSongUrls.length;
    onProgress({ status: 'init', total: totalCount });

    let addedCount = 0;
    let existingCount = 0;
    const failedSongs: any[] = [];

    let processedCount = 0;
    for (const trackUrl of uniqueSongUrls) {
      processedCount++;
      onProgress({
        status: 'progress',
        current: processedCount,
        total: totalCount,
        url: trackUrl
      });

      try {
        const videoId = ExternalMetadataService.extractYouTubeId(trackUrl);
        let finalVideoId = videoId;

        if (videoId) {
          let ytCheck = await ExternalMetadataService.checkYouTubeVideoType(videoId);
          if (!ytCheck.isValid) {
            const officialId = await ExternalMetadataService.tryResolveOfficialVideoId(videoId);
            if (officialId) {
              const officialCheck = await ExternalMetadataService.checkYouTubeVideoType(officialId);
              if (officialCheck.isValid) {
                finalVideoId = officialId;
                ytCheck = officialCheck;
              }
            }
          }
          if (!ytCheck.isValid) {
            throw new Error('Bideo hau ez da musika-bideo ofiziala (Art Track edo Bideoklip Ofiziala izan behar du)');
          }
        }

        const normalizedUrl = finalVideoId ? 'https://www.youtube.com/watch?v=' + finalVideoId : trackUrl.trim();
        const targetStatus = mode === 'filter' ? 'pending' : 'accepted';
        const finalSubmitter = submitter && submitter.trim() ? submitter.trim() : "Administratzailea";
        const finalComment = comment && comment.trim() ? comment.trim() : (targetStatus === 'accepted' ? 'Zerrendatik zuzenean gehituta' : 'Administratzaileak iragazkirako gehituta');

        const existingSong = await this.songRepository.findByUrl(normalizedUrl);
        if (existingSong) {
          const submitters = existingSong.submitters;
          const comments = existingSong.comments;
          const ips = existingSong.ips;

          if (!submitters.includes(finalSubmitter)) submitters.push(finalSubmitter);
          if (finalComment && !comments.includes(finalComment)) comments.push(finalComment);
          if (!ips.includes(ip)) ips.push(ip);

          if (targetStatus === 'accepted') {
            existingSong.status = 'accepted';
            existingSong.acceptedBy = adminUser;
          } else {
            if (existingSong.status !== 'accepted') {
              existingSong.status = 'pending';
              existingSong.acceptedBy = null;
            }
          }

          existingSong.submitters = submitters;
          existingSong.comments = comments;
          existingSong.ips = ips;

          await this.songRepository.save(existingSong);
          existingCount++;
          continue;
        }

        const realMeta = await ExternalMetadataService.resolveRealMetadata(normalizedUrl);
        if (!realMeta.title || realMeta.title === 'Ezezaguna') {
          throw new Error('Ezin izan dira abestiaren metadatuak kargatu. Egiaztatu esteka zuzena den.');
        }

        let genres: string[] = [];
        try {
          genres = await ExternalMetadataService.resolveSongGenres(realMeta.title, realMeta.artist);
        } catch (e: any) {
          console.error("Genre resolution failed for", normalizedUrl, e.message);
        }

        const newSong = new Song(
          null,
          normalizedUrl,
          realMeta.title,
          realMeta.artist,
          [realMeta.title],
          [realMeta.artist],
          [finalSubmitter],
          [finalComment],
          [ip],
          targetStatus,
          genres,
          targetStatus === 'accepted' ? adminUser : null
        );

        await this.songRepository.save(newSong);
        addedCount++;
      } catch (err: any) {
        console.error("Error adding song in direct add:", trackUrl, err.message);
        failedSongs.push({
          url: trackUrl,
          error: err.message || 'Errore ezezaguna'
        });
        onProgress({
          status: 'song_error',
          url: trackUrl,
          error: err.message || 'Errore ezezaguna'
        });
      }
    }

    onProgress({
      status: 'complete',
      added: addedCount,
      existing: existingCount,
      failed: failedSongs.length
    });
  }
}
