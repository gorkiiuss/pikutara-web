import { User } from '../models/User.js';

export interface UserRepository {
  getAll(): Promise<User[]>;
  getById(id: number): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  create(user: User): Promise<User>;
  delete(id: number): Promise<boolean>;
}
