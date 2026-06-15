const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database
const dbPath = path.resolve(__dirname, '../data/pikutara.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  runAnalysis();
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Clean and normalize text: lowercase, remove accents, remove common video text and parentheses
function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[\(\[【].*?[\)\]】]/g, '') // Remove parenthesis/brackets contents (e.g. "(official video)", "[remastered]")
    .replace(/(official video|videoclip|visualizer|lyric video|official music video|video oficial|oficial video|bideoa|bideoklipa|bideoklip ofiziala|lyric|audio|hd|4k|remastered|remaster|topic|video)/gi, '') // Remove common tags
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();
}

// Levenshtein distance
function editDistance(s1, s2) {
  let costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// String similarity based on Levenshtein (0 to 1)
function getSimilarity(s1, s2) {
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length < s2.length ? s1 : s2;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

// Sorensen-Dice coefficient (n-gram similarity, good for word order changes)
function getDiceCoefficient(s1, s2) {
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const val of bigrams1) {
    if (bigrams2.has(val)) {
      intersection++;
    }
  }

  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

async function runAnalysis() {
  try {
    const songs = await query("SELECT id, url, real_title, real_artist, status, genres FROM songs");
    console.log(`Analyzing database: found ${songs.length} total songs.`);

    // 1. Check exact URL duplicates (just in case they slipped through normalization)
    const urlGroups = {};
    songs.forEach(s => {
      urlGroups[s.url] = urlGroups[s.url] || [];
      urlGroups[s.url].push(s);
    });

    const exactUrlDuplicates = Object.entries(urlGroups).filter(([url, list]) => list.length > 1);
    if (exactUrlDuplicates.length > 0) {
      console.log('\n--- EXACT URL DUPLICATES ---');
      exactUrlDuplicates.forEach(([url, list]) => {
        console.log(`URL: ${url}`);
        list.forEach(s => console.log(`  - [ID: ${s.id}] [${s.status}] "${s.real_artist} - ${s.real_title}"`));
      });
    }

    // 2. Exact Match of normalized (Artist + Title)
    const cleanedGroups = {};
    songs.forEach(s => {
      const key = `${cleanText(s.real_artist)} ||| ${cleanText(s.real_title)}`;
      cleanedGroups[key] = cleanedGroups[key] || [];
      cleanedGroups[key].push(s);
    });

    const exactCleanedDuplicates = Object.entries(cleanedGroups).filter(([key, list]) => list.length > 1);
    console.log(`\n--- EXACT CLEANED METADATA DUPLICATES (Found ${exactCleanedDuplicates.length} groups) ---`);
    exactCleanedDuplicates.forEach(([key, list]) => {
      console.log(`Normalized Key: "${key}"`);
      list.forEach(s => console.log(`  - [ID: ${s.id}] [${s.status}] "${s.real_artist} - ${s.real_title}" (${s.url})`));
    });

    // 3. Fuzzy Matching of Artist & Title
    console.log('\n--- FUZZY MATCHING DUPLICATES ---');
    const processedPairs = new Set();
    let fuzzyCount = 0;

    for (let i = 0; i < songs.length; i++) {
      const s1 = songs[i];
      const cleanArtist1 = cleanText(s1.real_artist);
      const cleanTitle1 = cleanText(s1.real_title);

      for (let j = i + 1; j < songs.length; j++) {
        const s2 = songs[j];
        
        // Skip comparing if they were already grouped in exact metadata duplicates
        const key1 = `${cleanArtist1} ||| ${cleanTitle1}`;
        const key2 = `${cleanText(s2.real_artist)} ||| ${cleanText(s2.real_title)}`;
        if (key1 === key2) continue;

        const cleanArtist2 = cleanText(s2.real_artist);
        const cleanTitle2 = cleanText(s2.real_title);

        // Calculate similarity for artists and titles separately
        const artistSim = getDiceCoefficient(cleanArtist1, cleanArtist2);
        const titleSim = getDiceCoefficient(cleanTitle1, cleanTitle2);

        // If artist is a close match (or one is subset of other) AND title is a close match
        const isArtistClose = artistSim > 0.8 || cleanArtist1.includes(cleanArtist2) || cleanArtist2.includes(cleanArtist1);
        const isTitleClose = titleSim > 0.8;

        if (isArtistClose && isTitleClose && cleanArtist1 && cleanTitle1 && cleanArtist2 && cleanTitle2) {
          fuzzyCount++;
          console.log(`Group #${fuzzyCount} (Confidence: Artist Dice=${artistSim.toFixed(2)}, Title Dice=${titleSim.toFixed(2)}):`);
          console.log(`  - [ID: ${s1.id}] [${s1.status}] "${s1.real_artist} - ${s1.real_title}" (${s1.url})`);
          console.log(`  - [ID: ${s2.id}] [${s2.status}] "${s2.real_artist} - ${s2.real_title}" (${s2.url})`);
        }
      }
    }

    db.close();
  } catch (error) {
    console.error('Error during analysis:', error);
    db.close();
  }
}
