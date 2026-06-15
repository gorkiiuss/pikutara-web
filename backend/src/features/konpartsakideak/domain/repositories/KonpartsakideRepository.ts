import { Konpartsakide } from '../models/Konpartsakide.js';

export interface KonpartsakideRepository {
  findAll(): Promise<Konpartsakide[]>;
  findMoneyCollectors(): Promise<Konpartsakide[]>;
  findById(id: number): Promise<Konpartsakide | null>;
  save(konpartsakide: Konpartsakide): Promise<void>;
  update(id: number, konpartsakide: Partial<Konpartsakide>): Promise<void>;
  delete(id: number): Promise<void>;
}
