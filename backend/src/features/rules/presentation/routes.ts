import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { RulesController } from './controllers/RulesController.js';

const router = Router();

// Garbage tags
router.get('/admin/garbage-tags', authMiddleware, RulesController.listGarbageTags);
router.post('/admin/garbage-tags', authMiddleware, RulesController.addGarbageTag);
router.get('/admin/garbage-tags/export', authMiddleware, RulesController.exportGarbageTags);
router.post('/admin/garbage-tags/import', authMiddleware, RulesController.importGarbageTags);
router.delete('/admin/garbage-tags/:tag', authMiddleware, RulesController.deleteGarbageTag);

// Tag mappings
router.get('/admin/tag-mappings', authMiddleware, RulesController.listTagMappings);
router.post('/admin/tag-mappings', authMiddleware, RulesController.saveTagMapping);
router.delete('/admin/tag-mappings/:original_tag', authMiddleware, RulesController.deleteTagMapping);
router.post('/admin/tag-mappings/bulk', authMiddleware, RulesController.bulkImportTagMappings);

// Genre hierarchy (Admin)
router.get('/admin/genre-hierarchy', authMiddleware, RulesController.listGenreHierarchies);
router.post('/admin/genre-hierarchy', authMiddleware, RulesController.saveGenreHierarchy);
router.delete('/admin/genre-hierarchy/:genre', authMiddleware, RulesController.deleteGenreHierarchy);
router.post('/admin/genre-hierarchy/bulk', authMiddleware, RulesController.bulkImportGenreHierarchies);

// Genre hierarchy (Public)
router.get('/musika/genre-hierarchy', RulesController.getPublicGenreHierarchy);

// Algorithm Settings
router.get('/admin/settings', authMiddleware, RulesController.getAlgorithmSettings);
router.put('/admin/settings', authMiddleware, RulesController.updateAlgorithmSettings);

// Artist Genders
router.get('/admin/artist-genders', authMiddleware, RulesController.getArtistGenders);
router.post('/admin/artist-genders', authMiddleware, RulesController.saveArtistGender);

// Artist Genres
router.get('/admin/artist-genres', authMiddleware, RulesController.listArtistGenres);
router.delete('/admin/artist-genres/:artist', authMiddleware, RulesController.deleteArtistGenre);
router.post('/admin/artist-genres/bulk', authMiddleware, RulesController.bulkImportArtistGenres);

// Master Genres List
router.get('/admin/genres/all', authMiddleware, RulesController.listAllGenres);

export default router;
