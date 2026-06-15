export class Review {
  constructor(
    public id: number | null,
    public rating: number,
    public comment: string,
    public ipAddress: string,
    public createdAt?: string
  ) {}

  static validateRating(rating: number): boolean {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
  }

  static validateComment(comment: string): boolean {
    return typeof comment === 'string' && comment.trim().length > 0;
  }
}
