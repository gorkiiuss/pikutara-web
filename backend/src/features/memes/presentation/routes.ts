import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { uploadMeme } from '../../../shared/middlewares/upload.middleware.js';
import { uploadLimiter, voteLimiter } from '../../../shared/middlewares/rate-limit.middleware.js';
import { MemeController } from './controllers/MemeController.js';

const router = Router();

// Public endpoints
router.get('/memes', MemeController.listMemes);
router.post('/memes', uploadLimiter, uploadMeme.single('memeFile'), MemeController.submitMeme);
router.post('/memes/:id/vote', voteLimiter, MemeController.voteMeme);
router.post('/memes/:id/unvote', voteLimiter, MemeController.unvoteMeme);

// Admin / protected endpoints (normalized)
router.put('/admin/memes/:id/approve', authMiddleware, MemeController.approveMeme);
router.put('/admin/memes/:id/unapprove', authMiddleware, MemeController.unapproveMeme);
router.delete('/admin/memes/:id', authMiddleware, MemeController.deleteMeme);

// Legacy backward-compatibility routes
export const registerLegacyMemeRoutes = (app: any) => {
  app.put('/admin/memes/:id/approve', authMiddleware, MemeController.approveMeme);
  app.put('/admin/memes/:id/unapprove', authMiddleware, MemeController.unapproveMeme);
  app.delete('/admin/memes/:id', authMiddleware, MemeController.deleteMeme);
};

export default router;
