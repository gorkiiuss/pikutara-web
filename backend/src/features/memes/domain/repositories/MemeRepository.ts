import { Meme } from '../models/Meme.js';

export interface MemeRepository {
  getAll(): Promise<Meme[]>;
  getApproved(): Promise<Meme[]>;
  getById(id: number): Promise<Meme | null>;
  create(meme: Meme): Promise<Meme>;
  update(meme: Meme): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
