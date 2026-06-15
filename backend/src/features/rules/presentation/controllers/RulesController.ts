import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { SQLiteRulesRepository } from '../../infrastructure/repositories/SQLiteRulesRepository.js';

import { ListGarbageTags } from '../../application/use-cases/ListGarbageTags.js';
import { AddGarbageTag } from '../../application/use-cases/AddGarbageTag.js';
import { DeleteGarbageTag } from '../../application/use-cases/DeleteGarbageTag.js';
import { ImportGarbageTags } from '../../application/use-cases/ImportGarbageTags.js';

import { ListTagMappings } from '../../application/use-cases/ListTagMappings.js';
import { SaveTagMapping } from '../../application/use-cases/SaveTagMapping.js';
import { DeleteTagMapping } from '../../application/use-cases/DeleteTagMapping.js';
import { BulkImportTagMappings } from '../../application/use-cases/BulkImportTagMappings.js';

import { ListGenreHierarchies } from '../../application/use-cases/ListGenreHierarchies.js';
import { SaveGenreHierarchy } from '../../application/use-cases/SaveGenreHierarchy.js';
import { DeleteGenreHierarchy } from '../../application/use-cases/DeleteGenreHierarchy.js';
import { BulkImportGenreHierarchies } from '../../application/use-cases/BulkImportGenreHierarchies.js';
import { GetPublicGenreHierarchy } from '../../application/use-cases/GetPublicGenreHierarchy.js';

const rulesRepository = new SQLiteRulesRepository();

