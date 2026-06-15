import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { BazkariaController } from './controllers/BazkariaController.js';

const router = Router();

// Public routes
router.post('/bazkaria', BazkariaController.register);

// Admin/Moderator routes
router.get('/bazkaria/registrations', authMiddleware, BazkariaController.listRegistrations);
router.put('/bazkaria/:id/toggle-paid', authMiddleware, BazkariaController.togglePaidRegistration);
router.delete('/bazkaria/:id', authMiddleware, BazkariaController.deleteRegistration);

export default router;
