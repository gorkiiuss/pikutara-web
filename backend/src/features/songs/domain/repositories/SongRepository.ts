import { Song } from '../models/Song.js';

export interface SongRepository {
  findAccepted(): Promise<Song[]>;
  findPending(): Promise<Song[]>;
  findById(id: number): Promise<Song | null>;
  findByUrl(url: string): Promise<Song | null>;
  save(song: Song): Promise<Song>;
  delete(id: number): Promise<void>;
  bulkDelete(ids: number[]): Promise<void>;
  findAll(): Promise<Song[]>;
  findUntagged(): Promise<Song[]>;
  updateLyrics(id: number, lyrics: string): Promise<void>;
}
