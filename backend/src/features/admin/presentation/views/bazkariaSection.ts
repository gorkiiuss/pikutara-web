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
                    <td>
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
