import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { uploadPoster } from '../../../shared/middlewares/upload.middleware.js';
import { PosterController } from './controllers/PosterController.js';

const router = Router();

// Public endpoints
router.get('/posters', PosterController.listPosters);

// Admin / protected endpoints (normalized)
router.post('/admin/posters', authMiddleware, uploadPoster.single('posterFile'), PosterController.createPoster);
router.post('/admin/posters/:id/edit', authMiddleware, uploadPoster.single('posterFile'), PosterController.editPoster);
router.delete('/admin/posters/:id', authMiddleware, PosterController.deletePoster);

// Legacy backward-compatibility routes
export const registerLegacyPosterRoutes = (app: any) => {
  app.post('/admin/posters', authMiddleware, uploadPoster.single('posterFile'), PosterController.createPoster);
  app.post('/admin/posters/:id/edit', authMiddleware, uploadPoster.single('posterFile'), PosterController.editPoster);
  app.delete('/admin/posters/:id', authMiddleware, PosterController.deletePoster);
};

export default router;
