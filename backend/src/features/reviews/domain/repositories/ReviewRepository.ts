import { Review } from '../models/Review.js';

export interface ReviewRepository {
  getAll(): Promise<Review[]>;
  getById(id: number): Promise<Review | null>;
  getByIpAddress(ipAddress: string): Promise<Review | null>;
  create(review: Review): Promise<Review>;
  delete(id: number): Promise<boolean>;
}
