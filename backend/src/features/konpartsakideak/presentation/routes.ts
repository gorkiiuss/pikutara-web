import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { KonpartsakideController } from './controllers/KonpartsakideController.js';

const router = Router();

// Public routes
router.get('/konpartsakideak/diru-jasotzaileak', KonpartsakideController.listMoneyCollectors);

// Admin/Moderator routes
router.get('/konpartsakideak', authMiddleware, KonpartsakideController.listKonpartsakideak);
router.post('/konpartsakideak', authMiddleware, KonpartsakideController.createKonpartsakide);
router.put('/konpartsakideak/:id', authMiddleware, KonpartsakideController.updateKonpartsakide);
router.delete('/konpartsakideak/:id', authMiddleware, KonpartsakideController.deleteKonpartsakide);

export default router;
