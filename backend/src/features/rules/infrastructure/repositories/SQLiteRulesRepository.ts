import { RulesRepository } from '../../domain/repositories/RulesRepository.js';
import { GarbageTag, TagMapping, GenreHierarchy } from '../../domain/models/RulesModels.js';
import { query, run, db } from '../../../../shared/database.js';

export class SQLiteRulesRepository implements RulesRepository {
  async findGarbageTags(): Promise<GarbageTag[]> {
    const rows = await query('SELECT tag FROM garbage_tags ORDER BY tag ASC');
    return rows.map(r => new GarbageTag(r.tag));
  }

  async addGarbageTag(tag: string): Promise<void> {
    await run('INSERT OR IGNORE INTO garbage_tags (tag) VALUES (?)', [tag]);
  }

  async deleteGarbageTag(tag: string): Promise<void> {
    await run('DELETE FROM garbage_tags WHERE tag = ?', [tag]);
  }

  async findTagMappings(): Promise<TagMapping[]> {
    const rows = await query('SELECT original_tag, canonical_tag FROM tag_mappings ORDER BY original_tag ASC');
    return rows.map(r => new TagMapping(r.original_tag, r.canonical_tag));
  }

  async saveTagMapping(mapping: TagMapping): Promise<void> {
    await run('INSERT OR REPLACE INTO tag_mappings (original_tag, canonical_tag) VALUES (?, ?)', [
      mapping.originalTag,
      mapping.canonicalTag
    ]);
  }

  async deleteTagMapping(originalTag: string): Promise<void> {
    await run('DELETE FROM tag_mappings WHERE original_tag = ?', [originalTag]);
  }

  async bulkSaveTagMappings(mappings: TagMapping[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);
        });

        const stmt = db.prepare('INSERT OR REPLACE INTO tag_mappings (original_tag, canonical_tag) VALUES (?, ?)');
        let hasError = false;
        let lastErr: any = null;

        for (const m of mappings) {
          if (m.originalTag && m.canonicalTag) {
            stmt.run(m.originalTag, m.canonicalTag, (runErr) => {
              if (runErr) {
                hasError = true;
                lastErr = runErr;
              }
            });
          }
        }

        stmt.finalize((finalErr) => {
          if (finalErr || hasError) {
            db.run('ROLLBACK', () => {
              reject(finalErr || lastErr || new Error('Error during bulk insert of tag mappings'));
            });
          } else {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK', () => reject(commitErr));
              } else {
                resolve();
              }
            });
          }
        });
      });
    });
  }

  async findGenreHierarchies(): Promise<GenreHierarchy[]> {
    const rows = await query('SELECT genre, parent_genre FROM genre_hierarchy ORDER BY genre ASC');
    return rows.map(r => new GenreHierarchy(r.genre, r.parent_genre));
  }

  async saveGenreHierarchy(hierarchy: GenreHierarchy): Promise<void> {
    await run('INSERT OR REPLACE INTO genre_hierarchy (genre, parent_genre) VALUES (?, ?)', [
      hierarchy.genre,
      hierarchy.parentGenre
    ]);
  }

  async deleteGenreHierarchy(genre: string): Promise<void> {
    await run('DELETE FROM genre_hierarchy WHERE genre = ?', [genre]);
  }

  async bulkSaveGenreHierarchies(hierarchies: GenreHierarchy[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);
        });

        const stmt = db.prepare('INSERT OR REPLACE INTO genre_hierarchy (genre, parent_genre) VALUES (?, ?)');
        let hasError = false;
        let lastErr: any = null;

        for (const h of hierarchies) {
          if (h.genre && h.parentGenre) {
            stmt.run(h.genre, h.parentGenre, (runErr) => {
              if (runErr) {
                hasError = true;
                lastErr = runErr;
              }
            });
          }
        }

        stmt.finalize((finalErr) => {
          if (finalErr || hasError) {
            db.run('ROLLBACK', () => {
              reject(finalErr || lastErr || new Error('Error during bulk insert of genre hierarchy'));
            });
          } else {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK', () => reject(commitErr));
              } else {
                resolve();
              }
            });
          }
        });
      });
    });
  }

  async findAlgorithmSettings(): Promise<any[]> {
    return query("SELECT key, value FROM algorithm_settings");
  }

  async saveAlgorithmSettings(settings: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO algorithm_settings (key, value) VALUES (?, ?)");
        let hasError = false;
        let lastErr: any = null;

        if (Array.isArray(settings)) {
          settings.forEach(s => {
            if (s.key && s.value !== undefined) {
              stmt.run(s.key, String(s.value), (err) => {
                if (err) { hasError = true; lastErr = err; }
              });
            }
          });
        } else {
          Object.entries(settings).forEach(([key, value]) => {
            stmt.run(key, String(value), (err) => {
              if (err) { hasError = true; lastErr = err; }
            });
          });
        }

        stmt.finalize((err) => {
          if (err || hasError) {
            reject(err || lastErr);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async findArtistGenders(): Promise<any[]> {
    return query("SELECT artist, gender_type, verified, updated_at FROM artist_genders ORDER BY artist ASC");
  }

  async saveArtistGender(artist: string, genderType: string, verified: boolean): Promise<void> {
    await run(
      "INSERT OR REPLACE INTO artist_genders (artist, gender_type, verified, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      [artist.trim(), genderType, verified ? 1 : 0]
    );
  }

  async findArtistGenres(): Promise<any[]> {
    const rows = await query("SELECT artist, genres FROM artist_genres ORDER BY artist ASC");
    rows.forEach(r => {
      try {
        r.genres = JSON.parse(r.genres || '[]');
      } catch (e) {
        r.genres = [];
      }
    });
    return rows;
  }

  async deleteArtistGenre(artist: string): Promise<void> {
    await run("DELETE FROM artist_genres WHERE artist = ?", [artist]);
  }

  async bulkSaveArtistGenres(mappings: { artist: string; genres: string[] }[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) return reject(err);
        });
        const stmt = db.prepare("INSERT OR REPLACE INTO artist_genres (artist, genres, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
        let hasError = false;
        let lastErr: any = null;

        for (const m of mappings) {
          const artist = m.artist;
          const genres = m.genres;
          if (artist && typeof artist === 'string' && Array.isArray(genres)) {
            stmt.run(artist.trim(), JSON.stringify(genres), (runErr) => {
              if (runErr) {
                hasError = true;
                lastErr = runErr;
              }
            });
          }
        }

        stmt.finalize((finalErr) => {
          if (finalErr || hasError) {
            db.run("ROLLBACK", () => {
              reject(finalErr || lastErr || new Error("Error during bulk insert of artist genres"));
            });
          } else {
            db.run("COMMIT", (commitErr) => {
              if (commitErr) {
                db.run("ROLLBACK", () => reject(commitErr));
              } else {
                resolve();
              }
            });
          }
        });
      });
    });
  }
}
