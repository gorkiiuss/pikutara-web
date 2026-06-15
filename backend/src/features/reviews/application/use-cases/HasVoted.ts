import { ReviewRepository } from '../../domain/repositories/ReviewRepository.js';

export class HasVoted {
  constructor(private reviewRepository: ReviewRepository) {}

  async execute(ipAddress: string): Promise<boolean> {
    if (!ipAddress) return false;
    const review = await this.reviewRepository.getByIpAddress(ipAddress);
    return review !== null;
  }
}
