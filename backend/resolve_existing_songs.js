const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const LOCAL_ARTIST_GENDERS = require('./local_artist_genders');

const dbPath = path.join(__dirname, 'data', 'pikutara.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper: Fetch JSON with retry & exponential backoff on 429 / network errors
async function fetchJSONWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  const headers = {
    'User-Agent': 'Pikutara-TinderMusikal/1.0 (https://github.com/txartelari)',
    ...(options.headers || {})
  };
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 429) {
        console.warn(`[Rate Limit 429] Hit rate limit for ${url}. Waiting ${backoff}ms before retry...`);
        await new Promise(r => setTimeout(r, backoff));
        backoff *= 2;
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      console.warn(`[Fetch Retry] Attempt ${i + 1} failed for ${url}: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, backoff));
      backoff *= 2;
    }
  }
}

function splitArtists(artistString) {
  if (!artistString || artistString === 'Ezezaguna') return [];
  return artistString.split(/\s*(?:,|&|\+|\by\b|\bft\.?\b|\bfeat\.?\b)\s*/i)
    .map(a => a.trim())
    .filter(a => a.length > 0);
}

function cleanArtistForSearch(artist) {
  if (!artist) return '';
  let clean = artist.split(/\s*(?:feat\.?|ft\.?|&|\band\b|with|vs|y|,)\s*/i)[0];
  return clean.trim();
}

function cleanTrackForSearch(track) {
  if (!track) return '';
  let clean = track;
  clean = clean.replace(/\s*[([].*?(?:feat|ft|with|prod|edit|remix|version|live).*?[)]]/gi, '');
  clean = clean.replace(/\s*-\s*(?:remix|live|edit|radio|acoustic|version|cover).*$/i, '');
  clean = clean.replace(/\s*-\s*$/, '');
  return clean.trim() || track;
}

function detectSongLanguage(text) {
  if (!text || text.trim().length === 0) return ['unknown'];

  const normalize = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\n\r]/g, " ");
  };

  const cleanText = normalize(text);
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) return ['unknown'];

  const stopwords = {
    eu: ['eta', 'ez', 'du', 'ere', 'bat', 'dira', 'zait', 'zen', 'naiz', 'duzu', 'baino', 'nire', 'zure', 'dago', 'dute', 'ditut', 'dela', 'edo', 'arte', 'izan', 'nahi', 'hori', 'hau'],
    es: ['el', 'la', 'en', 'los', 'las', 'un', 'una', 'del', 'al', 'por', 'para', 'con', 'se', 'mi', 'tu', 'su', 'yo', 'te', 'me', 'lo', 'nosotros', 'ellos', 'ella', 'ellas', 'muy', 'bien', 'todo', 'todos', 'esta', 'este', 'esto', 'siempre', 'ahora', 'cuando', 'tengo', 'tienes', 'tiene'],
    ca: ['els', 'les', 'amb', 'perque', 'teu', 'seva', 'meu', 'meva', 'teva', 'seves', 'meus', 'teus', 'seus', 'això', 'diferent', 'segons', 'aquest', 'aquesta', 'aquells', 'aquelles', 'molt', 'molts', 'sense', 'sobre', 'també', 'mateix', 'mateixa', 'començar'],
    en: ['the', 'and', 'you', 'to', 'of', 'that', 'it', 'was', 'for', 'on', 'are', 'with', 'they', 'have', 'this', 'from', 'but', 'not'],
    gl: ['non', 'unha', 'mais', 'polo', 'pola', 'polos', 'polas', 'na', 'nas', 'nos', 'dun', 'dunha', 'duns', 'dunhas', 'co', 'ca', 'cos', 'cas', 'tamén', 'cando', 'onde', 'mentres', 'oxalá', 'grazas', 'onte', 'hoxe', 'aquí', 'alí']
  };

  const scores = { eu: 0, es: 0, ca: 0, en: 0, gl: 0 };

  for (const word of words) {
    if (stopwords.eu.includes(word)) scores.eu++;
    if (stopwords.es.includes(word)) scores.es++;
    if (stopwords.ca.includes(word)) scores.ca++;
    if (stopwords.en.includes(word)) scores.en++;
    if (stopwords.gl.includes(word)) scores.gl++;
  }

  if (words.includes('i') && scores.ca > 0) {
    scores.ca += 2;
  }
  if (words.includes('non') || words.includes('unha') || words.includes('mais') || words.includes('tamén')) {
    scores.gl += 2;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  if (sorted[0][1] < 2) return ['unknown'];

  const detected = [sorted[0][0]];
  const secondary = sorted[1];
  if (secondary && secondary[1] >= 3 && (secondary[1] / sorted[0][1]) > 0.35) {
    detected.push(secondary[0]);
  }

  return detected;
}

async function autoResolveLyricsAndLanguage(songId, title, artist) {
  try {
    const cleanTitle = cleanTrackForSearch(title);
    const cleanArtist = cleanArtistForSearch(artist);
    
    const queries = [
      { type: 'structured_original', url: `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}` },
      { type: 'structured_clean', url: `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}` },
      { type: 'query_clean', url: `https://lrclib.net/api/search?q=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}` },
      { type: 'query_original', url: `https://lrclib.net/api/search?q=${encodeURIComponent(artist + ' ' + title)}` }
    ];

    const uniqueQueries = [];
    const seenUrls = new Set();
    for (const q of queries) {
      if (!seenUrls.has(q.url)) {
        seenUrls.add(q.url);
        uniqueQueries.push(q);
      }
    }

    let lyricsText = null;

    for (const q of uniqueQueries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(q.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Pikutara-TinderMusikal/1.0 (https://github.com/txartelari)'
          }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            for (const item of data) {
              if (item.plainLyrics || item.syncedLyrics) {
                lyricsText = item.plainLyrics || item.syncedLyrics;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error(`[Lyrics Resolve] Attempt ${q.type} failed for "${title}" - "${artist}":`, e.message);
      }
    }

    if (!lyricsText) {
      const ovhQueries = [
        { type: 'ovh_original', url: `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}` },
        { type: 'ovh_clean', url: `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}` }
      ];
      for (const q of ovhQueries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(q.url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Pikutara-TinderMusikal/1.0' }
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data && data.lyrics) {
              lyricsText = data.lyrics;
              console.log(`[Lyrics Resolve] Found lyrics via lyrics.ovh for "${title}" - "${artist}"`);
              break;
            }
          }
        } catch (e) {
          // ignore
        }
        await new Promise(r => setTimeout(r, 200));
      }
    }

    let detectedLang = ['unknown'];
    if (lyricsText) {
      detectedLang = detectSongLanguage(lyricsText);
      await run("UPDATE songs SET lyrics = ?, language = ? WHERE id = ?", [
        lyricsText,
        JSON.stringify(detectedLang),
        songId
      ]);
      console.log(`[Language] Song ${songId} (${title} - ${artist}): detected [${detectedLang.join(', ')}]`);
    } else {
      const lowerTitle = title.toLowerCase();
      const lowerArtist = artist.toLowerCase();
      if (lowerTitle.includes('remix') || lowerTitle.includes('edit') || lowerArtist.includes('dj')) {
        detectedLang = ['instrumental'];
      }
      await run("UPDATE songs SET language = ? WHERE id = ?", [
        JSON.stringify(detectedLang),
        songId
      ]);
      console.log(`[Language] Song ${songId} (${title} - ${artist}): no lyrics, resolved [${detectedLang.join(', ')}]`);
    }
  } catch (err) {
    console.error(`Error resolving language for Song ${songId}:`, err.message);
  }
}

