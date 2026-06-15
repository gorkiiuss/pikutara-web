import { SongRepository } from '../../domain/repositories/SongRepository.js';
import { Song } from '../../domain/models/Song.js';
import { ExternalMetadataService } from '../../infrastructure/external-services/ExternalMetadataService.js';

export interface ProposeSongDTO {
  url: string;
  title: string;
  artist: string;
  submittedBy: string;
  comment?: string;
  ip: string;
}

export class ProposeSong {
  constructor(private songRepository: SongRepository) {}

  async execute(dto: ProposeSongDTO): Promise<{ success: boolean; message?: string }> {
    const { url, title, artist, submittedBy, comment, ip } = dto;
    if (!url || !title || !artist || !submittedBy) {
      throw new Error('Beharrezko datuak falta dira.');
    }

    const videoId = ExternalMetadataService.extractYouTubeId(url);
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
        throw new Error(
          'Bideo hau ezin da onartu. Musika-bideo ofizialak (Art Track edo Bideoklip Ofizialak) bakarrik onartzen dira. Mesedez, ziurtatu igotako esteka jatorrizko bideo ofizial batena edo Youtube Music-eko abesti batena dela.'
        );
      }
    }

    const normalizedUrl = finalVideoId ? `https://www.youtube.com/watch?v=${finalVideoId}` : url.trim();

    const existingSong = await this.songRepository.findByUrl(normalizedUrl);
    if (existingSong) {
      const proposedTitles = existingSong.proposedTitles;
      const proposedArtists = existingSong.proposedArtists;
      const submitters = existingSong.submitters;
      const comments = existingSong.comments;
      const ips = existingSong.ips;

      const trimmedTitle = title.trim();
      const trimmedArtist = artist.trim();
      const trimmedSubmitter = submittedBy.trim();
      const trimmedComment = comment ? comment.trim() : '';

      if (!proposedTitles.includes(trimmedTitle)) proposedTitles.push(trimmedTitle);
      if (!proposedArtists.includes(trimmedArtist)) proposedArtists.push(trimmedArtist);
      if (!submitters.includes(trimmedSubmitter)) submitters.push(trimmedSubmitter);
      if (trimmedComment && !comments.includes(trimmedComment)) comments.push(trimmedComment);
      if (!ips.includes(ip)) ips.push(ip);

      await this.songRepository.save(existingSong);
      return { success: true, message: 'Dagoeneko proposatuta zegoen. Proposamena gehitu da!' };
    }

    const realMeta = await ExternalMetadataService.resolveRealMetadata(normalizedUrl);

    let genres: string[] = [];
    try {
      genres = await ExternalMetadataService.resolveSongGenres(realMeta.title, realMeta.artist);
    } catch (e) {
      console.error('Auto genre resolution failed on submit:', e);
    }

    const commentsList = comment && comment.trim() ? [comment.trim()] : [];

    const newSong = new Song(
      null,
      normalizedUrl,
      realMeta.title,
      realMeta.artist,
      [title.trim()],
      [artist.trim()],
      [submittedBy.trim()],
      commentsList,
      [ip],
      'pending',
      genres,
      null
    );

    await this.songRepository.save(newSong);
    return { success: true };
  }
}
