import { SystemRepository } from '../../domain/repositories/SystemRepository.js';

export class IncrementPageView {
  constructor(private systemRepository: SystemRepository) {}

  async execute(path: string): Promise<number> {
    if (!path) {
      throw new Error('Bidea falta da');
    }

    // Normalize path (remove trailing slash, except for root)
    let normPath = path.trim();
    if (normPath.length > 1 && normPath.endsWith('/')) {
      normPath = normPath.slice(0, -1);
    }

    return this.systemRepository.incrementPageView(normPath);
  }
}