const GROUP_CLASS_IDS = new Set([
  'Q482994', 'Q215380', 'Q2088357', 'Q105740417', 'Q115740417', 'Q1782294', 'Q106855146'
]);

function guessGenderFromFirstName(name) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0].toLowerCase();
  
  const femaleNames = new Set([
    'josune', 'ainhoa', 'maite', 'nerea', 'izaro', 'irati', 'ane', 'uxue', 'leire', 
    'olaia', 'oihana', 'amaia', 'miren', 'itziar', 'garazi', 'itsaso', 'june', 
    'malen', 'maddi', 'nahia', 'saioa', 'eneritz', 'sarai', 'esti', 'estibaliz', 
    'nagore', 'haizea', 'yaiza', 'paula', 'maria', 'laura', 'marta', 'sara', 
    'andrea', 'ana', 'sofia', 'elena', 'lucia', 'carmen', 'silvia', 'bea', 
    'beatriz', 'clara', 'natalia', 'julia', 'alba', 'laida', 'nekane', 'nora', 
    'idurre', 'alaitz', 'irati', 'araia', 'elixabete', 'elena', 'lola', 'emilia', 
    'luna', 'alba', 'rosalia', 'rozalen', 'zuriñe', 'amaia', 'oihana', 'izaskun', 
    'itziar', 'arantza', 'arantxa', 'jone', 'karmele', 'edurne', 'sara', 'irene', 
    'cristina', 'sandra', 'raquel', 'silvia', 'patricia', 'mónica', 'monica', 
    'alicia', 'pilar', 'dolores', 'teresa', 'isabel', 'angela', 'belen', 'conchi', 
    'lourdes', 'gema', 'yolanda', 'susana', 'eva', 'marta', 'olga', 'esther', 
    'sonia', 'rocio', 'mercedes', 'carmen', 'ana', 'maria', 'josefa', 'francisca'
  ]);
  
  const maleNames = new Set([
    'aitor', 'asier', 'xabier', 'iker', 'gorka', 'ander', 'jon', 'julen', 'eneko', 
    'oier', 'beñat', 'unai', 'mikel', 'ibai', 'markel', 'koldo', 'haritz', 'kepa', 
    'gaizka', 'igor', 'jokin', 'egoitz', 'andoni', 'jose', 'juan', 'carlos', 
    'david', 'pablo', 'javi', 'javier', 'alex', 'alejandro', 'marc', 'joan', 
    'jordi', 'gerard', 'pau', 'joseba', 'imanol', 'txomin', 'peio', 'peru', 
    'gotzon', 'arkaitz', 'ekaitz', 'urgi', 'oihan', 'manex', 'adan', 'alvaro', 
    'antonio', 'manuel', 'francisco', 'carlos', 'luis', 'miguel', 'angel', 
    'fernando', 'daniel', 'pedro', 'raúl', 'raul', 'enrique', 'alberto', 
    'roberto', 'ramón', 'ramon', 'vicente', 'diego', 'rubén', 'ruben', 'adrian', 
    'sergio', 'jorge', 'marcos', 'ignacio', 'oscar', 'eduardo', 'victor', 
    'felipe', 'albert', 'toni', 'manolo', 'paco', 'pepe', 'rafa', 'rafael'
  ]);

  if (femaleNames.has(firstName)) return 'female';
  if (maleNames.has(firstName)) return 'male';
  return null;
}

