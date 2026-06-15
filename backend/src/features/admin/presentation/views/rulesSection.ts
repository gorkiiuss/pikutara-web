import { AdminGarbageTag, AdminTagMapping, AdminGenreHierarchy, AdminSong } from '../../domain/models/AdminData.js';

export function renderRulesSection(
  garbageTags: AdminGarbageTag[],
  tagMappings: AdminTagMapping[],
  genreHierarchy: AdminGenreHierarchy[],
  allSongs: AdminSong[]
): string {
  // Build hierarchical genre tree HTML
  const parentMap = new Map<string, string>(); // child -> parent
  const childrenMap = new Map<string, string[]>(); // parent -> list of children
  const allUniqueGenresInHierarchy = new Set<string>();
  
  genreHierarchy.forEach(h => {
    const g = h.genre.trim();
    const p = h.parent_genre.trim();
    parentMap.set(g.toLowerCase(), p);
    if (!childrenMap.has(p.toLowerCase())) {
      childrenMap.set(p.toLowerCase(), []);
    }
    childrenMap.get(p.toLowerCase())!.push(g);
    allUniqueGenresInHierarchy.add(g);
    allUniqueGenresInHierarchy.add(p);
  });
  
  // Find roots of the hierarchy
  const roots: string[] = [];
  allUniqueGenresInHierarchy.forEach(g => {
    if (!parentMap.has(g.toLowerCase())) {
      roots.push(g);
    }
  });
  
  roots.sort((a, b) => a.localeCompare(b));
  
  function renderTreeNode(nodeName: string): string {
    const children = childrenMap.get(nodeName.toLowerCase()) || [];
    children.sort((a, b) => a.localeCompare(b));
    
    const hasParent = parentMap.has(nodeName.toLowerCase());
    // Only show deletion button for subgenres (children)
    const deleteBtn = hasParent 
      ? `<span class="tree-node-delete" onclick="deleteGenreHierarchy('${nodeName.replace(/'/g, "\\'")}')" title="Kendu lotura">×</span>`
      : '';
      
    const badgeClass = hasParent ? 'tree-node-child' : 'tree-node-root';
    const icon = hasParent ? '🏷\uFE0F' : '🌳';
    const toggleBtn = children.length > 0
      ? `<span class="tree-node-toggle" onclick="toggleTreeNode(event, this)" style="cursor: pointer; margin-right: 6px; user-select: none; font-size: 0.8rem; color: #ff3366;">▼</span>`
      : '';
    
    let nodeHtml = `
      <li>
        <span class="tree-node ${badgeClass}">
          ${toggleBtn}${icon} ${nodeName}${deleteBtn}
        </span>
    `;
    
    if (children.length > 0) {
      nodeHtml += `<ul>`;
      children.forEach(c => {
        nodeHtml += renderTreeNode(c);
      });
      nodeHtml += `</ul>`;
    }
    
    nodeHtml += `</li>`;
    return nodeHtml;
  }
  
  let genreTreeHtml = `<ul class="genre-tree-root">`;
  if (roots.length === 0) {
    genreTreeHtml += `<p style="font-style: italic; color: #888; margin: 0;">Ez dago genero hierarkiarik zehaztuta une honetan.</p>`;
  } else {
    roots.forEach(root => {
      genreTreeHtml += renderTreeNode(root);
    });
  }
  genreTreeHtml += `</ul>`;

  // Compute frequency of active tags not in the garbage list
  const garbageSet = new Set(garbageTags.map(g => g.tag.trim().toLowerCase()));
  const nonGarbageTagCounts: Record<string, number> = {};
  allSongs.forEach(s => {
    if (s.genres && Array.isArray(s.genres)) {
      s.genres.forEach((g: string) => {
        if (typeof g === 'string') {
          const trimmed = g.trim();
          const lower = trimmed.toLowerCase();
          if (!garbageSet.has(lower)) {
            nonGarbageTagCounts[trimmed] = (nonGarbageTagCounts[trimmed] || 0) + 1;
          }
        }
      });
    }
  });

  const sortedNonGarbageTags = Object.entries(nonGarbageTagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.count - b.count); // Ascending order (least occurrences first)

  return `
    <!-- Section: Generoen Estatistikak -->
    <div class="collapsible-section" id="sec-genre-statistics" data-tab="etiketak">
      <div class="collapsible-header" onclick="toggleSection('sec-genre-statistics')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Generoen Estatistikak 📊</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card" style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: white; font-size: 0.95rem; user-select: none;">
            <input type="checkbox" id="include-pending-stats" onchange="updateAdminChart()" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ff3366;" checked>
            Zain dauden abestiak (Tinder) estatistiketan sartu
          </label>
          
          <div id="adminChartBreadcrumbContainer" style="display: none; align-items: center; gap: 10px;">
            <button class="btn btn-filter" id="adminChartBackButton" style="padding: 4px 10px; font-size: 0.8rem; margin: 0;">⬅️ Atzera</button>
            <span id="adminChartBreadcrumbs" style="color: #ff3366; font-weight: bold; font-size: 0.9rem;"></span>
          </div>

          <div style="width: 100%; max-width: 400px; position: relative;">
            <canvas id="adminGenreChart"></canvas>
            <div id="adminChartNoData" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #cccccc; font-size: 1rem; pointer-events: none;">Ez dago daturik erabilgarri</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5: Generoko Zabor Etiketak (Auto-Tagging iragazkia) -->
    <div class="collapsible-section" id="sec-garbage-tags" data-tab="etiketak">
      <div class="collapsible-header" onclick="toggleSection('sec-garbage-tags')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Generoko Zabor Etiketak (Auto-Tagging iragazkia) 🗑️</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <p style="font-size: 0.9rem; color: #ccc; margin-top: 0; margin-bottom: 15px;">Etiketa hauek automatikoki kenduko dira abestien generoak Last.fm bidez ebaztean.</p>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; max-width: 500px;">
            <input type="text" id="new-garbage-tag" placeholder="Adib: Rock, Pop, Singer-songwriter" style="flex: 1;">
            <button class="btn btn-approve" onclick="addGarbageTag()">Gehitu ➕</button>
          </div>
          
          <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 51, 102, 0.15); max-width: 500px; box-sizing: border-box;">
            <a href="/api/admin/garbage-tags/export" class="btn btn-edit" style="text-decoration: none;">Esportatu 📥 (JSON)</a>
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <input type="file" id="import-garbage-file" accept=".json" style="display: none;" onchange="importGarbageTags(this)">
              <button class="btn btn-unapprove" onclick="document.getElementById('import-garbage-file').click()">Inportatu 📤 (JSON)</button>
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="garbage-tags-list">
            ${garbageTags.map((gt) => `
              <span style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255, 51, 102, 0.15); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;">
                ${gt.tag}
                <span style="color: #ff3333; cursor: pointer; font-weight: bold; font-size: 1.1rem; line-height: 1;" onclick="deleteGarbageTag('${gt.tag.replace(/'/g, "\\'")}')">×</span>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Section 6: Sisteman dauden Etiketa Aktiboak (Zabor-zerrendan ez daudenak) -->
    <div class="collapsible-section" id="sec-active-tags" data-tab="etiketak">
      <div class="collapsible-header" onclick="toggleSection('sec-active-tags')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Sisteman dauden Etiketa Aktiboak (Zabor-zerrendan ez daudenak) 🏷️</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <p style="font-size: 0.9rem; color: #ccc; margin-top: 0; margin-bottom: 15px;">Hona hemen abestietan agertzen diren etiketa guztiak (gutxien agertzen direnak goian jarrita). Klikatu "🗑️" ikurran etiketa hori zabor-zerrendara bidaltzeko (gogoratu hau egitean abestietatik ere kenduko dela etiketa).</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="active-tags-list">
            ${sortedNonGarbageTags.length === 0 ? '<p>Ez dago etiketa aktiborik une honetan.</p>' : ''}
            ${sortedNonGarbageTags.map(item => `
              <span style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                <strong>${item.tag}</strong>
                <span style="color: #ffaa00; font-size: 0.8rem;">(${item.count})</span>
                <span style="color: #ff3366; cursor: pointer; font-weight: bold; font-size: 1.1rem; line-height: 1; margin-left: 4px;" onclick="addGarbageTagDirect('${item.tag.replace(/'/g, "\\'")}')" title="Bidali zaborrera">🗑️</span>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Section 11: Etiketa Taldekatzeak / Sinonimoak -->
    <div class="collapsible-section" id="sec-tag-mappings" data-tab="etiketak">
      <div class="collapsible-header" onclick="toggleSection('sec-tag-mappings')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Etiketa Taldekatzeak (Sinonimoak) 🏷️</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <p style="font-size: 0.9rem; color: #ccc; margin-top: 0; margin-bottom: 15px;">Erabili tresna hau izen ezberdinak dituzten baina talde berekoak diren etiketak batzeko (adibidez: "heavy metal" -> "metal", "rock and roll" -> "rock"). Horrela, grafikoan eta zerrendetan bateratuta agertuko dira.</p>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; width: 100%; flex-wrap: wrap;">
            <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 320px; max-width: 600px;">
              <input type="text" id="mapping-original-tag" placeholder="Jatorrizko etiketa (adib: rock n roll)" style="flex: 1; min-width: 120px;">
              <span style="color: #ff3366; font-weight: bold; font-size: 1.2rem;">➔</span>
              <input type="text" id="mapping-canonical-tag" placeholder="Etiketa kanonikoa (adib: rock)" style="flex: 1; min-width: 120px;">
              <button class="btn btn-approve" onclick="addTagMapping()">Taldekatu ➕</button>
            </div>
            <div style="display: flex; gap: 8px; margin-left: auto;">
              <button class="btn btn-filter" onclick="exportTagMappings()" title="Esportatu JSON gisa">Esportatu 📤</button>
              <button class="btn btn-filter" onclick="document.getElementById('import-mappings-input').click()" title="Inportatu JSON fitxategia">Inportatu 📥</button>
              <input type="file" id="import-mappings-input" accept=".json" style="display: none;" onchange="importTagMappings(this)">
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="tag-mappings-list">
            ${tagMappings.length === 0 ? '<p>Ez dago etiketa taldekatzerik une honetan.</p>' : ''}
            ${tagMappings.map((tm) => `
              <span style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255, 51, 102, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;">
                <strong>${tm.original_tag}</strong>
                <span style="color: #ff3366;">➔</span>
                <strong>${tm.canonical_tag}</strong>
                <span style="color: #ff3333; cursor: pointer; font-weight: bold; font-size: 1.1rem; line-height: 1; margin-left: 4px;" onclick="deleteTagMapping('${tm.original_tag.replace(/'/g, "\\'")}')" title="Kendu lotura">×</span>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Section 12: Musika Generoen Zuhaitza (Hierarchy) -->
    <div class="collapsible-section" id="sec-genre-hierarchy" data-tab="etiketak">
      <div class="collapsible-header" onclick="toggleSection('sec-genre-hierarchy')">
        <h2><span class="drag-handle" style="margin-right: 10px; color: #ff3366; cursor: grab;">☰</span>Generoen Zuhaitza (Hierarkia) 🌳</h2>
        <span class="collapsible-icon">▼</span>
      </div>
      <div class="collapsible-content">
        <div class="card">
          <p style="font-size: 0.9rem; color: #ccc; margin-top: 0; margin-bottom: 15px;">Erabili tresna hau generoen arteko zuhaitz-egitura bat sortzeko. Adibidez, azpigenero bat (adib: "Ska Punk") genero nagusiago baten azpian taldekatu dezakezu (adib: "Ska"). Horrela, estatistika orokorren gurpilean denak genero nagusiaren pean batuko dira.</p>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; width: 100%; flex-wrap: wrap;">
            <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 320px; max-width: 600px;">
              <input type="text" id="hierarchy-subgenre" placeholder="Azpigeneroa (adib: Ska Punk)" style="flex: 1; min-width: 120px;">
              <span style="color: #ff3366; font-weight: bold; font-size: 0.9rem;">azpian:</span>
              <input type="text" id="hierarchy-parent" placeholder="Genero Nagusia (adib: Ska)" style="flex: 1; min-width: 120px;">
              <button class="btn btn-approve" onclick="addGenreHierarchy()">Lotu ➕</button>
            </div>
            <div style="display: flex; gap: 8px; margin-left: auto;">
              <button class="btn btn-filter" onclick="exportGenreHierarchy()" title="Esportatu JSON gisa">Esportatu 📤</button>
              <button class="btn btn-filter" onclick="document.getElementById('import-hierarchy-input').click()" title="Inportatu JSON fitxategia">Inportatu 📥</button>
              <input type="file" id="import-hierarchy-input" accept=".json" style="display: none;" onchange="importGenreHierarchy(this)">
            </div>
          </div>
          
          <div id="genre-hierarchy-list" class="genre-tree-container">
            ${genreTreeHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}
