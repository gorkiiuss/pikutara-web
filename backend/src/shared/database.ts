import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Resolve __dirname under ES Modules / NodeNext format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
// Since database.ts is inside backend/src/shared/, the data directory should remain inside backend/data/
const dbDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite DB
const dbPath = path.join(dbDir, 'pikutara.sqlite');
export const db = new (sqlite3.verbose() as any).Database(dbPath, (err: any) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeSchema();
  }
});

// Handle db connection errors to prevent unhandled process crashes
db.on('error', (err) => {
  console.error('SQLite database error event:', err.message);
});

function initializeSchema() {
  try {
    db.serialize(() => {
      // Memes table
      db.run(`
        CREATE TABLE IF NOT EXISTS memes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          contact TEXT NOT NULL,
          image_path TEXT NOT NULL,
          votes INTEGER DEFAULT 0,
          is_approved INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating memes table:', err.message);
        else console.log('Memes table initialized successfully.');
      });

      // Posters table
      db.run(`
        CREATE TABLE IF NOT EXISTS posters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          event_date TEXT NOT NULL,
          description TEXT,
          bands TEXT,
          file_path TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating posters table:', err.message);
        else console.log('Posters table initialized successfully.');
      });

      // Playlist reviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS playlist_reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rating INTEGER NOT NULL,
          comment TEXT NOT NULL,
          ip_address TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating playlist_reviews table:', err.message);
        else console.log('Playlist reviews table initialized successfully.');
      });

      // Songs table
      db.run(`
        CREATE TABLE IF NOT EXISTS songs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL UNIQUE,
          real_title TEXT,
          real_artist TEXT,
          proposed_titles TEXT DEFAULT '[]',
          proposed_artists TEXT DEFAULT '[]',
          submitters TEXT DEFAULT '[]',
          comments TEXT DEFAULT '[]',
          ips TEXT DEFAULT '[]',
          status TEXT DEFAULT 'pending',
          genres TEXT DEFAULT '[]',
          accepted_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          lyrics TEXT,
          language TEXT DEFAULT '[]'
        )
      `, (err) => {
        if (err) {
          console.error('Error creating songs table:', err.message);
        } else {
          console.log('Songs table initialized successfully.');
          // Add accepted_by column to existing databases
          db.run("ALTER TABLE songs ADD COLUMN accepted_by TEXT", (alterErr) => {
            // Ignore if the column already exists
          });
          // Add language column to existing databases
          db.run("ALTER TABLE songs ADD COLUMN language TEXT DEFAULT '[]'", (alterErr) => {
            // Ignore if the column already exists
          });
        }
      });

      // Sections (atalak) table
      db.run(`
        CREATE TABLE IF NOT EXISTS sections (
          key TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          is_active INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error creating sections table:', err.message);
        } else {
          console.log('Sections table initialized successfully.');
          // Seed default sections
          db.run(`INSERT OR IGNORE INTO sections (key, name, is_active) VALUES 
            ('boikota', 'Txartelari Ez!', 1),
            ('memeak', 'Memeak', 1),
            ('musika', 'Musika', 1),
            ('kartelak', 'Ekitaldiak', 1),
            ('bazkaria', 'Gazte Eguneko Bazkaria', 1)
          `);
        }
      });

      // Page views table
      db.run(`
        CREATE TABLE IF NOT EXISTS page_views (
          path TEXT PRIMARY KEY,
          views INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) console.error('Error creating page_views table:', err.message);
        else console.log('Page views table initialized successfully.');
      });

      // Garbage tags table
      db.run(`
        CREATE TABLE IF NOT EXISTS garbage_tags (
          tag TEXT PRIMARY KEY
        )
      `, (err) => {
        if (err) {
          console.error('Error creating garbage_tags table:', err.message);
        } else {
          console.log('Garbage tags table initialized successfully.');
          // Seed default garbage tags from muzpesil
          const defaultGarbage = [
            "3", "7 Stars", "Antifa", "Antifascist", "Argentina", "Arrasate", "Barcenas",
            "Basque", "Basque Indie", "Beats", "Berri Txarrak", "British", "Celtic", "Chile",
            "Chill", "Cloud Rap", "Comedy", "Drag", "Electro",
            "Electronica", "Euskal", "Euskal Herria", "Euskal Musika", "Euskal Rock",
            "Euskara", "Euskera", "Eusko Gudariak", "Fag", "Female Vocalists", "Feminist",
            "Galicia", "Galician", "Germany", "Hip Hop", "Idi Gorriak", "Jungle", "Latin",
            "Pais Vasco", "Piperrak", "Pop Rock", "Puerto Rico", "Punk Iberico", "Rash",
            "Sex", "Singer Songwriter", "Spain", "Spanish", "Spanish Or Latin Artists",
            "Spanish Trap", "Street Punk", "Usa", "Venezuela", "Venezuelan"
          ];
          const stmt = db.prepare("INSERT OR IGNORE INTO garbage_tags (tag) VALUES (?)");
          defaultGarbage.forEach(tag => {
            stmt.run(tag);
          });
          stmt.finalize();
        }
      });

      // Tag mappings table
      db.run(`
        CREATE TABLE IF NOT EXISTS tag_mappings (
          original_tag TEXT PRIMARY KEY,
          canonical_tag TEXT NOT NULL
        )
      `, (err) => {
        if (err) console.error('Error creating tag_mappings table:', err.message);
        else console.log('Tag mappings table initialized successfully.');
      });

      // Genre hierarchy table
      db.run(`
        CREATE TABLE IF NOT EXISTS genre_hierarchy (
          genre TEXT PRIMARY KEY,
          parent_genre TEXT NOT NULL
        )
      `, (err) => {
        if (err) console.error('Error creating genre_hierarchy table:', err.message);
        else console.log('Genre hierarchy table initialized successfully.');
      });

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'moderator',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('Users table initialized successfully.');
          // Seed default admin user if the table is empty
          db.get('SELECT COUNT(*) as count FROM users', [], (countErr, row) => {
            if (!countErr && (row as any).count === 0) {
              const ADMIN_USER = process.env.ADMIN_USER || 'admin';
              const ADMIN_PASS = process.env.ADMIN_PASS || 'pikutara2026';
              const salt = crypto.randomBytes(16).toString('hex');
              const hash = crypto.scryptSync(ADMIN_PASS, salt, 64).toString('hex');
              
              db.run(
                'INSERT INTO users (username, password_hash, salt, role) VALUES (?, ?, ?, ?)',
                [ADMIN_USER, hash, salt, 'admin'],
                (insertErr) => {
                  if (insertErr) {
                    console.error('Error seeding default admin user:', insertErr.message);
                  } else {
                    console.log(`Default admin user seeded: ${ADMIN_USER}`);
                  }
                }
              );
            }
          });
        }
      });

      // Artist genres cache table (Optimización y Fallback local)
      db.run(`
        CREATE TABLE IF NOT EXISTS artist_genres (
          artist TEXT PRIMARY KEY,
          genres TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating artist_genres table:', err.message);
        else console.log('Artist genres table initialized successfully.');
      });

      // Artist genders table (Mapeo de identidades de género/espectro)
      db.run(`
        CREATE TABLE IF NOT EXISTS artist_genders (
          artist TEXT PRIMARY KEY,
          gender_type TEXT NOT NULL,
          verified INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating artist_genders table:', err.message);
        else console.log('Artist genders table initialized successfully.');
      });

      // Algorithm settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS algorithm_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating algorithm_settings table:', err.message);
        } else {
          console.log('Algorithm settings table initialized successfully.');
          const defaultSettings = [
            { key: 'weight_lang_eu', value: '2.5' },
            { key: 'weight_lang_gl', value: '1.5' },
            { key: 'weight_lang_ca', value: '1.5' },
            { key: 'weight_lang_en', value: '1.0' },
            { key: 'weight_lang_es', value: '0.25' },
            { key: 'weight_lang_instrumental', value: '0.8' },
            { key: 'weight_lang_unknown', value: '1.0' },
            { key: 'weight_gender_female', value: '2.5' },
            { key: 'weight_gender_trans_female', value: '3.0' },
            { key: 'weight_gender_non_binary', value: '2.5' },
            { key: 'weight_gender_female_group', value: '2.5' },
            { key: 'weight_gender_dissident_group', value: '3.0' },
            { key: 'weight_gender_mixed_group', value: '1.5' },
            { key: 'weight_gender_male', value: '0.5' },
            { key: 'weight_gender_male_group', value: '0.5' },
            { key: 'weight_gender_unknown', value: '1.0' },
            { key: 'weight_rarity_factor', value: '1.0' },
            { key: 'weight_age_boost', value: '0.05' }
          ];

          const stmt = db.prepare("INSERT OR IGNORE INTO algorithm_settings (key, value) VALUES (?, ?)");
          defaultSettings.forEach(s => {
            stmt.run(s.key, s.value);
          });
          stmt.finalize();

          db.run("INSERT OR IGNORE INTO algorithm_settings (key, value) VALUES ('weight_lang_gl', '1.5')");
        }
      });

      // Bazkaria registrations table
      db.run(`
        CREATE TABLE IF NOT EXISTS bazkaria_registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          izena TEXT NOT NULL,
          abizenak TEXT NOT NULL,
          email TEXT NOT NULL,
          menu_type TEXT NOT NULL,
          konpartsakide_id INTEGER,
          ordainketa_modua TEXT NOT NULL,
          oharrak TEXT,
          mote TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (konpartsakide_id) REFERENCES konpartsakideak(id)
        )
      `, (err) => {
        if (err) console.error('Error creating bazkaria_registrations table:', err.message);
        else console.log('Bazkaria registrations table initialized successfully.');
      });

      // Konpartsakideak table
      db.run(`
        CREATE TABLE IF NOT EXISTS konpartsakideak (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          izena TEXT NOT NULL,
          dirua_jaso INTEGER DEFAULT 0,
          instagram TEXT,
          telefono TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating konpartsakideak table:', err.message);
        else console.log('Konpartsakideak table initialized successfully.');
      });
    });
  } catch (err) {
    console.error('Error initializing database schema:', err);
  }
}

// Helper query function for promises
export const query = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err) {
      if (err) reject(err);
      else resolve(this); // returns this.lastID and this.changes
    });
  });
};

export const get = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};