async function resolveGenderFromWikipedia(sitelinks) {
  if (!sitelinks) return 'unknown';

  if (sitelinks.eswiki && sitelinks.eswiki.title) {
    try {
      const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sitelinks.eswiki.title)}`;
      const data = await fetchJSONWithRetry(url);
      if (data) {
        const text = (data.extract || '').toLowerCase();
        
        const femaleKeywords = ['cantautora', 'nacida', 'compositora', 'rapera', 'productora', 'cantante española', 'es una', 'hija', 'hermana', 'directora', 'actriz'];
        const maleKeywords = ['cantautor', 'nacido', 'compositor', 'rapero', 'productor', 'cantante español', 'es un', 'hijo', 'hermano', 'director', 'actor'];
        
        let femaleScore = 0;
        let maleScore = 0;
        
        for (const kw of femaleKeywords) {
          if (text.includes(kw)) femaleScore++;
        }
        for (const kw of maleKeywords) {
          if (text.includes(kw)) maleScore++;
        }
        
        if (femaleScore > maleScore) return 'female';
        if (maleScore > femaleScore) return 'male';
      }
    } catch (e) {
      // ignore
    }
  }

  if (sitelinks.enwiki && sitelinks.enwiki.title) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sitelinks.enwiki.title)}`;
      const data = await fetchJSONWithRetry(url);
      if (data) {
        const text = (data.extract || '').toLowerCase();
        
        const sheCount = (text.match(/\bshe\b/g) || []).length + (text.match(/\bher\b/g) || []).length;
        const heCount = (text.match(/\bhe\b/g) || []).length + (text.match(/\bhim\b/g) || []).length + (text.match(/\bhis\b/g) || []).length;
        const theyCount = (text.match(/\bthey\b/g) || []).length + (text.match(/\bthem\b/g) || []).length;
        
        if (sheCount > heCount && sheCount > theyCount) return 'female';
        if (heCount > sheCount && heCount > theyCount) return 'male';
        if (theyCount > sheCount && theyCount > heCount) return 'non_binary';
      }
    } catch (e) {
      // ignore
    }
  }

  return 'unknown';
}

