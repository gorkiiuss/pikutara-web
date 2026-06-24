import { AdminBazkariaRegistration } from '../../domain/models/AdminData.js';

export function renderBazkariaSection(bazkariRegistrations: AdminBazkariaRegistration[]): string {
  return `
    <!-- Section: Bazkariko Izen-emateak -->
    <div class="collapsible-section" id="sec-bazkaria" data-tab="erabiltzaileak">
      <div class="collapsible-header" onclick="toggleSection('sec-bazkaria')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Bazkariko Izen-emateak (${bazkariRegistrations.length}) 🍽️</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <p style="font-size: 0.9rem; color: #ccc; margin: 0;">Gazte Eguneko bazkarirako apuntatu diren pertsonen zerrenda. Deskargatu CSV formatuan inprimatzeko edo Excel-en kudeatzeko.</p>
            <button class="btn btn-filter" onclick="exportBazkaria()" style="background: rgba(255, 51, 102, 0.2); border-color: #ff3366; color: #fff;">
              Esportatu Zerrenda 📥 (CSV)
            </button>
          </div>
          
          <!-- Broadcast Email Form -->
          <div class="card" style="border: 1px solid rgba(255, 204, 0, 0.3); background: rgba(30, 8, 38, 0.85); margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <h3 style="color: #ffcc00; margin-top: 0; display: flex; align-items: center; gap: 8px; font-size: 1.15rem;">
              ✉️ Mezu Difusioa (Enviar correo masivo)
            </h3>
            <p style="font-size: 0.85rem; color: #ccc; margin-top: -10px; margin-bottom: 15px;">
              Idatzi mezu bat eta itsatsi Google Driveko esteka bat bazkarian izena eman duten guztiei bidaltzeko (posta elektronikoz banan-banan bidaliko da).
            </p>
            
            <form id="broadcast-email-form" onsubmit="sendBroadcastEmail(event)">
              <div class="form-group">
                <label for="broadcast-subject">Gaia / Asunto</label>
                <input type="text" id="broadcast-subject" required placeholder="adib: Gazte Eguneko bazkariko argazkiak! 📸" value="Gazte Eguneko bazkariko argazkiak! 📸">
              </div>
              
              <div class="form-group">
                <label for="broadcast-drive">Google Drive Esteka / Enlace Google Drive</label>
                <input type="url" id="broadcast-drive" required placeholder="https://drive.google.com/drive/folders/..." value="">
              </div>
              
              <div class="form-group">
                <label for="broadcast-message">Mezua / Mensaje</label>
                <textarea id="broadcast-message" rows="5" required placeholder="Idatzi hemen bidali nahi duzun testua... (adib: Aupa! Hemen dituzue bazkariko argazkiak...)"></textarea>
              </div>
              
              <div style="display: flex; gap: 12px; align-items: center; margin-top: 15px;">
                <button type="submit" class="btn btn-submit" style="margin-top: 0; background: linear-gradient(135deg, #ff00ff, #700070); border: 1px solid #ff00ff; color: #fff; box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);">
                  Bidali Mezua Guztiei ✉️ (Enviar a todos)
                </button>
                <span id="broadcast-status" style="font-size: 0.9rem; color: #ffcc00; font-weight: bold; display: none;">Bidaltzen... ⏳</span>
              </div>
            </form>
          </div>
          
          <div class="table-scroll-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Izena eta Abizenak</th>
                  <th>Emaila</th>
                  <th>Menua</th>
                  <th>Oharrak / Alergiak</th>
                  <th>Ordainketa Bidea</th>
                  <th>Pagado?</th>
                  <th>Data</th>
                  <th>Ekintzak</th>
                </tr>
              </thead>
              <tbody>
                ${bazkariRegistrations.length === 0 ? '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #ccc;">Ez dago izen-ematerik oraindik.</td></tr>' : ''}
                ${bazkariRegistrations.map(r => `
                  <tr id="bazkaria-row-${r.id}">
                    <td style="color: #888;">${r.id}</td>
                    <td>
                      <strong>${r.izena} ${r.abizenak}</strong>
                      ${r.mote ? `<br><span style="color: #ffcc00; font-size: 0.8rem; font-weight: bold;">🏷️ Mote: ${r.mote}</span>` : ''}
                    </td>
                    <td style="color: #4da6ff; font-size: 0.85rem;">${r.email}</td>
                    <td>
                      ${r.menu_type === 'beganoa'
                        ? '<span class="badge badge-accepted">🌱 Beganoa</span>'
                        : '<span class="badge badge-pending" style="color: #ff9800; border-color: #ff9800; background: rgba(255,152,0,0.1);">🍖 Haragijalea</span>'}
                    </td>
                    <td style="${r.oharrak ? 'color: #ff3366; font-weight: bold; background: rgba(255,0,51,0.05);' : 'color: #888;'}">
                      ${r.oharrak ? r.oharrak : '-'}
                    </td>
                    <td>
                      ${r.ordainketa_modua === 'aurretiaz'
                        ? '<span style="color: #00ffcc; font-weight: bold;">Aurretiaz</span><br><span style="font-size: 0.8rem; color: #aaa;">(Nori: ' + (r.konpartsakide_izena || 'Ezezaguna') + ')</span>'
                        : r.ordainketa_modua === 'ganetza_presentziala'
                          ? '<span style="color: #ff9900; font-weight: bold;">🚨 Ganetzan</span>'
                          : r.ordainketa_modua === 'pikutara_zuzenean'
                            ? '<span style="color: #ff00ff; font-weight: bold;">Pikutara</span>'
                            : '<span style="color: #ffcc00; font-weight: bold;">Egunean bertan</span>'}
                    </td>
                    <td>
                      ${r.is_paid === 1
                        ? `<button class="btn btn-approve" onclick="toggleBazkariaPaid(${r.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: rgba(76, 175, 80, 0.2); border: 1px solid #4caf50; color: #81c784;">Ordainduta ✅</button>`
                        : `<button class="btn btn-unapprove" onclick="toggleBazkariaPaid(${r.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: rgba(244, 67, 54, 0.2); border: 1px solid #f44336; color: #e57373;">Zain ❌</button>`
                      }
                    </td>
                    <td style="font-family: monospace; font-size: 0.85rem; color: #bbb;">${new Date(r.created_at).toLocaleString('eu-ES')}</td>
                    <td style="display: flex; gap: 5px;">
                      <button class="btn" onclick="resendBazkariaEmail(${r.id})" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; background: rgba(77, 166, 255, 0.2); border: 1px solid #4da6ff; color: #fff;">Posta ✉️</button>
                      <button class="btn btn-delete" onclick="deleteBazkaria(${r.id})" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;">Ezabatu 🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
