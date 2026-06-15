import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { SQLiteUserRepository } from '../../infrastructure/repositories/SQLiteUserRepository.js';
import { ListUsers } from '../../application/use-cases/ListUsers.js';
import { CreateUser } from '../../application/use-cases/CreateUser.js';
import { DeleteUser } from '../../application/use-cases/DeleteUser.js';

const userRepository = new SQLiteUserRepository();

export class AuthController {
  static async listUsers(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const listUseCase = new ListUsers(userRepository);
      const users = await listUseCase.execute();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea erabiltzaileak kargatzean' });
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { username, password, role } = req.body;
      const createUseCase = new CreateUser(userRepository);
      const newUser = await createUseCase.execute({ username, password, role });
      res.status(201).json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea erabiltzailea sortzean' });
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const currentUsername = req.user ? req.user.username : '';
      const deleteUseCase = new DeleteUser(userRepository);
      const success = await deleteUseCase.execute(id, currentUsername);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea erabiltzailea ezabatzean' });
    }
  }
}
