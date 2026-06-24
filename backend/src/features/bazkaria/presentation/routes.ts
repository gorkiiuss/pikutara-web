import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { BazkariaController } from './controllers/BazkariaController.js';

const router = Router();

// Public routes
router.post('/bazkaria', BazkariaController.register);

// Admin/Moderator routes
router.get('/bazkaria/registrations', authMiddleware, BazkariaController.listRegistrations);
router.put('/bazkaria/:id/toggle-paid', authMiddleware, BazkariaController.togglePaidRegistration);
router.post('/bazkaria/:id/resend-email', authMiddleware, BazkariaController.resendEmail);
router.post('/bazkaria/broadcast-email', authMiddleware, BazkariaController.sendBroadcastEmail);
router.delete('/bazkaria/:id', authMiddleware, BazkariaController.deleteRegistration);

export default router;
