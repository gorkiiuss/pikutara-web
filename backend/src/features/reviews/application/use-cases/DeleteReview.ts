import { ReviewRepository } from '../../domain/repositories/ReviewRepository.js';

export class DeleteReview {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(id: number): Promise<boolean> {
    const existing = await this.reviewRepository.getById(id);
    if (!existing) {
      throw new Error('Balorazioa ez da aurkitu.');
    }
    return this.reviewRepository.delete(id);
  }
}
