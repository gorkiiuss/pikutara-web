import { AdminPlaylistReview } from '../../domain/models/AdminData.js';

export function renderReviewsSection(allReviews: AdminPlaylistReview[]): string {
  let avgScore = '0';
  if (allReviews.length > 0) {
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    avgScore = (sum / allReviews.length).toFixed(1);
  }

  return `
    <!-- Section 9: Playlist-aren Balorazioak -->
    <div class="collapsible-section" id="sec-reviews" data-tab="musika">
      <div class="collapsible-header" onclick="toggleSection('sec-reviews')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Playlist-aren Balorazioak (Batez Bestekoa: ${avgScore} / 5 ★ | ${allReviews.length} iruzkin) ⭐</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        ${allReviews.length === 0 ? '<p>Oraindik ez dago baloraziorik.</p>' : ''}
        ${allReviews.map((r) => `
          <div class="card flex" id="review-${r.id}" style="justify-content: space-between; align-items: center; display: flex;">
            <div style="flex-grow: 1;">
              <h3>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)</h3>
              <p style="font-style: italic; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">"${r.comment}"</p>
              <p style="font-size: 0.8rem; color: #aaa; margin: 0;">IP: ${r.ip_address} | Data: ${new Date(r.created_at).toLocaleDateString('eu-ES')}</p>
            </div>
            <div>
              <button class="btn btn-delete" onclick="apiCall('/admin/playlist/reviews/${r.id}', 'DELETE', 'review-${r.id}')">Ezabatu 🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