async function searchWikipediaForQID(name) {
  const languages = ['eu', 'es', 'en'];
  for (const lang of languages) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&limit=3`;
      const data = await fetchJSONWithRetry(searchUrl);
      if (data && data.query?.search && data.query.search.length > 0) {
        const topResult = data.query.search[0];
        const snippet = (topResult.snippet || '').toLowerCase();
        const title = (topResult.title || '').toLowerCase();
        const nameLower = name.toLowerCase();
        if (title.includes(nameLower) || snippet.includes(nameLower)) {
          const propsUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(topResult.title)}&format=json`;
          const propsData = await fetchJSONWithRetry(propsUrl);
          const pageId = Object.keys(propsData.query?.pages || {})[0];
          if (pageId && propsData.query.pages[pageId].pageprops?.wikibase_item) {
            return propsData.query.pages[pageId].pageprops.wikibase_item;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

async function autoResolveArtistGender(artistName) {
  const cleanName = artistName.trim();
  if (!cleanName || cleanName === 'Ezezaguna') return;

  try {
    const exists = await get("SELECT 1 FROM artist_genders WHERE LOWER(artist) = LOWER(?)", [cleanName]);
    if (exists) {
      return;
    }

    // Check override dictionary first
    const localMatch = LOCAL_ARTIST_GENDERS[cleanName.toLowerCase()];
    if (localMatch) {
      await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, ?, 0)", [cleanName, localMatch]);
      console.log(`[Gender] Resolved local artist "${cleanName}" as [${localMatch}] via override dictionary`);
      return;
    }

    let searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanName)}&language=eu&format=json&limit=5`;
    let searchData = null;
    try {
      searchData = await fetchJSONWithRetry(searchUrl);
    } catch (e) {
      // try fallback directly
    }

    if (!searchData || !searchData.search || searchData.search.length === 0) {
      searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanName)}&language=en&format=json&limit=5`;
      try {
        searchData = await fetchJSONWithRetry(searchUrl);
      } catch (e) {
        // try fallback directly
      }
    }

    if (!searchData || !searchData.search || searchData.search.length === 0) {
      const qid = await searchWikipediaForQID(cleanName);
      if (qid) {
        searchData = { search: [{ id: qid }] };
      }
    }

    if (!searchData || !searchData.search || searchData.search.length === 0) {
      await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, 'unknown', 0)", [cleanName]);
      console.log(`[Gender] Artist "${cleanName}": not found anywhere, set to 'unknown'`);
      return;
    }

    let foundEntity = null;
    let foundEntityDetails = null;

    for (const searchResult of searchData.search) {
      const entityId = searchResult.id;
      const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&format=json`;
      const entityData = await fetchJSONWithRetry(entityUrl);
      const entity = entityData?.entities?.[entityId];

      if (!entity) continue;

      const claims = entity.claims || {};
      let isHuman = false;
      let isGroup = false;

      if (claims.P31) {
        for (const claim of claims.P31) {
          const id = claim.mainsnak?.datavalue?.value?.id;
          if (id === 'Q5') isHuman = true;
          if (GROUP_CLASS_IDS.has(id)) isGroup = true;
        }
      }

      const descEu = (entity.descriptions?.eu?.value || '').toLowerCase();
      const descEs = (entity.descriptions?.es?.value || '').toLowerCase();
      const descEn = (entity.descriptions?.en?.value || '').toLowerCase();
      const isMusicalDesc = [descEu, descEs, descEn].some(desc => 
        desc.includes('cantante') || desc.includes('singer') || desc.includes('musician') || 
        desc.includes('musikari') || desc.includes('abeslari') || desc.includes('banda') || 
        desc.includes('grupo') || desc.includes('taldea') || desc.includes('rapper') || 
        desc.includes('rapero') || desc.includes('composit') || desc.includes('music')
      );

      let hasMusicalOccupation = false;
      if (claims.P106) {
        const OCCUPATION_IDS = new Set(['Q177220', 'Q639669', 'Q488205', 'Q110595304', 'Q2252262', 'Q385557']);
        for (const claim of claims.P106) {
          const id = claim.mainsnak?.datavalue?.value?.id;
          if (OCCUPATION_IDS.has(id)) {
            hasMusicalOccupation = true;
          }
        }
      }

      if (isHuman || isGroup || isMusicalDesc || hasMusicalOccupation) {
        foundEntity = entity;
        foundEntityDetails = { isHuman, isGroup, claims };
        break;
      }
    }

    if (!foundEntity) {
      const firstResultId = searchData.search[0].id;
      const entityData = await fetchJSONWithRetry(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${firstResultId}&format=json`);
      foundEntity = entityData?.entities?.[firstResultId];
      if (foundEntity) {
        const claims = foundEntity.claims || {};
        let isHuman = false;
        let isGroup = false;
        if (claims.P31) {
          for (const claim of claims.P31) {
            const id = claim.mainsnak?.datavalue?.value?.id;
            if (id === 'Q5') isHuman = true;
            if (GROUP_CLASS_IDS.has(id)) isGroup = true;
          }
        }
        foundEntityDetails = { isHuman, isGroup, claims };
      }
    }

    if (!foundEntity) {
      await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, 'unknown', 0)", [cleanName]);
      return;
    }

    const { isHuman: isHumanFinal, isGroup: isGroupFinal, claims: claimsFinal } = foundEntityDetails;

    const GENDER_FEMALE = 'Q6581072';
    const GENDER_MALE = 'Q6581097';
    const NON_BINARY_GENDERS = new Set([
      'Q48270', 'Q5125925', 'Q189125', 'Q10976337'
    ]);
    const GENDER_TRANS_FEMALE = 'Q1052224';

    if (isHumanFinal) {
      let type = 'unknown';
      if (claimsFinal.P21) {
        const genderId = claimsFinal.P21[0]?.mainsnak?.datavalue?.value?.id;
        if (genderId === GENDER_FEMALE) type = 'female';
        else if (genderId === GENDER_MALE) type = 'male';
        else if (genderId === GENDER_TRANS_FEMALE) type = 'trans_female';
        else if (NON_BINARY_GENDERS.has(genderId)) type = 'non_binary';
      }

      if (type === 'unknown') {
        const wikiGender = await resolveGenderFromWikipedia(foundEntity.sitelinks);
        if (wikiGender !== 'unknown') type = wikiGender;
      }

      if (type === 'unknown') {
        const labelsToCheck = [
          foundEntity.labels?.eu?.value,
          foundEntity.labels?.es?.value,
          foundEntity.labels?.en?.value,
          foundEntity.aliases?.eu?.[0]?.value,
          foundEntity.aliases?.es?.[0]?.value,
          foundEntity.aliases?.en?.[0]?.value
        ].filter(Boolean);

        for (const nameVal of labelsToCheck) {
          const guess = guessGenderFromFirstName(nameVal);
          if (guess) {
            type = guess;
            break;
          }
        }
      }

      if (type === 'unknown') {
        const guess = guessGenderFromFirstName(cleanName);
        if (guess) type = guess;
      }

      await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, ?, 0)", [cleanName, type]);
      console.log(`[Gender] Artist "${cleanName}": resolved human as [${type}]`);
      return;
    }

    if (isGroupFinal) {
      const memberClaims = claimsFinal.P527 || claimsFinal.P1912 || [];
      if (memberClaims.length > 0) {
        const memberIds = memberClaims.map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
        let femaleCount = 0;
        let maleCount = 0;
        let transFemaleCount = 0;
        let nonBinaryCount = 0;

        for (const mId of memberIds) {
          try {
            const mUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${mId}&props=claims&format=json`;
            const mData = await fetchJSONWithRetry(mUrl);
            const mClaims = mData?.entities?.[mId]?.claims || {};
            if (mClaims.P21) {
              const gId = mClaims.P21[0]?.mainsnak?.datavalue?.value?.id;
              if (gId === GENDER_FEMALE) femaleCount++;
              else if (gId === GENDER_MALE) maleCount++;
              else if (gId === GENDER_TRANS_FEMALE) transFemaleCount++;
              else if (NON_BINARY_GENDERS.has(gId)) nonBinaryCount++;
            }
          } catch (e) {
            // ignore member resolution errors
          }
        }

        let type = 'unknown_group';
        if (femaleCount > 0 && maleCount === 0 && transFemaleCount === 0 && nonBinaryCount === 0) {
          type = 'female_group';
        } else if (maleCount > 0 && femaleCount === 0 && transFemaleCount === 0 && nonBinaryCount === 0) {
          type = 'male_group';
        } else if (transFemaleCount > 0 || nonBinaryCount > 0) {
          type = 'dissident_group';
        } else if (femaleCount > 0 && maleCount > 0) {
          type = 'mixed_group';
        }

        await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, ?, 0)", [cleanName, type]);
        console.log(`[Gender] Artist "${cleanName}": resolved group as [${type}] (${femaleCount}F, ${maleCount}M, ${transFemaleCount}TF, ${nonBinaryCount}NB)`);
        return;
      }

      const descEu = (foundEntity.descriptions?.eu?.value || '').toLowerCase();
      const descEs = (foundEntity.descriptions?.es?.value || '').toLowerCase();
      const descEn = (foundEntity.descriptions?.en?.value || '').toLowerCase();

      let type = 'unknown_group';
      const allDescs = [descEu, descEs, descEn].join(' ');
      if (allDescs.includes('all-female') || allDescs.includes('grupo femenino') || allDescs.includes('banda femenina') || allDescs.includes('girl group') || allDescs.includes('girl band')) {
        type = 'female_group';
      } else if (allDescs.includes('queer') || allDescs.includes('trans') || allDescs.includes('feminist') || allDescs.includes('disident')) {
        type = 'dissident_group';
      } else {
        const wikiGender = await resolveGenderFromWikipedia(foundEntity.sitelinks);
        if (wikiGender === 'female') {
          type = 'female_group';
        } else if (wikiGender === 'non_binary') {
          type = 'dissident_group';
        }
      }

      await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, ?, 0)", [cleanName, type]);
      console.log(`[Gender] Artist "${cleanName}": resolved memberless group as [${type}]`);
      return;
    }

    await run("INSERT OR IGNORE INTO artist_genders (artist, gender_type, verified) VALUES (?, 'unknown', 0)", [cleanName]);
    console.log(`[Gender] Artist "${cleanName}": resolved as [unknown]`);
  } catch (err) {
    console.error(`Error in autoResolveArtistGender for "${cleanName}":`, err.message);
  }
}

async function limitConcurrency(tasks, limit) {
  const executing = [];
  const results = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function main() {
  console.log("Starting DB migration to resolve languages and artist genders...");

  // 1. Clear ALL unverified genders so they can be re-resolved with the override dictionary and improved Wikidata heuristics
  const deleted = await run("DELETE FROM artist_genders WHERE verified = 0");
  console.log(`Cleared unverified classifications to allow re-resolution.`);

  const songs = await query("SELECT id, real_title, real_artist, language, lyrics FROM songs");
  console.log(`Found ${songs.length} songs in the database.`);

  // 2. Resolve artist genders first (sequential with sleep to strictly respect API rate limits)
  console.log("\nResolving artist genders...");
  const uniqueArtists = new Set();
  songs.forEach(song => {
    const artists = splitArtists(song.real_artist);
    artists.forEach(a => uniqueArtists.add(a));
  });

  console.log(`Found ${uniqueArtists.size} unique artists in the songs dataset.`);
  
  let resolvedCount = 0;
  for (const artist of uniqueArtists) {
    const exists = await get("SELECT 1 FROM artist_genders WHERE LOWER(artist) = LOWER(?)", [artist]);
    if (!exists) {
      resolvedCount++;
      console.log(`[${resolvedCount}] Resolving gender for: ${artist}`);
      await autoResolveArtistGender(artist);
      await new Promise(r => setTimeout(r, 450)); // Strict 450ms sleep to be very gentle on Wikidata/Wikipedia
    }
  }
  console.log("Finished resolving artist genders.");

  // 3. Resolve / update song languages
  console.log("\nResolving song languages...");
  const languageTasks = [];
  let localUpdates = 0;
  
  for (const song of songs) {
    // If the song already has lyrics cached, re-detect language locally instantly!
    if (song.lyrics && song.lyrics.trim().length > 0) {
      const newLangs = detectSongLanguage(song.lyrics);
      await run("UPDATE songs SET language = ? WHERE id = ?", [JSON.stringify(newLangs), song.id]);
      localUpdates++;
      continue;
    }

    // Otherwise, check if we need to fetch lyrics and language
    let parsedLang = [];
    try {
      parsedLang = JSON.parse(song.language || '[]');
    } catch (e) {
      parsedLang = [];
    }

    // Also re-resolve if it was classified as 'unknown' or contains 'gl' (since 'gl' had many false positives)
    if (parsedLang.length === 0 || parsedLang.includes('unknown') || parsedLang.includes('gl') || song.language === 'unknown') {
      languageTasks.push(async () => {
        console.log(`Resolving lyrics & language for song ${song.id}: ${song.real_title} - ${song.real_artist}`);
        await autoResolveLyricsAndLanguage(song.id, song.real_title || '', song.real_artist || '');
        await new Promise(r => setTimeout(r, 200));
      });
    }
  }

  console.log(`Updated ${localUpdates} song languages locally from cached lyrics.`);
  console.log(`Found ${languageTasks.length} songs needing network language resolution.`);
  if (languageTasks.length > 0) {
    await limitConcurrency(languageTasks, 4);
  }

  console.log("Migration complete!");
  db.close();
}

main().catch(err => {
  console.error("Migration failed:", err);
  db.close();
});
