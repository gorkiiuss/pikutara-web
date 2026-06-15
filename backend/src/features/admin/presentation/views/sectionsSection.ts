import { AdminSection } from '../../domain/models/AdminData.js';

export function renderSectionsSection(sections: AdminSection[]): string {
  return `
    <!-- Section 2: Atalak Kudeatu (Menua & Sarbidea) -->
    <div class="collapsible-section" id="sec-sections" data-tab="sistema">
      <div class="collapsible-header" onclick="toggleSection('sec-sections')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Atalak Kudeatu (Menua & Sarbidea) ⚙️</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card" style="display: flex; gap: 15px; flex-wrap: wrap;">
          ${sections.map((s) => `
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 6px; border: 1px solid ${s.is_active === 1 ? '#4CAF50' : '#f44336'}; min-width: 180px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="margin: 0 0 5px 0;">${s.name}</h3>
                <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: ${s.is_active === 1 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                  Egoera: ${s.is_active === 1 ? 'Aktibatuta ✅' : 'Desaktibatuta ❌'}
                </p>
              </div>
              <button class="btn ${s.is_active === 1 ? 'btn-unapprove' : 'btn-approve'}" onclick="apiCall('/admin/sections/${s.key}/toggle', 'PUT', '')">
                ${s.is_active === 1 ? 'Desaktibatu ❌' : 'Aktibatu ✅'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
