import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { SystemController } from './controllers/SystemController.js';

const router = Router();

// Public endpoints
router.get('/sections', SystemController.listSections);
router.post('/views', SystemController.incrementView);

// Admin / protected endpoints (normalized)
router.put('/admin/sections/:key/toggle', authMiddleware, SystemController.toggleSection);
router.get('/admin/proxy-image', authMiddleware, SystemController.proxyImage);

// Legacy backward-compatibility routes (non-prefixed /api)
// We will register these on the main app router as well
export const registerLegacySystemRoutes = (app: any) => {
  app.put('/admin/sections/:key/toggle', authMiddleware, SystemController.toggleSection);
};

export default router;
