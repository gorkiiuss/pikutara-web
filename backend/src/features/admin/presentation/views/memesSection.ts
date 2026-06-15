import { AdminMeme } from '../../domain/models/AdminData.js';

export function renderMemesSection(pendingMemes: AdminMeme[], approvedMemes: AdminMeme[]): string {
  return `
    <!-- Section 7: Meme Berriak -->
    <div class="collapsible-section" id="sec-new-memes" data-tab="edukia">
      <div class="collapsible-header" onclick="toggleSection('sec-new-memes')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Meme Berriak (${pendingMemes.length}) 🖼️</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        ${pendingMemes.length === 0 ? '<p>Ez dago meme berririk.</p>' : ''}
        ${pendingMemes.map((m) => `
          <div class="card flex" id="meme-${m.id}">
            <img src="${m.image_path}">
            <div>
              <h3>${m.title}</h3><p>Kontaktua: ${m.contact}</p>
              <button class="btn btn-approve" onclick="apiCall('/admin/memes/${m.id}/approve', 'PUT', 'meme-${m.id}')">Onartu ✅</button>
              <button class="btn btn-delete" onclick="apiCall('/admin/memes/${m.id}', 'DELETE', 'meme-${m.id}')">Ezabatu 🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Section 8: Onartutako Memeak -->
    <div class="collapsible-section" id="sec-approved-memes" data-tab="edukia">
      <div class="collapsible-header" onclick="toggleSection('sec-approved-memes')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Onartutako Memeak (${approvedMemes.length}) ✅</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        ${approvedMemes.length === 0 ? '<p>Ez dago onartutako memerik.</p>' : ''}
        ${approvedMemes.map((m) => `
          <div class="card flex" id="meme-${m.id}">
            <img src="${m.image_path}">
            <div>
              <h3>${m.title}</h3><p>Kontaktua: ${m.contact}</p>
              <button class="btn btn-unapprove" onclick="apiCall('/admin/memes/${m.id}/unapprove', 'PUT', 'meme-${m.id}')">Ezkutatu 👁️‍🗨️</button>
              <button class="btn btn-delete" onclick="apiCall('/admin/memes/${m.id}', 'DELETE', 'meme-${m.id}')">Ezabatu 🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