export class RulesController {
  // Garbage Tags
  static async listGarbageTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new ListGarbageTags(rulesRepository);
      const tags = await useCase.execute();
      res.json(tags.map(t => t.tag));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea zabor etiketak kargatzean.' });
    }
  }

  static async addGarbageTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tag } = req.body;
      const useCase = new AddGarbageTag(rulesRepository);
      await useCase.execute(tag);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea etiketa gehitzean.' });
    }
  }

  static async exportGarbageTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new ListGarbageTags(rulesRepository);
      const tags = await useCase.execute();
      const tagList = tags.map(t => t.tag);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="garbage_tags.json"');
      res.send(JSON.stringify(tagList, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea zabor etiketak esportatzean.' });
    }
  }

  static async importGarbageTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tags } = req.body;
      const useCase = new ImportGarbageTags(rulesRepository);
      const count = await useCase.execute(tags);
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea zabor etiketak inportatzean.' });
    }
  }

  static async deleteGarbageTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tag } = req.params;
      const useCase = new DeleteGarbageTag(rulesRepository);
      await useCase.execute(tag);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea etiketa ezabatzean.' });
    }
  }

  // Tag Mappings
  static async listTagMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new ListTagMappings(rulesRepository);
      const mappings = await useCase.execute();
      res.json(mappings.map(m => ({ original_tag: m.originalTag, canonical_tag: m.canonicalTag })));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea etiketa taldekatzeak kargatzean.' });
    }
  }

  static async saveTagMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { original_tag, canonical_tag } = req.body;
      const useCase = new SaveTagMapping(rulesRepository);
      await useCase.execute({ originalTag: original_tag, canonicalTag: canonical_tag });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea etiketa taldekatzea gehitzean.' });
    }
  }

  static async deleteTagMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { original_tag } = req.params;
      const useCase = new DeleteTagMapping(rulesRepository);
      await useCase.execute(original_tag);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea etiketa taldekatzea ezabatzean.' });
    }
  }

  static async bulkImportTagMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mappings = req.body;
      const useCase = new BulkImportTagMappings(rulesRepository);
      const count = await useCase.execute(mappings);
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea etiketa taldekatzeak inportatzean.' });
    }
  }

  // Genre Hierarchy
  static async listGenreHierarchies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const useCase = new ListGenreHierarchies(rulesRepository);
      const list = await useCase.execute();
      res.json(list.map(h => ({ genre: h.genre, parent_genre: h.parentGenre })));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea generoen zuhaitza kargatzean.' });
    }
  }

  static async saveGenreHierarchy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { genre, parent_genre } = req.body;
      const useCase = new SaveGenreHierarchy(rulesRepository);
      await useCase.execute({ genre, parentGenre: parent_genre });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea genero zuhaitza gehitzean.' });
    }
  }

  static async deleteGenreHierarchy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { genre } = req.params;
      const useCase = new DeleteGenreHierarchy(rulesRepository);
      await useCase.execute(genre);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea genero zuhaitza ezabatzean.' });
    }
  }

  static async bulkImportGenreHierarchies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const hierarchy = req.body;
      const useCase = new BulkImportGenreHierarchies(rulesRepository);
      const count = await useCase.execute(hierarchy);
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea genero zuhaitza inportatzean.' });
    }
  }

  // Public Get Hierarchy
  static async getPublicGenreHierarchy(req: any, res: Response): Promise<void> {
    try {
      const useCase = new GetPublicGenreHierarchy(rulesRepository);
      const map = await useCase.execute();
      res.json(map);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea genero zuhaitza eskuratzean.' });
    }
  }

  // Algorithm Settings
  static async getAlgorithmSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await rulesRepository.findAlgorithmSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea ezarpenak kargatzean.' });
    }
  }

  static async updateAlgorithmSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const newSettings = req.body;
      if (!newSettings) {
        res.status(400).json({ error: 'Ezarpenak falta dira.' });
        return;
      }
      await rulesRepository.saveAlgorithmSettings(newSettings);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea ezarpenak eguneratzean.' });
    }
  }

  // Artist Genders
  static async getArtistGenders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const artistGenders = await rulesRepository.findArtistGenders();
      res.json(artistGenders);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea artisten generoak lortzean.' });
    }
  }

  static async saveArtistGender(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { artist, gender_type, verified } = req.body;
      if (!artist || !gender_type) {
        res.status(400).json({ error: 'Artista eta genero mota beharrezkoak dira.' });
        return;
      }
      await rulesRepository.saveArtistGender(artist, gender_type, !!verified);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea artistaren generoa gordetzean.' });
    }
  }

  static async listAllGenres(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const genreSet = new Set<string>();
      const { query } = await import('../../../../shared/database.js');

      const mappingsRows = await query("SELECT original_tag, canonical_tag FROM tag_mappings");
      const mappingsMap: Record<string, string> = {};
      const synonymsSet = new Set<string>();

      mappingsRows.forEach(m => {
        if (m.original_tag && m.canonical_tag) {
          const origLower = m.original_tag.trim().toLowerCase();
          mappingsMap[origLower] = m.canonical_tag.trim();
          synonymsSet.add(origLower);
        }
      });

      const toCanonical = (g: string) => {
        if (!g) return '';
        const clean = g.trim();
        const lower = clean.toLowerCase();
        return mappingsMap[lower] || clean;
      };

      const hierarchyRows = await query("SELECT parent_genre, genre FROM genre_hierarchy");
      hierarchyRows.forEach(r => {
        if (r.parent_genre) genreSet.add(toCanonical(r.parent_genre));
        if (r.genre) genreSet.add(toCanonical(r.genre));
      });

      mappingsRows.forEach(m => {
        if (m.canonical_tag) genreSet.add(m.canonical_tag.trim());
      });

      const songRows = await query("SELECT genres FROM songs WHERE genres != '[]' AND genres IS NOT NULL");
      songRows.forEach(s => {
        try {
          const parsed = JSON.parse(s.genres);
          if (Array.isArray(parsed)) {
            parsed.forEach(g => genreSet.add(toCanonical(g)));
          }
        } catch (e) { }
      });

      const artistRows = await query("SELECT genres FROM artist_genres");
      artistRows.forEach(a => {
        try {
          const parsed = JSON.parse(a.genres);
          if (Array.isArray(parsed)) {
            parsed.forEach(g => genreSet.add(toCanonical(g)));
          }
        } catch (e) { }
      });

      const finalGenres = Array.from(genreSet)
        .filter(g => g && g.length > 0 && !synonymsSet.has(g.toLowerCase()))
        .sort((a, b) => a.localeCompare(b));

      res.json(finalGenres);
    } catch (error: any) {
      console.error("Error obtaining master list of genres:", error);
      res.status(500).json({ error: 'Errorea genero zerrenda osoa eskuratzean.' });
    }
  }

  static async listArtistGenres(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rows = await rulesRepository.findArtistGenres();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: 'Errorea artisten generoak kargatzean.' });
    }
  }

  static async deleteArtistGenre(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { artist } = req.params;
      await rulesRepository.deleteArtistGenre(artist);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Errorea artista ezabatzean.' });
    }
  }

  static async bulkImportArtistGenres(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mappings = req.body;
      if (!Array.isArray(mappings)) {
        res.status(400).json({ error: 'Array bat espero zen.' });
        return;
      }
      await rulesRepository.bulkSaveArtistGenres(mappings);
      res.json({ success: true, count: mappings.length });
    } catch (error: any) {
      console.error("Error bulk importing artist genres:", error);
      res.status(500).json({ error: 'Errorea artisten generoak inportatzean: ' + error.message });
    }
  }
}
