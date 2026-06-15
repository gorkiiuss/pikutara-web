import { Section } from '../models/Section.js';

export interface SystemRepository {
  getSections(): Promise<Section[]>;
  getSectionByKey(key: string): Promise<Section | null>;
  updateSection(section: Section): Promise<boolean>;
  incrementPageView(path: string): Promise<number>;
}
