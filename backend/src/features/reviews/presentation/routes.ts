import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { uploadLimiter } from '../../../shared/middlewares/rate-limit.middleware.js';
import { ReviewController } from './controllers/ReviewController.js';

const router = Router();

// Public endpoints
router.get('/playlist/has-voted', ReviewController.checkHasVoted);
router.post('/playlist/reviews', uploadLimiter, ReviewController.submitReview);

// Admin / protected endpoints (normalized)
router.delete('/admin/playlist/reviews/:id', authMiddleware, ReviewController.deleteReview);

// Legacy backward-compatibility routes
export const registerLegacyReviewRoutes = (app: any) => {
  app.delete('/admin/playlist/reviews/:id', authMiddleware, ReviewController.deleteReview);
};

export default router;
