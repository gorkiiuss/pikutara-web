import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware.js';
import { AuthController } from './controllers/AuthController.js';

const router = Router();

router.get('/admin/users', authMiddleware, AuthController.listUsers);
router.post('/admin/users', authMiddleware, AuthController.createUser);
router.delete('/admin/users/:id', authMiddleware, AuthController.deleteUser);

export default router;
