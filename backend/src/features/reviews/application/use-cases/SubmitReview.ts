import { ReviewRepository } from '../../domain/repositories/ReviewRepository.js';
import { Review } from '../../domain/models/Review.js';

export interface SubmitReviewDTO {
  rating: number;
  comment: string;
  ipAddress: string;
}

export class SubmitReview {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(dto: SubmitReviewDTO): Promise<Review> {
    if (!Review.validateRating(dto.rating)) {
      throw new Error('Balorazioa 1 eta 5 artekoa izan behar da.');
    }

    if (!Review.validateComment(dto.comment)) {
      throw new Error('Iruzkina ezin da hutsik egon.');
    }

    const existing = await this.reviewRepository.getByIpAddress(dto.ipAddress);
    if (existing) {
      throw new Error('Dagoeneko baloratu duzu zerrenda hau.');
    }

    const cleanComment = dto.comment.trim();
    const newReview = new Review(null, dto.rating, cleanComment, dto.ipAddress);
    return this.reviewRepository.create(newReview);
  }
}
