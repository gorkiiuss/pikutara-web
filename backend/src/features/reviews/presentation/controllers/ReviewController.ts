import { Request, Response } from 'express';
import { SQLiteReviewRepository } from '../../infrastructure/repositories/SQLiteReviewRepository.js';
import { HasVoted } from '../../application/use-cases/HasVoted.js';
import { SubmitReview } from '../../application/use-cases/SubmitReview.js';
import { DeleteReview } from '../../application/use-cases/DeleteReview.js';

const reviewRepository = new SQLiteReviewRepository();

export class ReviewController {
  static async checkHasVoted(req: Request, res: Response): Promise<any> {
    try {
      const hasVotedUseCase = new HasVoted(reviewRepository);
      const voted = await hasVotedUseCase.execute(req.ip || '');
      res.json({ voted });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Errorea egiaztatzean' });
    }
  }

  static async submitReview(req: Request, res: Response): Promise<any> {
    try {
      const { rating, comment } = req.body;
      const submitUseCase = new SubmitReview(reviewRepository);
      const newReview = await submitUseCase.execute({
        rating: parseInt(rating),
        comment,
        ipAddress: req.ip || ''
      });
      res.status(201).json({ success: true, review: newReview });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea balorazioa bidaltzean' });
    }
  }

  static async deleteReview(req: Request, res: Response): Promise<any> {
    try {
      const id = parseInt(req.params.id);
      const deleteUseCase = new DeleteReview(reviewRepository);
      const success = await deleteUseCase.execute(id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Errorea balorazioa ezabatzean' });
    }
  }
}
