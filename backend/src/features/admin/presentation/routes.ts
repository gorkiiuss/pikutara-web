import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { AdminPanelController } from './controllers/AdminPanelController.js';

const router = Router();

// Legacy backward-compatibility routes (non-prefixed /api)
export const registerLegacyAdminRoutes = (app: any) => {
  app.get('/admin', authMiddleware, AdminPanelController.render);
};

export default router;
