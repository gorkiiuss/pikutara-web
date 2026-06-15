import { AdminPoster } from '../../domain/models/AdminData.js';

export function renderPostersSection(allPosters: AdminPoster[]): string {
  return `
    <!-- Section 10: Kartelak Kudeatu -->
    <div class="collapsible-section" id="sec-posters" data-tab="edukia">
      <div class="collapsible-header" onclick="toggleSection('sec-posters')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Kartelak Kudeatu 📅</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <h3>Kartela Igo</h3>
          <form action="/admin/posters" method="POST" enctype="multipart/form-data">
            <div class="form-group"><label>Izenburua</label><input name="posterTitle" required></div>
            <div class="form-group"><label>Data</label><input name="posterDate" required placeholder="Adib: Ekainak 13, Larunbata"></div>
            <div class="form-group"><label>Deskribapena</label><textarea name="posterDesc" rows="2"></textarea></div>
            <div class="form-group"><label>Artistak, Egitaraua edo Etiketak (komaz bananduta)</label><input name="posterBands" placeholder="Adib: Burutik, DJ Enabil, Kontzertua, Jaiak"></div>
            <div class="form-group"><label>Irudia (SVG, PNG, JPG)</label><input type="file" name="posterFile" required style="border: none; background: transparent; padding: 0;"></div>
            <button class="btn btn-submit" type="submit">Kartela Igo 💾</button>
          </form>
        </div>

        <h3>Igotako Kartelak (${allPosters.length})</h3>
        ${allPosters.map((p) => {
          let parsedBands = '';
          try {
            if (p.bands) {
              const parsed = JSON.parse(p.bands);
              parsedBands = Array.isArray(parsed) ? parsed.join(', ') : p.bands;
            }
          } catch (e) {
            parsedBands = p.bands || '';
          }
          return `
            <div class="card flex" id="poster-${p.id}" style="align-items: flex-start; gap: 20px;">
              <img src="${p.file_path}" style="max-width: 120px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="flex-grow: 1;">
                <h3 style="margin: 0 0 5px 0;">${p.title}</h3>
                <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #ccc;">Data: ${p.event_date}</p>
                <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #999;">Deskribapena: ${p.description || ''}</p>
                <p style="margin: 0 0 15px 0; font-size: 0.85rem; color: #999;">Etiketak: ${parsedBands}</p>
                <div style="display: flex; gap: 10px;">
                  <button class="btn btn-edit" onclick="toggleEditForm(${p.id})">Editatu ✏️</button>
                  <button class="btn btn-delete" onclick="apiCall('/admin/posters/${p.id}', 'DELETE', 'poster-${p.id}')">Ezabatu 🗑️</button>
                </div>
                
                <!-- Edit form container -->
                <div id="edit-form-${p.id}" style="display: none; margin-top: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                  <h4 style="margin: 0 0 15px 0;">Editatu Kartelaren Datuak</h4>
                  <form action="/admin/posters/${p.id}/edit" method="POST" enctype="multipart/form-data">
                    <div class="form-group" style="margin-bottom: 10px;">
                      <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Izenburua</label>
                      <input name="posterTitle" value="${p.title}" required style="width: 100%; padding: 8px; border-radius: 4px; background: #222; border: 1px solid #444; color: #fff;">
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                      <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Data</label>
                      <input name="posterDate" value="${p.event_date}" required style="width: 100%; padding: 8px; border-radius: 4px; background: #222; border: 1px solid #444; color: #fff;">
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                      <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Deskribapena</label>
                      <textarea name="posterDesc" rows="2" style="width: 100%; padding: 8px; border-radius: 4px; background: #222; border: 1px solid #444; color: #fff; resize: vertical;">${p.description || ''}</textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                      <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Artistak, Egitaraua edo Etiketak (komaz bananduta)</label>
                      <input name="posterBands" value="${parsedBands}" style="width: 100%; padding: 8px; border-radius: 4px; background: #222; border: 1px solid #444; color: #fff;">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                      <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Aldatu Irudia (Hutsik utzi mantentzeko)</label>
                      <input type="file" name="posterFile" style="color: #ccc; border: none; background: transparent; padding: 0;">
                    </div>
                    <div style="display: flex; gap: 10px;">
                      <button class="btn btn-submit" type="submit">Gorde Aldaketak 💾</button>
                      <button class="btn btn-unapprove" type="button" onclick="toggleEditForm(${p.id})">Utzi ❌</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
