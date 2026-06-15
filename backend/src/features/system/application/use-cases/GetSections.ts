import { SystemRepository } from '../../domain/repositories/SystemRepository.js';
import { Section } from '../../domain/models/Section.js';

export class GetSections {
  constructor(private systemRepository: SystemRepository) {}

  async execute(): Promise<Section[]> {
    return this.systemRepository.getSections();
  }
}
