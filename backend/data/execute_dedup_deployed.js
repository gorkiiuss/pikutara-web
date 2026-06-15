const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3'); // Usar el paquete estándar del contenedor

const DB_PATH = '/app/data/pikutara.sqlite'; // Ruta dentro del contenedor Docker

function extractYouTubeId(url) {
  if (!url) return null;
  const shortsMatch = url.match(/\/shorts\/([^&?]+)/);
  if (shortsMatch) return shortsMatch[1];
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

function normalizeSongUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  
  const videoId = extractYouTubeId(trimmed);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  const spotifyTrackMatch = trimmed.match(/\/track\/([^/?#]+)/);
  if (spotifyTrackMatch) {
    return `https://open.spotify.com/track/${spotifyTrackMatch[1]}`;
  }
  
  return trimmed;
}

function safeParseArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch (e) {
    return [val];
  }
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('BEGIN TRANSACTION');

  db.all('SELECT * FROM songs', [], async (err, rows) => {
    if (err) {
      console.error('Error querying songs:', err);
      db.run('ROLLBACK');
      process.exit(1);
    }

    console.log(`Processing ${rows.length} songs for deduplication and URL normalization...`);

    // Group by normalized URL
    const groups = {};
    for (const row of rows) {
      const normUrl = normalizeSongUrl(row.url);
      if (!groups[normUrl]) {
        groups[normUrl] = [];
      }
      groups[normUrl].push(row);
    }

    const duplicatesToDelete = [];
    const mastersToUpdate = [];
    const singlesToNormalize = [];

    for (const [normUrl, group] of Object.entries(groups)) {
      if (group.length > 1) {
        // Find master
        const sorted = [...group].sort((a, b) => {
          const score = { 'accepted': 3, 'pending': 2, 'rejected': 1 };
          const scoreA = score[a.status] || 0;
          const scoreB = score[b.status] || 0;
          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return b.id - a.id;
        });

        const master = sorted[0];
        const duplicates = sorted.slice(1);

        // Merge arrays
        const mergedTitles = new Set(safeParseArray(master.proposed_titles));
        const mergedArtists = new Set(safeParseArray(master.proposed_artists));
        const mergedSubmitters = new Set(safeParseArray(master.submitters));
        const mergedComments = new Set(safeParseArray(master.comments));
        const mergedIps = new Set(safeParseArray(master.ips));

        if (master.real_title) mergedTitles.add(master.real_title);
        if (master.real_artist) mergedArtists.add(master.real_artist);

        for (const dup of duplicates) {
          safeParseArray(dup.proposed_titles).forEach(t => mergedTitles.add(t));
          safeParseArray(dup.proposed_artists).forEach(a => mergedArtists.add(a));
          safeParseArray(dup.submitters).forEach(s => mergedSubmitters.add(s));
          safeParseArray(dup.comments).forEach(c => mergedComments.add(c));
          safeParseArray(dup.ips).forEach(i => mergedIps.add(i));
          if (dup.real_title) mergedTitles.add(dup.real_title);
          if (dup.real_artist) mergedArtists.add(dup.real_artist);
          
          duplicatesToDelete.push(dup.id);
        }

        mastersToUpdate.push({
          id: master.id,
          url: normUrl,
          proposed_titles: Array.from(mergedTitles),
          proposed_artists: Array.from(mergedArtists),
          submitters: Array.from(mergedSubmitters),
          comments: Array.from(mergedComments).filter(Boolean),
          ips: Array.from(mergedIps)
        });
      } else {
        const single = group[0];
        if (single.url !== normUrl) {
          singlesToNormalize.push({
            id: single.id,
            url: normUrl
          });
        }
      }
    }

    try {
      // 1. DELETE all duplicates first to free up the UNIQUE constraint on url
      for (const id of duplicatesToDelete) {
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM songs WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      console.log(`Deleted ${duplicatesToDelete.length} duplicate rows.`);

      // 2. UPDATE all master rows with their merged details and normalized URLs
      for (const master of mastersToUpdate) {
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE songs SET 
              url = ?, 
              proposed_titles = ?, 
              proposed_artists = ?, 
              submitters = ?, 
              comments = ?, 
              ips = ? 
             WHERE id = ?`,
            [
              master.url,
              JSON.stringify(master.proposed_titles),
              JSON.stringify(master.proposed_artists),
              JSON.stringify(master.submitters),
              JSON.stringify(master.comments),
              JSON.stringify(master.ips),
              master.id
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      console.log(`Updated and merged ${mastersToUpdate.length} master rows.`);

      // 3. Normalize single rows that just have query parameters in their URLs
      let singleNormalizedCount = 0;
      for (const single of singlesToNormalize) {
        await new Promise((resolve, reject) => {
          db.run('UPDATE songs SET url = ? WHERE id = ?', [single.url, single.id], (err) => {
            if (err) {
              reject(err);
            } else {
              singleNormalizedCount++;
              resolve();
            }
          });
        });
      }
      console.log(`Normalized ${singleNormalizedCount} single song URLs.`);

      db.run('COMMIT', (commitErr) => {
        if (commitErr) {
          console.error('Error committing transaction:', commitErr);
          db.run('ROLLBACK');
          process.exit(1);
        }
        console.log(`\nSUCCESS: Deployed database deduplicated cleanly!`);
        db.close();
      });

    } catch (execErr) {
      console.error('Execution error, rolling back:', execErr);
      db.run('ROLLBACK');
      db.close();
      process.exit(1);
    }
  });
});
