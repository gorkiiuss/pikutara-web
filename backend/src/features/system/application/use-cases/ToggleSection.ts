import { SystemRepository } from '../../domain/repositories/SystemRepository.js';

export class ToggleSection {
  constructor(private systemRepository: SystemRepository) {}

  async execute(key: string): Promise<boolean> {
    const section = await this.systemRepository.getSectionByKey(key);
    if (!section) {
      throw new Error(`Atala ez da aurkitu: ${key}`);
    }

    section.isActive = !section.isActive;
    return this.systemRepository.updateSection(section);
  }
}
