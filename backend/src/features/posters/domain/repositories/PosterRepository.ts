import { Poster } from '../models/Poster.js';

export interface PosterRepository {
  getAll(): Promise<Poster[]>;
  getById(id: number): Promise<Poster | null>;
  create(poster: Poster): Promise<Poster>;
  update(poster: Poster): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
