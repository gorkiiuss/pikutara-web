import { GarbageTag, TagMapping, GenreHierarchy } from '../models/RulesModels.js';

export interface RulesRepository {
  findGarbageTags(): Promise<GarbageTag[]>;
  addGarbageTag(tag: string): Promise<void>;
  deleteGarbageTag(tag: string): Promise<void>;

  findTagMappings(): Promise<TagMapping[]>;
  saveTagMapping(mapping: TagMapping): Promise<void>;
  deleteTagMapping(originalTag: string): Promise<void>;
  bulkSaveTagMappings(mappings: TagMapping[]): Promise<void>;

  findGenreHierarchies(): Promise<GenreHierarchy[]>;
  saveGenreHierarchy(hierarchy: GenreHierarchy): Promise<void>;
  deleteGenreHierarchy(genre: string): Promise<void>;
  bulkSaveGenreHierarchies(hierarchies: GenreHierarchy[]): Promise<void>;

  findAlgorithmSettings(): Promise<any[]>;
  saveAlgorithmSettings(settings: any): Promise<void>;
  findArtistGenders(): Promise<any[]>;
  saveArtistGender(artist: string, genderType: string, verified: boolean): Promise<void>;
  findArtistGenres(): Promise<any[]>;
  deleteArtistGenre(artist: string): Promise<void>;
  bulkSaveArtistGenres(mappings: { artist: string; genres: string[] }[]): Promise<void>;
}

