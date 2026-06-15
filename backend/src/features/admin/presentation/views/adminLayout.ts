import {
  AdminMeme, AdminPoster, AdminPlaylistReview, AdminSection,
  AdminPageView, AdminSong, AdminGarbageTag, AdminTagMapping,
  AdminGenreHierarchy, AdminUser, AdminBazkariaRegistration
} from '../../domain/models/AdminData.js';

import { renderViewsSection } from './viewsSection.js';
import { renderSectionsSection } from './sectionsSection.js';
import { renderSongsSection } from './songsSection.js';
import { renderRulesSection } from './rulesSection.js';
import { renderMemesSection } from './memesSection.js';
import { renderPostersSection } from './postersSection.js';
import { renderReviewsSection } from './reviewsSection.js';
import { renderUsersSection } from './usersSection.js';
import { renderBazkariaSection } from './bazkariaSection.js';

export interface AdminRenderData {
  pendingMemes: AdminMeme[];
  approvedMemes: AdminMeme[];
  allPosters: AdminPoster[];
  allReviews: AdminPlaylistReview[];
  sections: AdminSection[];
  pageViews: AdminPageView[];
  allSongs: AdminSong[];
  garbageTags: AdminGarbageTag[];
  tagMappings: AdminTagMapping[];
  genreHierarchy: AdminGenreHierarchy[];
  allUsers: AdminUser[];
  bazkariRegistrations: AdminBazkariaRegistration[];
}

export function renderAdminLayout(data: AdminRenderData): string {
  const { allSongs, genreHierarchy } = data;

  return `<!DOCTYPE html>
<html lang="eu">
<head>
  <meta charset="UTF-8">
  <title>Pikutara Admin</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="/assets/admin/admin.css">
</head>
<body>
  <div class="container">
    <h1>Pikutara Admin Panel</h1>

    <!-- Control Toolbar to Collapse/Expand all -->
    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px;">
      <button class="btn btn-filter" onclick="toggleAllSections(false)">Dena Tolestu 📁</button>
      <button class="btn btn-filter" onclick="toggleAllSections(true)">Dena Zabaldu 📂</button>
    </div>

    <!-- Category Tabs Navigation -->
    <div class="admin-tabs">
      <button class="tab-btn" data-target="musika" onclick="switchTab('musika')">🎵 Musika</button>
      <button class="tab-btn" data-target="etiketak" onclick="switchTab('etiketak')">🏷️ Etiketak & Generoak</button>
      <button class="tab-btn" data-target="edukia" onclick="switchTab('edukia')">🖼️ Edukiak</button>
      <button class="tab-btn" data-target="erabiltzaileak" onclick="switchTab('erabiltzaileak')">👥 Erabiltzaileak</button>
      <button class="tab-btn" data-target="sistema" onclick="switchTab('sistema')">⚙️ Webgunea</button>
    </div>

    <div id="collapsible-sections-container">
      ${renderViewsSection(data.pageViews)}
      ${renderSectionsSection(data.sections)}
      ${renderSongsSection(data.allSongs, data.garbageTags, data.genreHierarchy)}
      ${renderRulesSection(data.garbageTags, data.tagMappings, data.genreHierarchy, data.allSongs)}
      ${renderMemesSection(data.pendingMemes, data.approvedMemes)}
      ${renderPostersSection(data.allPosters)}
      ${renderReviewsSection(data.allReviews)}
      ${renderUsersSection(data.allUsers)}
      ${renderBazkariaSection(data.bazkariRegistrations)}
    </div>
  </div>

  <!-- Inject runtime variables as globals -->
  <script>
    window.adminSongs = ${JSON.stringify(allSongs)};
    window.adminHierarchyRaw = ${JSON.stringify(genreHierarchy)};
  </script>
  <script src="/assets/admin/admin.js"></script>
</body>
</html>
`;
}
