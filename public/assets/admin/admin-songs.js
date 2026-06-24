// Pikutara Admin Dashboard Client-side script - Songs, Rules and Direct Addition
// Reuse globally declared variables to avoid redeclaration SyntaxErrors
if (typeof adminSongs === 'undefined') {
  var adminSongs = window.adminSongs || [];
}
if (typeof adminHierarchyRaw === 'undefined') {
  var adminHierarchyRaw = window.adminHierarchyRaw || [];
}
if (typeof adminHierarchy === 'undefined') {
  var adminHierarchy = {};
  adminHierarchyRaw.forEach(h => {
    adminHierarchy[h.genre.trim().toLowerCase()] = h.parent_genre.trim();
  });
}


async function songAction(id, status) {
  try {
    const row = document.getElementById('song-group-' + id);
    const genres = JSON.parse(row.getAttribute('data-genres') || '[]');
    const res = await fetch('/api/admin/songs/' + id + '/tinder-action', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, genres })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea egoera aldatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function songDelete(id) {
  if (!confirm('Ziur abesti hau ezabatu nahi duzula?')) return;
  try {
    const res = await fetch('/api/admin/songs/' + id, {
      method: 'DELETE'
    });
    if (res.ok) {
      document.getElementById('song-row-' + id).remove();
      const editRow = document.getElementById('edit-row-' + id);
      if (editRow) editRow.remove();
    } else {
      alert('Errorea ezabatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

function toggleEditForm(id) {
  const form = document.getElementById('edit-form-' + id);
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleSongEditForm(id) {
  const form = document.getElementById('edit-row-' + id);
  if (form) {
    form.style.display = form.style.display === 'none' ? 'table-row' : 'none';
  }
}

async function saveSongMetadata(id) {
  const title = document.getElementById('edit-title-' + id).value;
  const artist = document.getElementById('edit-artist-' + id).value;
  const genresStr = document.getElementById('edit-genres-' + id).value;
  const genres = genresStr.split(',').map(g => g.trim()).filter(Boolean);
  const submittersStr = document.getElementById('edit-submitters-' + id).value;
  const submitters = submittersStr.split(',').map(s => s.trim()).filter(Boolean);
  const commentsStr = document.getElementById('edit-comments-' + id).value;
  const comments = commentsStr.split(',').map(c => c.trim()).filter(Boolean);

  try {
    const res = await fetch('/api/admin/songs/' + id + '/metadata', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, genres, submitters, comments })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      alert('Errorea gordetzean: ' + (data.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function autoResolveGenres(id) {
  const title = document.getElementById('edit-title-' + id).value;
  const artist = document.getElementById('edit-artist-' + id).value;
  
  try {
    const res = await fetch('/api/admin/songs/' + id + '/resolve-genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist })
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('edit-genres-' + id).value = data.genres.join(', ');
      alert('Generoak eguneratu dira: ' + data.genres.join(', '));
    } else {
      const data = await res.json();
      alert('Errorea generoak bilatzean: ' + (data.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

function filterSongs(status, btn) {
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const select = document.getElementById('filter-status');
  if (select) {
    select.value = status;
    applyFiltersAndSort();
  }
}

function applyFiltersAndSort() {
  const searchVal = document.getElementById('search-songs').value.toLowerCase().trim();
  const statusVal = document.getElementById('filter-status').value;
  const adminVal = document.getElementById('filter-admin').value;
  const genreVal = document.getElementById('filter-genre').value;
  const sortVal = document.getElementById('sort-songs').value;

  const groups = Array.from(document.querySelectorAll('.song-group'));
  const visibleGroups = [];

  groups.forEach(function(group) {
    const id = group.getAttribute('data-id');
    const status = group.getAttribute('data-status') || '';
    const admin = group.getAttribute('data-accepted-by') || '';
    const searchable = (group.getAttribute('data-searchable') || '').toLowerCase();
    
    let genres = [];
    try {
      genres = JSON.parse(group.getAttribute('data-genres') || '[]');
    } catch(e) {}

    // 1. Text search
    let matchSearch = true;
    if (searchVal !== '') {
      matchSearch = (searchable.indexOf(searchVal) !== -1);
    }

    // 2. Status
    let matchStatus = true;
    if (statusVal !== 'all') {
      matchStatus = (status === statusVal);
    }

    // 3. Admin
    let matchAdmin = true;
    if (adminVal !== 'all') {
      matchAdmin = (admin === adminVal);
    }

    // 4. Genre
    let matchGenre = true;
    if (genreVal !== 'all') {
      if (genreVal === 'none') {
        matchGenre = (genres.length === 0);
      } else {
        matchGenre = (genres.indexOf(genreVal) !== -1);
      }
    }

    const show = matchSearch && matchStatus && matchAdmin && matchGenre;
    if (show) {
      group.style.display = '';
      visibleGroups.push(group);
    } else {
      group.style.display = 'none';
      // Also hide edit form if active
      const editRow = document.getElementById('edit-row-' + id);
      if (editRow) {
        editRow.style.display = 'none';
      }
    }
  });

  // Sort
  visibleGroups.sort(function(a, b) {
    const idA = parseInt(a.getAttribute('data-id'), 10);
    const idB = parseInt(b.getAttribute('data-id'), 10);
    const titleA = (a.getAttribute('data-title') || '').toLowerCase();
    const titleB = (b.getAttribute('data-title') || '').toLowerCase();
    const artistA = (a.getAttribute('data-artist') || '').toLowerCase();
    const artistB = (b.getAttribute('data-artist') || '').toLowerCase();
    const adminA = (a.getAttribute('data-accepted-by') || '').toLowerCase();
    const adminB = (b.getAttribute('data-accepted-by') || '').toLowerCase();
    const statusA = (a.getAttribute('data-status') || '').toLowerCase();
    const statusB = (b.getAttribute('data-status') || '').toLowerCase();

    if (sortVal === 'id-desc') {
      return idB - idA;
    } else if (sortVal === 'id-asc') {
      return idA - idB;
    } else if (sortVal === 'title-asc') {
      return titleA.localeCompare(titleB);
    } else if (sortVal === 'title-desc') {
      return titleB.localeCompare(titleA);
    } else if (sortVal === 'artist-asc') {
      return artistA.localeCompare(artistB);
    } else if (sortVal === 'artist-desc') {
      return artistB.localeCompare(artistA);
    } else if (sortVal === 'admin-asc') {
      return adminA.localeCompare(adminB);
    } else if (sortVal === 'status-asc') {
      return statusA.localeCompare(statusB);
    }
    return 0;
  });

  // Re-order in DOM
  const container = document.getElementById('songs-table');
  if (container) {
    visibleGroups.forEach(function(group) {
      container.appendChild(group);
    });
  }

  // Update counter
  const counterEl = document.getElementById('songs-counter');
  if (counterEl) {
    counterEl.innerText = 'Erakusten: ' + visibleGroups.length + ' / ' + groups.length + ' abesti';
  }
}

async function addTagMappingDirect(original_tag, canonical_tag) {
  try {
    const res = await fetch('/api/admin/tag-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_tag, canonical_tag })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea lotura gehitzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function addGarbageTagDirect(tag) {
  if (!tag) return;
  try {
    const res = await fetch('/api/admin/garbage-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: tag })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea etiketa gehitzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function addGarbageTag() {
  const tagInput = document.getElementById('new-garbage-tag');
  const tag = tagInput.value.trim();
  if (!tag) return;
  await addGarbageTagDirect(tag);
}

async function deleteGarbageTag(tag) {
  if (!confirm('Ziur etiketa hau zabor-zerrendatik kendu nahi duzula?')) return;
  try {
    const res = await fetch('/api/admin/garbage-tags/' + encodeURIComponent(tag), {
      method: 'DELETE'
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea etiketa ezabatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function addTagMapping() {
  const origInput = document.getElementById('mapping-original-tag');
  const canonInput = document.getElementById('mapping-canonical-tag');
  const original_tag = origInput.value.trim();
  const canonical_tag = canonInput.value.trim();
  
  if (!original_tag || !canonical_tag) {
    alert('Bi etiketak idatzi behar dituzu.');
    return;
  }

  try {
    const res = await fetch('/api/admin/tag-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_tag, canonical_tag })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert('Errorea gehitzean: ' + (errData.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function deleteTagMapping(original_tag) {
  if (!confirm('Ziur lotura hau ezabatu nahi duzula?')) return;
  try {
    const res = await fetch('/api/admin/tag-mappings/' + encodeURIComponent(original_tag), {
      method: 'DELETE'
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea ezabatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function addGenreHierarchy() {
  const subInput = document.getElementById('hierarchy-subgenre');
  const parentInput = document.getElementById('hierarchy-parent');
  const genre = subInput.value.trim();
  const parent_genre = parentInput.value.trim();
  
  if (!genre || !parent_genre) {
    alert('Bi etiketak idatzi behar dituzu.');
    return;
  }

  try {
    const res = await fetch('/api/admin/genre-hierarchy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre, parent_genre })
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const errData = await res.json().catch(() => ({}));
      alert('Errorea gehitzean: ' + (errData.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function deleteGenreHierarchy(genre) {
  if (!confirm('Ziur lotura hau ezabatu nahi duzula?')) return;
  try {
    const res = await fetch('/api/admin/genre-hierarchy/' + encodeURIComponent(genre), {
      method: 'DELETE'
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Errorea ezabatzean');
    }
  } catch (e) {
    alert('Sareko errorea');
  }
}

async function exportTagMappings() {
  try {
    const res = await fetch('/api/admin/tag-mappings');
    if (!res.ok) throw new Error('Ezin izan da daturik lortu');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pikutara_sinonimia.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Errorea esportatzean: ' + e.message);
  }
}

async function exportGenreHierarchy() {
  try {
    const res = await fetch('/api/admin/genre-hierarchy');
    if (!res.ok) throw new Error('Ezin izan da daturik lortu');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pikutara_generoen_zuhaitza.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Errorea esportatzean: ' + e.message);
  }
}

function importTagMappings(inputEl) {
  const file = inputEl.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) {
        alert('JSON fitxategiaren egitura okerra da. Array bat izan behar du.');
        return;
      }
      const confirmMsg = 'Ziur zaude inportatu nahi dituzula ' + data.length + ' lotura? Honek lehendik daudenak gainidatzi/eguneratuko ditu.';
      if (!confirm(confirmMsg)) return;

      const res = await fetch('/api/admin/tag-mappings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert('Inportazioa ongi osatu da!');
        window.location.reload();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Errorea inportatzean: ' + (errData.error || 'ezezaguna'));
      }
    } catch (err) {
      alert('JSON fitxategia irakurtzean errorea: ' + err.message);
    }
  };
  reader.readAsText(file);
  inputEl.value = '';
}

function importGenreHierarchy(inputEl) {
  const file = inputEl.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) {
        alert('JSON fitxategiaren egitura okerra da. Array bat izan behar du.');
        return;
      }
      const confirmMsg = 'Ziur zaude inportatu nahi dituzula ' + data.length + ' lotura? Honek lehendik daudenak gainidatzi/eguneratuko ditu.';
      if (!confirm(confirmMsg)) return;

      const res = await fetch('/api/admin/genre-hierarchy/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert('Inportazioa ongi osatu da!');
        window.location.reload();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('Errorea inportatzean: ' + (errData.error || 'ezezaguna'));
      }
    } catch (err) {
      alert('JSON fitxategia irakurtzean errorea: ' + err.message);
    }
  };
  reader.readAsText(file);
  inputEl.value = '';
}

let failedTracksList = [];

function renderFailedSongs() {
  const failedSongsContainer = document.getElementById('failed-songs-container');
  const failedSongsList = document.getElementById('failed-songs-list');
  const failedCountSpan = document.getElementById('failed-count');

  failedSongsList.innerHTML = '';
  failedCountSpan.innerText = failedTracksList.length.toString();

  if (failedTracksList.length === 0) {
    failedSongsContainer.style.display = 'none';
    return;
  }

  failedSongsContainer.style.display = 'block';

  failedTracksList.forEach(function(item, index) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    tr.setAttribute('data-index', index.toString());

    // URL Column
    const tdUrl = document.createElement('td');
    tdUrl.style.padding = '10px';
    tdUrl.style.wordBreak = 'break-all';
    
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.style.color = '#ff3366';
    a.style.textDecoration = 'underline';
    a.innerText = item.url;
    tdUrl.appendChild(a);

    // Error Column
    const tdErr = document.createElement('td');
    tdErr.style.padding = '10px';
    tdErr.style.color = '#ff6b6b';
    tdErr.innerText = item.error;

    // Corrected Input Column
    const tdInput = document.createElement('td');
    tdInput.style.padding = '10px';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'corrected-url-input';
    input.placeholder = 'Esteka zuzena...';
    input.style.width = '100%';
    input.style.padding = '6px';
    input.style.background = 'rgba(0, 0, 0, 0.4)';
    input.style.color = 'white';
    input.style.border = '1px solid rgba(255, 51, 102, 0.25)';
    input.style.borderRadius = '6px';
    input.style.fontFamily = 'inherit';
    input.style.fontSize = '0.85rem';
    input.value = item.correctedUrl || '';
    input.oninput = function(e) {
      item.correctedUrl = e.target.value;
    };
    tdInput.appendChild(input);

    // Actions Column
    const tdActions = document.createElement('td');
    tdActions.style.padding = '10px';
    tdActions.style.display = 'flex';
    tdActions.style.gap = '6px';

    const btnRetry = document.createElement('button');
    btnRetry.className = 'btn';
    btnRetry.style.background = 'linear-gradient(135deg, #00c853, #64dd17)';
    btnRetry.style.border = 'none';
    btnRetry.style.color = 'white';
    btnRetry.style.padding = '4px 8px';
    btnRetry.style.fontSize = '0.8rem';
    btnRetry.style.cursor = 'pointer';
    btnRetry.style.borderRadius = '4px';
    btnRetry.innerText = 'Saiatu 🔄';
    btnRetry.onclick = function() {
      retrySingleTrack(index);
    };

    const btnDiscard = document.createElement('button');
    btnDiscard.className = 'btn';
    btnDiscard.style.background = 'linear-gradient(135deg, #d50000, #ff1744)';
    btnDiscard.style.border = 'none';
    btnDiscard.style.color = 'white';
    btnDiscard.style.padding = '4px 8px';
    btnDiscard.style.fontSize = '0.8rem';
    btnDiscard.style.cursor = 'pointer';
    btnDiscard.style.borderRadius = '4px';
    btnDiscard.innerText = 'Baztertu 🗑️';
    btnDiscard.onclick = function() {
      discardSingleTrack(index);
    };

    tdActions.appendChild(btnRetry);
    tdActions.appendChild(btnDiscard);

    tr.appendChild(tdUrl);
    tr.appendChild(tdErr);
    tr.appendChild(tdInput);
    tr.appendChild(tdActions);

    failedSongsList.appendChild(tr);
  });
}

async function directAddSong() {
  const urlInput = document.getElementById('direct-song-url');
  const url = urlInput.value.trim();
  if (!url) return;

  const mode = document.querySelector('input[name="direct-add-mode"]:checked').value;
  const submitter = document.getElementById('direct-add-submitter').value.trim();
  const comment = document.getElementById('direct-add-comment').value.trim();

  const progressContainer = document.getElementById('progress-container');
  const progressStatus = document.getElementById('progress-status');
  const progressPercent = document.getElementById('progress-percent');
  const progressBar = document.getElementById('progress-bar');
  const progressCurrentItem = document.getElementById('progress-current-item');

  const failedSongsContainer = document.getElementById('failed-songs-container');
  const failedSongsList = document.getElementById('failed-songs-list');

  // Reset UI states
  failedSongsContainer.style.display = 'none';
  failedSongsList.innerHTML = '';
  failedTracksList = [];

  // Show progress bar and disable input/button
  progressContainer.style.display = 'block';
  urlInput.disabled = true;
  const btn = document.querySelector("button[onclick='directAddSong()']");
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/songs/direct-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, mode: mode, submitter: submitter, comment: comment })
    });

    if (!res.ok) {
      const errData = await res.json().catch(function() { return {}; });
      alert('Errorea abestia gehitzean: ' + (errData.error || 'ezezaguna'));
      urlInput.disabled = false;
      if (btn) btn.disabled = false;
      progressContainer.style.display = 'none';
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const chunk = await reader.read();
      const value = chunk.value;
      const done = chunk.done;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.status === 'init') {
            progressStatus.innerText = 'Abestiak aurkitzen: ' + data.total + ' abesti guztira...';
            progressBar.style.width = '0%';
            progressPercent.innerText = '0%';
          } else if (data.status === 'progress') {
            const pct = Math.round((data.current / data.total) * 100);
            progressBar.style.width = pct + '%';
            progressPercent.innerText = pct + '%';
            progressStatus.innerText = 'Prozesatzen: ' + data.current + ' / ' + data.total + ' abesti...';
            progressCurrentItem.innerText = data.url;
          } else if (data.status === 'song_error') {
            failedTracksList.push({ url: data.url, error: data.error });
            renderFailedSongs();
          } else if (data.status === 'complete') {
            progressStatus.innerText = 'Amaituta!';
            progressBar.style.width = '100%';
            progressPercent.innerText = '100%';
            
            alert('Prozesua amaituta: ' + data.added + ' abesti berri gehitu dira, ' + data.existing + ' lehendik zeuden.' +
                  (failedTracksList.length > 0 ? '\n\n⚠️ Garrantzitsua: ' + failedTracksList.length + ' abestik erroreak izan dituzte. Zerrendan ikus ditzakezu behean.' : ''));
            
            urlInput.disabled = false;
            if (btn) btn.disabled = false;

            // If there were no errors, we reload. Otherwise, do NOT reload automatically, let them view the screen.
            if (failedTracksList.length === 0) {
              window.location.reload();
            }
          } else if (data.status === 'error') {
            alert('Errorea: ' + data.message);
            urlInput.disabled = false;
            if (btn) btn.disabled = false;
            progressContainer.style.display = 'none';
          }
        } catch (e) {
          console.error("Error parsing progress chunk", e);
        }
      }
    }
  } catch (e) {
    alert('Sareko errorea prozesatzean: ' + e.message);
    urlInput.disabled = false;
    if (btn) btn.disabled = false;
    progressContainer.style.display = 'none';
  }
}

function discardSingleTrack(index) {
  failedTracksList.splice(index, 1);
  renderFailedSongs();
  if (failedTracksList.length === 0) {
    alert('Errore guztiak konpondu edo baztertu dira!');
    window.location.reload();
  }
}

function discardAllFailedSongs() {
  if (confirm('Ziur errore guztiak baztertu nahi dituzula?')) {
    failedTracksList = [];
    renderFailedSongs();
    window.location.reload();
  }
}

async function retrySingleTrack(index) {
  const item = failedTracksList[index];
  const correctedUrl = (item.correctedUrl || '').trim();
  const urlToUse = correctedUrl ? correctedUrl : item.url;

  // Get other form settings
  const mode = document.querySelector('input[name="direct-add-mode"]:checked').value;
  const submitter = document.getElementById('direct-add-submitter').value.trim();
  const comment = document.getElementById('direct-add-comment').value.trim();

  // Disable UI for this row
  const rowEl = document.querySelector('#failed-songs-list tr[data-index="' + index + '"]');
  if (rowEl) {
    const inputs = rowEl.querySelectorAll('input, button');
    inputs.forEach(function(el) { el.disabled = true; });
  }

  try {
    const res = await fetch('/api/admin/songs/direct-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlToUse, mode: mode, submitter: submitter, comment: comment })
    });

    if (!res.ok) {
      const errData = await res.json().catch(function() { return {}; });
      throw new Error(errData.error || 'Zerbitzariaren errorea');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let addResult = null;

    while (true) {
      const chunk = await reader.read();
      const value = chunk.value;
      const done = chunk.done;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.status === 'song_error') {
          addResult = { success: false, error: data.error };
        } else if (data.status === 'complete') {
          if (data.added > 0 || data.existing > 0) {
            addResult = { success: true };
          } else {
            addResult = { success: false, error: 'Ezin izan da gehitu' };
          }
        }
      }
    }

    if (addResult && addResult.success) {
      alert('Abestia ondo gehitu da!');
      failedTracksList.splice(index, 1);
      renderFailedSongs();
      if (failedTracksList.length === 0) {
        window.location.reload();
      }
    } else {
      throw new Error((addResult && addResult.error) || 'Ezezaguna');
    }
  } catch (e) {
    alert('Errorea saiakeran: ' + e.message);
    item.error = e.message;
    renderFailedSongs();
  }
}

async function retryAllFailedSongs() {
  if (failedTracksList.length === 0) return;

  const urlsToRetry = failedTracksList.map(function(item) {
    return (item.correctedUrl || '').trim() || item.url;
  });

  const mode = document.querySelector('input[name="direct-add-mode"]:checked').value;
  const submitter = document.getElementById('direct-add-submitter').value.trim();
  const comment = document.getElementById('direct-add-comment').value.trim();

  const progressContainer = document.getElementById('progress-container');
  const progressStatus = document.getElementById('progress-status');
  const progressPercent = document.getElementById('progress-percent');
  const progressBar = document.getElementById('progress-bar');
  const progressCurrentItem = document.getElementById('progress-current-item');

  const failedSongsContainer = document.getElementById('failed-songs-container');

  progressContainer.style.display = 'block';
  const buttons = failedSongsContainer.querySelectorAll('button');
  buttons.forEach(function(b) { b.disabled = true; });

  const newFailedList = [];

  try {
    const urlPayload = urlsToRetry.join('\n');

    const res = await fetch('/api/admin/songs/direct-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlPayload, mode: mode, submitter: submitter, comment: comment })
    });

    if (!res.ok) {
      const errData = await res.json().catch(function() { return {}; });
      alert('Errorea prozesatzean: ' + (errData.error || 'ezezaguna'));
      progressContainer.style.display = 'none';
      buttons.forEach(function(b) { b.disabled = false; });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const chunk = await reader.read();
      const value = chunk.value;
      const done = chunk.done;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.status === 'init') {
            progressStatus.innerText = 'Saiatzen berriro: ' + data.total + ' abesti...';
            progressBar.style.width = '0%';
            progressPercent.innerText = '0%';
          } else if (data.status === 'progress') {
            const pct = Math.round((data.current / data.total) * 100);
            progressBar.style.width = pct + '%';
            progressPercent.innerText = pct + '%';
            progressStatus.innerText = 'Prozesatzen: ' + data.current + ' / ' + data.total + ' abesti...';
            progressCurrentItem.innerText = data.url;
          } else if (data.status === 'song_error') {
            newFailedList.push({ url: data.url, error: data.error });
          } else if (data.status === 'complete') {
            progressStatus.innerText = 'Amaituta!';
            progressBar.style.width = '100%';
            progressPercent.innerText = '100%';
            
            alert('Prozesua amaituta: ' + data.added + ' abesti berri gehitu dira, ' + data.existing + ' lehendik zeuden.' +
                  (newFailedList.length > 0 ? '\n\n⚠️ ' + newFailedList.length + ' errore jarraitzen dute/berri dira.' : ''));
            
            failedTracksList = newFailedList;
            renderFailedSongs();
            
            if (failedTracksList.length === 0) {
              window.location.reload();
            }
          }
        } catch (e) {
          console.error("Error parsing progress chunk", e);
        }
      }
    }
  } catch (e) {
    alert('Sareko errorea prozesatzean: ' + e.message);
  } finally {
    progressContainer.style.display = 'none';
    buttons.forEach(function(b) { b.disabled = false; });
  }
}

function exportFailedSongs() {
  if (!failedTracksList || failedTracksList.length === 0) {
    alert('Ez dago esportatzeko errorerik.');
    return;
  }
  
  let csvContent = "URL,Error\n";
  failedTracksList.forEach(function(row) {
    const urlEscaped = '"' + row.url.replace(/"/g, '""') + '"';
    const errorEscaped = '"' + row.error.replace(/"/g, '""') + '"';
    csvContent += urlEscaped + "," + errorEscaped + "\n";
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "pikutara_erroreak_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function reResolveAllGenres() {
  if (!confirm('Ziur zerrendako abesti guztien generoak berriz analizatu eta eguneratu nahi dituzula? Prozesu honek minutu batzuk har ditzake.')) return;

  const progressContainer = document.getElementById('bulk-progress-container');
  const progressStatus = document.getElementById('bulk-progress-status');
  const progressPercent = document.getElementById('bulk-progress-percent');
  const progressBar = document.getElementById('bulk-progress-bar');
  const progressCurrentItem = document.getElementById('bulk-progress-current-item');
  const btn = document.getElementById('btn-re-resolve-all');

  // Show progress bar and disable trigger button
  progressContainer.style.display = 'block';
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/songs/re-resolve-all', {
      method: 'POST'
    });

    if (!res.ok) {
      const errData = await res.json().catch(function() { return {}; });
      alert('Errorea generoak berriz analizatzean: ' + (errData.error || 'ezezaguna'));
      window.location.reload();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const chunk = await reader.read();
      const value = chunk.value;
      const done = chunk.done;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.status === 'init') {
            progressStatus.innerText = 'Analizatzen hasieratzen: ' + data.total + ' abesti...';
            progressBar.style.width = '0%';
            progressPercent.innerText = '0%';
          } else if (data.status === 'progress') {
            const pct = Math.round((data.current / data.total) * 100);
            progressBar.style.width = pct + '%';
            progressPercent.innerText = pct + '%';
            progressStatus.innerText = 'Analizatzen: ' + data.current + ' / ' + data.total + ' abesti...';
            progressCurrentItem.innerText = data.item;
          } else if (data.status === 'complete') {
            alert('Prozesua amaituta! Abesti guztien generoak eguneratu dira.');
            window.location.reload();
          } else if (data.status === 'error') {
            alert('Errorea: ' + data.message);
            window.location.reload();
          }
        } catch (e) {
          console.error("Error parsing progress chunk", e);
        }
      }
    }
  } catch (e) {
    alert('Sareko errorea prozesatzean');
    window.location.reload();
  }
}

async function bulkDeleteFiltered() {
  const groups = Array.from(document.querySelectorAll('.song-group'));
  const visibleIds = [];

  groups.forEach(function(group) {
    if (group.style.display !== 'none') {
      const id = group.getAttribute('data-id');
      if (id) {
        visibleIds.push(parseInt(id, 10));
      }
    }
  });

  if (visibleIds.length === 0) {
    alert('Ez dago abestirik iragazitako zerrendan ezabatzeko.');
    return;
  }

  if (!confirm('Ziur iragazitako ' + visibleIds.length + ' abestiak zerrendatik ezabatu nahi dituzula? Ekintza hau ezin da desegin.')) {
    return;
  }

  const btn = document.getElementById('btn-bulk-delete');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/songs/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: visibleIds })
    });

    if (res.ok) {
      visibleIds.forEach(function(id) {
        const tbody = document.getElementById('song-group-' + id);
        if (tbody) tbody.remove();
      });
      applyFiltersAndSort();
      alert('Iragazitako ' + visibleIds.length + ' abestiak ezabatu dira.');
    } else {
      const data = await res.json().catch(function() { return {}; });
      alert('Errorea ezabatzean: ' + (data.error || 'ezezaguna'));
    }
  } catch (e) {
    alert('Sareko errorea ezabatzean');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function importGarbageTags(input) {
  const file = input.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const tags = JSON.parse(e.target.result);
      if (!Array.isArray(tags)) {
        alert('Errorea: JSON fitxategiak zerrenda bat (Array) izan behar du.');
        return;
      }
      
      if (!confirm('Ziur ' + tags.length + ' zabor etiketa inportatu nahi dituzula?')) return;
      
      const res = await fetch('/api/admin/garbage-tags/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.count + ' zabor etiketa ondo inportatu dira!');
        window.location.reload();
      } else {
        alert('Errorea inportatzean.');
      }
    } catch (err) {
      alert('Errorea fitxategia irakurtzean: ' + err.message);
    }
  };
  reader.readAsText(file);
}
