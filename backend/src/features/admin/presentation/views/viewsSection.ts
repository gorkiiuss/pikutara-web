import { AdminPageView } from '../../domain/models/AdminData.js';

export function renderViewsSection(pageViews: AdminPageView[]): string {
  return `
    <!-- Section 1: Orrialdeen Bisitak (Views) -->
    <div class="collapsible-section" id="sec-views" data-tab="sistema">
      <div class="collapsible-header" onclick="toggleSection('sec-views')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Orrialdeen Bisitak (Views) 📊</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <table style="width: 100%; border-collapse: collapse; text-align: left; background: rgba(0,0,0,0.2); border-radius: 6px;">
            <thead>
              <tr style="border-bottom: 2px solid #ff0000; color: #ffff00;">
                <th style="padding: 10px;">Orria (Path)</th>
                <th style="padding: 10px; text-align: right;">Bisitak (Views)</th>
              </tr>
            </thead>
            <tbody>
              ${pageViews.length === 0 ? '<tr><td colspan="2" style="padding: 10px; text-align: center;">Oraindik ez dago bisitarik erregistratuta.</td></tr>' : ''}
              ${pageViews.map((pv) => `
                <tr style="border-bottom: 1px solid rgba(255, 0, 0, 0.1);">
                  <td style="padding: 10px; font-family: monospace;">${pv.path}</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #4CAF50;">${pv.views}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
