import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { songProposalLimiter } from '../../../shared/middlewares/rate-limit.middleware.js';
import { SongController } from './controllers/SongController.js';

const router = Router();

// Public routes
router.get('/musika/songs', SongController.listSongs);
router.post('/musika/songs', songProposalLimiter, SongController.proposeSong);
router.get('/spotify-metadata', SongController.getSpotifyMetadata);
router.put('/webhook/songs/:id', SongController.webhookUpdateSong);

// Admin routes
router.get('/admin/songs/pending', authMiddleware, SongController.listPendingSongs);
router.get('/admin/songs/stats', authMiddleware, SongController.getSongStats);
router.put('/admin/songs/:id/tinder-action', authMiddleware, SongController.swipeSong);
router.post('/admin/songs/direct-add', authMiddleware, SongController.directAddSong);
router.post('/admin/songs/re-resolve-all', authMiddleware, SongController.reResolveAllSongs);
router.delete('/admin/songs/:id', authMiddleware, SongController.deleteSong);
router.post('/admin/songs/bulk-delete', authMiddleware, SongController.bulkDeleteSongs);
router.post('/admin/songs/:id/resolve-genres', authMiddleware, SongController.resolveSongGenresSingle);
router.put('/admin/songs/:id/metadata', authMiddleware, SongController.updateSongMetadata);
router.get('/admin/genres/autocomplete', authMiddleware, SongController.getGenresAutocomplete);
router.get('/admin/songs/:id/lyrics', authMiddleware, SongController.getSongLyrics);
router.get('/admin/songs/untagged', authMiddleware, SongController.getUntaggedSongs);
router.get('/admin/songs/export', authMiddleware, SongController.exportSongs);
router.put('/admin/songs/:id/tag', authMiddleware, SongController.tagSong);

export default router;
