import { AdminSong, AdminGarbageTag, AdminGenreHierarchy } from '../../domain/models/AdminData.js';

export function renderSongsSection(
  allSongs: AdminSong[],
  garbageTags: AdminGarbageTag[],
  genreHierarchy: AdminGenreHierarchy[]
): string {
  const uniqueAdmins = Array.from(new Set(allSongs.map(s => s.accepted_by).filter(Boolean))).sort();
  const genresFromHierarchy = genreHierarchy.map(h => h.genre.trim());
  const genresFromSongs = allSongs.flatMap(s => s.genres || []);
  const allUniqueGenres = Array.from(
    new Set([...genresFromHierarchy, ...genresFromSongs])
  )
    .map(g => (typeof g === 'string' ? g.trim() : g))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return `
    <!-- Section 3: Abestiak edo Playlistak Gehitu -->
    <div class="collapsible-section" id="sec-direct-add" data-tab="musika">
      <div class="collapsible-header" onclick="toggleSection('sec-direct-add')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Abestiak edo Playlistak Gehitu ➕</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <p style="font-size: 0.9rem; color: #ccc; margin-top: 0; margin-bottom: 15px;">Sartu abestiaren YouTube edo Spotify esteka. Zerrendak (playlistak) ere onartzen dira (YouTube playlistak osorik prozesatzen dira; Spotifykoak 100 abestira mugatuta daude zerbitzarian Spotify API gakoak konfiguratu ezean). Aukeratu abestiak zuzenean onartu nahi dituzun, oro Tinder Musikaleko iragazkitik pasarazi nahi dituzun.</p>
          <div style="display: flex; flex-direction: column; gap: 10px; max-width: 650px;">
            <textarea id="direct-song-url" placeholder="Adib:&#10;https://open.spotify.com/playlist/...&#10;https://www.youtube.com/watch?v=...&#10;(Idatzi esteka bat lerro bakoitzeko)" style="width: 100%; min-height: 100px; padding: 10px; background: rgba(0, 0, 0, 0.4); color: white; border: 1px solid rgba(255, 51, 102, 0.25); border-radius: 6px; font-family: inherit; font-size: 0.9rem; resize: vertical;"></textarea>
            
            <div style="display: flex; gap: 20px; margin: 5px 0; align-items: center; flex-wrap: wrap;">
              <span style="font-weight: 600; color: #ff3366; font-size: 0.9rem;">Gehitzeko modua:</span>
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.9rem; color: #fff;">
                <input type="radio" name="direct-add-mode" value="direct" checked>
                Zuzenean onartu (Filtro gabe / Aceptado)
              </label>
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.9rem; color: #fff;">
                <input type="radio" name="direct-add-mode" value="filter" style="margin-left: 10px;">
                Tinder-era bidali (Filtroarekin / Zain)
              </label>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 5px;">
              <div style="flex: 1;">
                <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Proposatzailea (Submitter)</label>
                <input type="text" id="direct-add-submitter" placeholder="Lehenetsia: Administratzailea" style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.4); color: white; border: 1px solid rgba(255, 51, 102, 0.25); border-radius: 6px; font-family: inherit; font-size: 0.85rem;">
              </div>
              <div style="flex: 1;">
                <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Iruzkina (Comment)</label>
                <input type="text" id="direct-add-comment" placeholder="Lehenetsia: Zerrendatik zuzenean / Tinderrako gehituta" style="width: 100%; padding: 8px; background: rgba(0, 0, 0, 0.4); color: white; border: 1px solid rgba(255, 51, 102, 0.25); border-radius: 6px; font-family: inherit; font-size: 0.85rem;">
              </div>
            </div>

            <button class="btn btn-approve" style="align-self: flex-end;" onclick="directAddSong()">Gehitu ➕</button>
          </div>
          
          <!-- Progress Bar Container (Hidden by default) -->
          <div id="progress-container" style="display: none; margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #fff; margin-bottom: 5px;">
              <span id="progress-status">Abestiak prozesatzen...</span>
              <span id="progress-percent" style="font-weight: bold; color: #ff3366;">0%</span>
            </div>
            <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
              <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff3366, #ff00cc); transition: width 0.3s ease; border-radius: 5px;"></div>
            </div>
            <p id="progress-current-item" style="font-size: 0.8rem; color: #aaa; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace;"></p>
          </div>

          <!-- Failed Songs Container (Hidden by default) -->
          <div id="failed-songs-container" style="display: none; margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
              <h3 style="margin: 0; color: #ff3366; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                ⚠️ Prozesatu ez diren abestiak (<span id="failed-count">0</span>)
              </h3>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn" style="background: linear-gradient(135deg, #0091ea, #00b0ff); border: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.85rem; padding: 6px 12px; color: white; cursor: pointer;" onclick="retryAllFailedSongs()">Guztiak Saiatu 🔄</button>
                <button class="btn" style="background: linear-gradient(135deg, #d50000, #ff1744); border: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.85rem; padding: 6px 12px; color: white; cursor: pointer;" onclick="discardAllFailedSongs()">Guztiak Baztertu 🗑️</button>
                <button class="btn" style="background: linear-gradient(135deg, #00c853, #64dd17); border: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.85rem; padding: 6px 12px; color: white; cursor: pointer;" onclick="exportFailedSongs()">Esportatu erroreak 📥</button>
                <button class="btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem; padding: 6px 12px; color: white; cursor: pointer;" onclick="window.location.reload()">Freskatu 🔄</button>
              </div>
            </div>
            <div style="max-height: 350px; overflow-y: auto; border: 1px solid rgba(255, 51, 102, 0.25); border-radius: 6px; background: rgba(0, 0, 0, 0.55);">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; color: white;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(255, 51, 102, 0.25); background: rgba(255, 51, 102, 0.1);">
                    <th style="padding: 10px; color: #ffcc00; font-weight: 600; width: 30%;">Esteka (URL)</th>
                    <th style="padding: 10px; color: #ffcc00; font-weight: 600; width: 25%;">Errorearen arrazoia</th>
                    <th style="padding: 10px; color: #ffcc00; font-weight: 600; width: 30%;">Esteka zuzendua</th>
                    <th style="padding: 10px; color: #ffcc00; font-weight: 600; width: 15%;">Ekintzak</th>
                  </tr>
                </thead>
                <tbody id="failed-songs-list">
                  <!-- Filled dynamically -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Kantuak Kudeatu (Tinder Musikal) -->
    <div class="collapsible-section" id="sec-songs-manage" data-tab="musika">
      <div class="collapsible-header" onclick="toggleSection('sec-songs-manage')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Kantuak Kudeatu (Tinder Musikal - ${allSongs.length} abesti) 🎵</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-filter active" onclick="filterSongs('all', this)">Denak</button>
            <button class="btn btn-filter" onclick="filterSongs('pending', this)">Zain ⏳</button>
            <button class="btn btn-filter" onclick="filterSongs('accepted', this)">Onartuak ✅</button>
            <button class="btn btn-filter" onclick="filterSongs('rejected', this)">Gaitzetsiak ❌</button>
            <button class="btn btn-approve" id="btn-re-resolve-all" style="background: linear-gradient(135deg, #7b1fa2, #9c27b0); border: 1px solid rgba(255, 255, 255, 0.15);" onclick="reResolveAllGenres()">Generoak Berriz Analizatu 🔍</button>
            <button class="btn btn-delete" id="btn-bulk-delete" style="background: linear-gradient(135deg, #c62828, #f44336); border: 1px solid rgba(255, 255, 255, 0.15);" onclick="bulkDeleteFiltered()">Iragazitakoak Ezabatu 🗑️</button>
          </div>
          <div style="font-size: 0.9rem; color: #ffcc00; font-weight: bold; background: rgba(255, 51, 102, 0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255, 51, 102, 0.25);" id="songs-counter">
            Erakusten: ${allSongs.length} / ${allSongs.length} abesti
          </div>
        </div>

        <!-- Bulk Progress Bar (Hidden by default) -->
        <div id="bulk-progress-container" style="display: none; margin-bottom: 20px; background: rgba(30, 8, 38, 0.65); padding: 15px; border-radius: 8px; border: 1px solid rgba(255, 51, 102, 0.2);">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #fff; margin-bottom: 5px;">
            <span id="bulk-progress-status">Generoak berriz analizatzen...</span>
            <span id="bulk-progress-percent" style="font-weight: bold; color: #ff3366;">0%</span>
          </div>
          <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <div id="bulk-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff3366, #ff00cc); transition: width 0.3s ease; border-radius: 5px;"></div>
          </div>
          <p id="bulk-progress-current-item" style="font-size: 0.8rem; color: #aaa; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace;"></p>
        </div>

        <!-- Advanced Search & Sort Grid -->
        <div class="filter-grid">
          <!-- Search bar -->
          <div class="filter-item-large">
            <label for="search-songs" style="color: #ffcc00; font-size: 0.8rem; margin-bottom: 4px; display: block;">Bilatu (Izenburua, artista, proposatzailea...)</label>
            <input type="text" id="search-songs" placeholder="Idatzi bilatzeko..." oninput="applyFiltersAndSort()">
          </div>
          <!-- Status filter -->
          <div class="filter-item">
            <label for="filter-status" style="color: #ffcc00; font-size: 0.8rem; margin-bottom: 4px; display: block;">Egoera</label>
            <select id="filter-status" onchange="applyFiltersAndSort()">
              <option value="all">Denak</option>
              <option value="pending">Zain ⏳</option>
              <option value="accepted">Onartuak ✅</option>
              <option value="rejected">Gaitzetsiak ❌</option>
            </select>
          </div>
          <!-- Admin filter -->
          <div class="filter-item">
            <label for="filter-admin" style="color: #ffcc00; font-size: 0.8rem; margin-bottom: 4px; display: block;">Nork onartua (Admin)</label>
            <select id="filter-admin" onchange="applyFiltersAndSort()">
              <option value="all">Denak</option>
              ${uniqueAdmins.map((admin) => `<option value="${admin}">${admin}</option>`).join('')}
            </select>
          </div>
          <!-- Genre filter -->
          <div class="filter-item">
            <label for="filter-genre" style="color: #ffcc00; font-size: 0.8rem; margin-bottom: 4px; display: block;">Generoak</label>
            <select id="filter-genre" onchange="applyFiltersAndSort()">
              <option value="all">Denak</option>
              <option value="none">Generorik gabe (Hutsik) 🏷️</option>
              ${allUniqueGenres.map((g) => `<option value="${g}">${g}</option>`).join('')}
            </select>
          </div>
          <!-- Sort order -->
          <div class="filter-item">
            <label for="sort-songs" style="color: #ffcc00; font-size: 0.8rem; margin-bottom: 4px; display: block;">Ordenatu</label>
            <select id="sort-songs" onchange="applyFiltersAndSort()">
              <option value="id-desc">ID: Berrienak lehenik</option>
              <option value="id-asc">ID: Zaharrenak lehenik</option>
              <option value="title-asc">Izenburua: A-Z</option>
              <option value="title-desc">Izenburua: Z-A</option>
              <option value="artist-asc">Artista: A-Z</option>
              <option value="artist-desc">Artista: Z-A</option>
              <option value="admin-asc">Nork onartua: A-Z</option>
              <option value="status-asc">Egoera: Taldeka</option>
            </select>
          </div>
        </div>
        
        <div class="table-scroll-wrapper">
          <table id="songs-table" style="width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid #ff3366; color: #ffff00;">
                <th style="padding: 10px; width: 60px;">ID</th>
                <th style="padding: 10px; width: 250px;">Metadatu Errealak</th>
                <th style="padding: 10px;">Proposatutakoa</th>
                <th style="padding: 10px;">Proposatzaileak</th>
                <th style="padding: 10px; width: 120px;">Egoera</th>
                <th style="padding: 10px; width: 150px;">Generoak</th>
                <th style="padding: 10px; width: 160px;">Ekintzak</th>
              </tr>
            </thead>
            ${allSongs.length === 0 ? '<tbody class="empty-tbody"><tr><td colspan="7" style="padding: 10px; text-align: center;">Ez dago abestirik erregistratuta.</td></tr></tbody>' : ''}
            ${allSongs.map((s) => {
              const statusClass = ({
                pending: 'badge-pending',
                accepted: 'badge-accepted',
                rejected: 'badge-rejected'
              } as any)[s.status] || 'badge-pending';
              const statusLabel = ({
                pending: 'Zain ⏳',
                accepted: 'Onartuta ✅',
                rejected: 'Gaitzetsita ❌'
              } as any)[s.status] || s.status;
              
              const genresJson = JSON.stringify(s.genres).replace(/"/g, '&quot;');
              const escapedTitle = (s.real_title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              const escapedArtist = (s.real_artist || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              const escapedSearchable = (
                (s.real_title || '') + ' ' + 
                (s.real_artist || '') + ' ' + 
                s.proposed_titles.join(' ') + ' ' + 
                s.proposed_artists.join(' ') + ' ' + 
                s.submitters.join(' ') + ' ' + 
                s.comments.filter(Boolean).join(' ') + ' ' + 
                (s.accepted_by || '')
              ).replace(/'/g, "\\'").replace(/"/g, '&quot;').toLowerCase();
              
              return `
                <tbody id="song-group-${s.id}" class="song-group" data-id="${s.id}" data-status="${s.status}" data-title="${escapedTitle}" data-artist="${escapedArtist}" data-accepted-by="${s.accepted_by || ''}" data-genres="${genresJson}" data-searchable="${escapedSearchable}">
                  <tr id="song-row-${s.id}" class="song-row-item">
                    <td style="font-family: monospace; font-weight: bold; color: #ff3366; padding: 10px;">#${s.id}</td>
                    <td style="padding: 10px;">
                      <strong style="font-size: 0.95rem; color: #fff;">${s.real_title || 'Ezezaguna'}</strong><br/>
                      <span style="color: #aaa; font-size: 0.8rem;">${s.real_artist || 'Ezezaguna'}</span><br/>
                      <a href="${s.url}" target="_blank" style="color: #4da6ff; font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;">
                        Lotura 🔗
                      </a>
                    </td>
                    <td style="padding: 10px; font-size: 0.8rem; color: #bbb;">
                      <span style="color: #888;">Izenb:</span> ${s.proposed_titles.join(', ')}<br/>
                      <span style="color: #888;">Taldea:</span> ${s.proposed_artists.join(', ')}
                    </td>
                    <td style="padding: 10px; font-size: 0.8rem; color: #bbb;">
                      <strong>${s.submitters.join(', ')}</strong><br/>
                      <span style="font-style: italic; font-size: 0.75rem; color: #999;">"${s.comments.filter(Boolean).join(' | ')}"</span>
                      ${s.accepted_by ? `<br/><span style="font-size: 0.75rem; color: #ff9800;">Onartzailea: <strong>${s.accepted_by}</strong></span>` : ''}
                    </td>
                    <td style="padding: 10px;">
                      <span class="badge ${statusClass}">${statusLabel}</span>
                    </td>
                    <td style="padding: 10px;">
                      <div style="display: flex; flex-wrap: wrap; gap: 4px;" id="song-genres-display-${s.id}">
                        ${s.genres.length === 0 ? '<span style="color: #666; font-style: italic;">Gabe</span>' : s.genres.map((g) => `<span style="background: rgba(255, 51, 102, 0.15); color: #ff80ab; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${g}</span>`).join('')}
                      </div>
                    </td>
                    <td style="padding: 10px;">
                      <div style="display: flex; flex-direction: column; gap: 5px;">
                        <div style="display: flex; gap: 4px;">
                          ${s.status !== 'accepted' ? `<button class="btn btn-approve" style="padding: 4px 8px; font-size: 0.7rem; flex: 1;" onclick="songAction(${s.id}, 'accepted')">Onartu</button>` : ''}
                          ${s.status !== 'rejected' ? `<button class="btn btn-unapprove" style="padding: 4px 8px; font-size: 0.7rem; flex: 1;" onclick="songAction(${s.id}, 'rejected')">Gaitzetsi</button>` : ''}
                        </div>
                        <div style="display: flex; gap: 4px;">
                          <button class="btn btn-edit" style="padding: 4px 8px; font-size: 0.7rem; flex: 1;" onclick="toggleSongEditForm(${s.id})">Editatu ✏️</button>
                          <button class="btn btn-delete" style="padding: 4px 8px; font-size: 0.7rem;" onclick="songDelete(${s.id})">🗑️</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr id="edit-row-${s.id}" style="display: none; background: rgba(20, 5, 25, 0.8);">
                    <td colspan="7" style="padding: 15px; border-bottom: 2px solid #ff3366;">
                      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 600px; margin: 0 auto; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid rgba(255, 51, 102, 0.2);">
                        <h4 style="margin: 0; color: #ffcc00; font-size: 1rem;">Aldatu abestiaren informazioa (#${s.id})</h4>
                        <div style="display: flex; gap: 10px;">
                          <div style="flex: 1;">
                            <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Izenburu Erreala</label>
                            <input type="text" id="edit-title-${s.id}" value="${escapedTitle}">
                          </div>
                          <div style="flex: 1;">
                            <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Artista Erreala</label>
                            <input type="text" id="edit-artist-${s.id}" value="${escapedArtist}">
                          </div>
                        </div>
                        <div>
                          <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Generoak (komaz banatuta)</label>
                          <input type="text" id="edit-genres-${s.id}" value="${s.genres.join(', ')}">
                        </div>
                        <div style="display: flex; gap: 10px;">
                          <div style="flex: 1;">
                            <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Proposatzaileak (komaz banatuta)</label>
                            <input type="text" id="edit-submitters-${s.id}" value="${s.submitters.join(', ')}">
                          </div>
                          <div style="flex: 1;">
                            <label style="font-size: 0.8rem; color: #ccc; display: block; margin-bottom: 4px;">Iruzkinak (komaz banatuta)</label>
                            <input type="text" id="edit-comments-${s.id}" value="${s.comments.filter(Boolean).join(', ')}">
                          </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 5px;">
                          <button class="btn btn-approve" onclick="saveSongMetadata(${s.id})">Gorde 💾</button>
                          <button class="btn btn-submit" style="background: linear-gradient(135deg, #8e24aa, #ab47bc); box-shadow: 0 2px 8px rgba(171, 71, 188, 0.2); margin-top: 0;" onclick="autoResolveGenres(${s.id})">Generoak Bilatu 🔍</button>
                          <button class="btn btn-filter" onclick="toggleSongEditForm(${s.id})">Utzi ❌</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              `;
            }).join('')}
          </table>
        </div>
      </div>
    </div>
  `;
}
