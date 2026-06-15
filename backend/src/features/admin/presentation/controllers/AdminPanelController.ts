import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { query } from '../../../../shared/database.js';
import { safeParseArray } from '../../../../shared/helpers.js';
import { ExternalMetadataService } from '../../../songs/infrastructure/external-services/ExternalMetadataService.js';
import { renderAdminLayout } from '../views/adminLayout.js';
import { 
  AdminMeme, AdminPoster, AdminPlaylistReview, AdminSection, 
  AdminPageView, AdminSong, AdminGarbageTag, AdminTagMapping, 
  AdminGenreHierarchy, AdminUser, AdminBazkariaRegistration
} from '../../domain/models/AdminData.js';

export class AdminPanelController {
  static async render(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [
        pendingMemes,
        approvedMemes,
        allPosters,
        allReviews,
        sections,
        pageViews,
        rawSongs,
        garbageTags,
        tagMappings,
        genreHierarchy,
        allUsers,
        bazkariRegistrations
      ] = await Promise.all([
        query('SELECT * FROM memes WHERE is_approved = 0 ORDER BY created_at DESC') as Promise<AdminMeme[]>,
        query('SELECT * FROM memes WHERE is_approved = 1 ORDER BY created_at DESC') as Promise<AdminMeme[]>,
        query('SELECT * FROM posters ORDER BY created_at DESC') as Promise<AdminPoster[]>,
        query('SELECT * FROM playlist_reviews ORDER BY created_at DESC') as Promise<AdminPlaylistReview[]>,
        query('SELECT * FROM sections') as Promise<AdminSection[]>,
        query('SELECT * FROM page_views ORDER BY views DESC') as Promise<AdminPageView[]>,
        query('SELECT * FROM songs ORDER BY created_at DESC') as Promise<any[]>,
        query("SELECT tag FROM garbage_tags ORDER BY tag ASC") as Promise<AdminGarbageTag[]>,
        query("SELECT original_tag, canonical_tag FROM tag_mappings ORDER BY original_tag ASC") as Promise<AdminTagMapping[]>,
        query("SELECT genre, parent_genre FROM genre_hierarchy ORDER BY genre ASC") as Promise<AdminGenreHierarchy[]>,
        query("SELECT id, username, role, created_at FROM users ORDER BY username ASC") as Promise<AdminUser[]>,
        query(`
          SELECT r.*, k.izena as konpartsakide_izena 
          FROM bazkaria_registrations r 
          LEFT JOIN konpartsakideak k ON r.konpartsakide_id = k.id 
          ORDER BY r.created_at DESC
        `) as Promise<AdminBazkariaRegistration[]>
      ]);

      const mappingsMap = new Map<string, string>();
      tagMappings.forEach(m => {
        mappingsMap.set(m.original_tag.trim().toLowerCase(), m.canonical_tag.trim());
      });
      
      const allSongs: AdminSong[] = rawSongs.map(s => ({
        ...s,
        genres: ExternalMetadataService.applyTagMappings(safeParseArray(s.genres), mappingsMap),
        proposed_titles: safeParseArray(s.proposed_titles),
        proposed_artists: safeParseArray(s.proposed_artists),
        submitters: safeParseArray(s.submitters),
        comments: safeParseArray(s.comments),
        ips: safeParseArray(s.ips),
        language: safeParseArray(s.language)
      }));

      const html = renderAdminLayout({
        pendingMemes,
        approvedMemes,
        allPosters,
        allReviews,
        sections,
        pageViews,
        allSongs,
        garbageTags,
        tagMappings,
        genreHierarchy,
        allUsers,
        bazkariRegistrations
      });
      
      res.send(html);
    } catch (error) {
      console.error('Error rendering admin panel:', error);
      res.status(500).send('Errorea admin panela kargatzean.');
    }
  }
}
