// Pikutara Admin Dashboard Client-side script - Common UI, Layout and Charts
const adminSongs = window.adminSongs || [];
const adminHierarchyRaw = window.adminHierarchyRaw || [];
const adminHierarchy = {};
adminHierarchyRaw.forEach(h => {
  adminHierarchy[h.genre.trim().toLowerCase()] = h.parent_genre.trim();
});

let adminChartInstance = null;
let adminChartPath = [];

function getGenrePath(genre) {
  if (!genre) return [];
  const pathList = [genre.trim()];
  let current = genre.trim();
  const maxDepth = 10;
  let depth = 0;
  while (adminHierarchy[current.toLowerCase()] && depth < maxDepth) {
    current = adminHierarchy[current.toLowerCase()].trim();
    pathList.push(current);
    depth++;
  }
  return pathList.reverse();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function getGenreColorRaw(genreName) {
  if (!genreName) return '340, 80%, 50%';
  const lowerName = genreName.toLowerCase().trim();
  if (lowerName === 'bestelakoak (otros)') {
    return '0, 0%, 55%';
  }
  
  const path = getGenrePath(genreName);
  const root = path.length > 0 ? path[0] : genreName;
  
  const rootHash = hashString(root.toLowerCase().trim());
  let hue = Math.abs(rootHash % 360);
  
  const fullHash = hashString(lowerName);
  if (root.toLowerCase().trim() !== lowerName) {
    const shift = (fullHash % 50) - 25;
    hue = (hue + shift + 360) % 360;
  }
  
  const saturation = 80 - (Math.abs(fullHash) % 15);
  const lightness = 48 + (Math.abs(fullHash) % 10);
  
  return hue + ', ' + saturation + '%, ' + lightness + '%';
}

function getRootGenresBreakdown(filteredSongs) {
  const counts = {};
  filteredSongs.forEach((song) => {
    if (song.genres && Array.isArray(song.genres)) {
      song.genres.forEach((g) => {
        const gPath = getGenrePath(g);
        const rootGen = gPath.length > 0 ? gPath[0] : null;
        if (rootGen) {
          counts[rootGen] = (counts[rootGen] || 0) + 1;
        }
      });
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const main = new Set();
  const others = new Set();
  sorted.forEach(([genre, count], idx) => {
    if (idx < 8) {
      main.add(genre.toLowerCase());
    } else {
      others.add(genre.toLowerCase());
    }
  });
  return { main, others };
}

function updateAdminChart() {
  const checkbox = document.getElementById('include-pending-stats');
  if (!checkbox) return;
  const includePending = checkbox.checked;
  const filteredSongs = adminSongs.filter(s => {
    if (s.status === 'accepted') return true;
    if (includePending && s.status === 'pending') return true;
    return false;
  });
  
  const rootBreakdown = getRootGenresBreakdown(filteredSongs);
  const genreCounts = {};
  
  filteredSongs.forEach((song) => {
    if (song.genres && Array.isArray(song.genres)) {
      song.genres.forEach((g) => {
        const gPath = getGenrePath(g);
        if (gPath.length === 0) return;
        
        let matches = false;
        let category = "";
        
        if (adminChartPath.length === 0) {
          matches = true;
          const rootGen = gPath[0];
          if (rootBreakdown.main.has(rootGen.toLowerCase())) {
            category = rootGen;
          } else {
            category = "Bestelakoak (Otros)";
          }
        } else if (adminChartPath[0] === "Bestelakoak (Otros)") {
          if (adminChartPath.length === 1) {
            if (rootBreakdown.others.has(gPath[0].toLowerCase())) {
              matches = true;
              category = gPath[0];
            }
          } else {
            const subPath = adminChartPath.slice(1);
            let subMatches = true;
            for (let i = 0; i < subPath.length; i++) {
              if (i >= gPath.length || gPath[i].toLowerCase() !== subPath[i].toLowerCase()) {
                subMatches = false;
                break;
              }
            }
            if (subMatches) {
              matches = true;
              const nextIndex = subPath.length;
              category = nextIndex < gPath.length ? gPath[nextIndex] : gPath[gPath.length - 1];
            }
          }
        } else {
          let pathMatches = true;
          for (let i = 0; i < adminChartPath.length; i++) {
            if (i >= gPath.length || gPath[i].toLowerCase() !== adminChartPath[i].toLowerCase()) {
              pathMatches = false;
              break;
            }
          }
          if (pathMatches) {
            matches = true;
            const nextIndex = adminChartPath.length;
            category = nextIndex < gPath.length ? gPath[nextIndex] : gPath[gPath.length - 1];
          }
        }
        
        if (matches && category) {
          let finalCategory = category;
          if (adminChartPath.length > 0) {
            const currentParent = adminChartPath[adminChartPath.length - 1];
            if (finalCategory.toLowerCase() === currentParent.toLowerCase()) {
              finalCategory = finalCategory + " (orokorra)";
            }
          }
          genreCounts[finalCategory] = (genreCounts[finalCategory] || 0) + 1;
        }
      });
    }
  });

  renderAdminChart(genreCounts);
}

function renderAdminChart(genreCounts) {
  const ctx = document.getElementById('adminGenreChart');
  if (!ctx) return;
  const breadcrumbContainer = document.getElementById("adminChartBreadcrumbContainer");
  const breadcrumbsSpan = document.getElementById("adminChartBreadcrumbs");
  
  if (breadcrumbContainer && breadcrumbsSpan) {
    if (adminChartPath.length > 0) {
      breadcrumbContainer.style.display = "flex";
      breadcrumbsSpan.innerText = "Nagusia > " + adminChartPath.join(" > ");
    } else {
      breadcrumbContainer.style.display = "none";
    }
  }

  if (adminChartInstance) {
    adminChartInstance.destroy();
    adminChartInstance = null;
  }

  let totalOccurrences = 0;
  for (const count of Object.values(genreCounts)) {
    totalOccurrences += count;
  }

  const chartNoData = document.getElementById('adminChartNoData');
  if (totalOccurrences === 0) {
    if (chartNoData) chartNoData.style.display = 'block';
    ctx.style.display = 'none';
    return;
  } else {
    if (chartNoData) chartNoData.style.display = 'none';
    ctx.style.display = 'block';
  }

  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedGenres.map(([g]) => g);
  const data = sortedGenres.map(([_, c]) => c);
  const colors = labels.map((label) => 'hsl(' + getGenreColorRaw(label) + ')');

  adminChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#0c020c',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#ffffff' }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const dataset = context.dataset;
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return label + ': ' + percentage + '% (' + value + ')';
            },
            afterLabel: (context) => {
              const clickedLabel = context.label;
              const lowerLabel = clickedLabel.toLowerCase();
              const isOtros = clickedLabel === "Bestelakoak (Otros)";
              const hasChildren = Object.values(adminHierarchy).some(parent => parent.toLowerCase() === lowerLabel);
              return (isOtros || hasChildren) ? ' (Klik egin xehetasunak ikusteko 🔍)' : '';
            }
          }
        }
      },
      onHover: (event, chartElements) => {
        if (event.native && event.native.target) {
          const target = event.native.target;
          if (chartElements.length > 0) {
            const index = chartElements[0].index;
            const clickedLabel = adminChartInstance.data.labels[index];
            const isOtros = clickedLabel === "Bestelakoak (Otros)";
            const lowerLabel = clickedLabel.toLowerCase();
            const hasChildren = Object.values(adminHierarchy).some(parent => parent.toLowerCase() === lowerLabel);
            if (isOtros || hasChildren) {
              target.style.cursor = 'pointer';
              return;
            }
          }
          target.style.cursor = 'default';
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const firstElement = elements[0];
          const index = firstElement.index;
          const clickedLabel = adminChartInstance.data.labels[index];
          const isOtros = clickedLabel === "Bestelakoak (Otros)";
          const lowerLabel = clickedLabel.toLowerCase();
          const hasChildren = Object.values(adminHierarchy).some(parent => parent.toLowerCase() === lowerLabel);
          
          if (isOtros || hasChildren) {
            adminChartPath.push(clickedLabel);
            updateAdminChart();
          }
        }
      }
    }
  });
}

let dragActive = false;
let dragSourceEl = null;

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === tabId);
  });
  document.querySelectorAll('.collapsible-section').forEach(sec => {
    if (sec.getAttribute('data-tab') === tabId) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
  localStorage.setItem('pikutara-admin-active-tab', tabId);
}

function toggleTreeNode(event, element) {
  event.stopPropagation();
  const parentLi = element.closest('li');
  const childUl = parentLi.querySelector('ul');
  if (childUl) {
    const isHidden = childUl.style.display === 'none';
    childUl.style.display = isHidden ? 'block' : 'none';
    element.innerText = isHidden ? '▼' : '▶';
  }
}

function toggleSection(id) {
  if (dragActive) {
    dragActive = false;
    return;
  }
  const section = document.getElementById(id);
  if (!section) return;
  const isCollapsed = section.classList.toggle('collapsed');
  localStorage.setItem('pikutara-admin-collapsed-' + id, isCollapsed.toString());
}

function toggleAllSections(expand) {
  document.querySelectorAll('.collapsible-section').forEach(section => {
    const id = section.id;
    if (expand) {
      section.classList.remove('collapsed');
      localStorage.setItem('pikutara-admin-collapsed-' + id, 'false');
    } else {
      section.classList.add('collapsed');
      localStorage.setItem('pikutara-admin-collapsed-' + id, 'true');
    }
  });
}

function saveSectionsOrder() {
  const container = document.getElementById('collapsible-sections-container');
  if (!container) return;
  const order = Array.from(container.children).map(child => child.id);
  localStorage.setItem('pikutara-admin-sections-order', JSON.stringify(order));
}

function loadSectionsOrder() {
  const orderStr = localStorage.getItem('pikutara-admin-sections-order');
  if (orderStr) {
    try {
      const order = JSON.parse(orderStr);
      const container = document.getElementById('collapsible-sections-container');
      if (container) {
        const kids = Array.from(container.children);
        order.forEach((id) => {
          const el = document.getElementById(id);
          if (el && el.parentElement === container) {
            container.appendChild(el);
          }
        });
        kids.forEach(kid => {
          if (kid && kid.id && !order.includes(kid.id)) {
            container.appendChild(kid);
          }
        });
      }
    } catch (e) {
      console.error('Error loading sections order', e);
    }
  }
}

// Initial state restoration and drag-and-drop binding
document.addEventListener('DOMContentLoaded', () => {
  // Restore collapsed states
  document.querySelectorAll('.collapsible-section').forEach(section => {
    const id = section.id;
    const val = localStorage.getItem('pikutara-admin-collapsed-' + id);
    if (val === 'true') {
      section.classList.add('collapsed');
    } else if (val === 'false') {
      section.classList.remove('collapsed');
    } else {
      // Default: collapse all except songs-manage
      if (id !== 'sec-songs-manage') {
        section.classList.add('collapsed');
      }
    }
  });

  // Load saved sections order
  loadSectionsOrder();

  // Restore active tab
  const activeTab = localStorage.getItem('pikutara-admin-active-tab') || 'musika';
  switchTab(activeTab);

  // Bind drag-and-drop to headers
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.setAttribute('draggable', 'true');
    
    header.addEventListener('dragstart', function(e) {
      const section = this.closest('.collapsible-section');
      dragSourceEl = section;
      dragActive = true;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', section.id);
      section.classList.add('dragging');
    });
    
    header.addEventListener('dragover', function(e) {
      if (e.preventDefault) e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      return false;
    });
    
    header.addEventListener('dragenter', function(e) {
      const section = this.closest('.collapsible-section');
      if (section !== dragSourceEl) {
        section.classList.add('drag-over');
      }
    });
    
    header.addEventListener('dragleave', function(e) {
      const section = this.closest('.collapsible-section');
      section.classList.remove('drag-over');
    });
    
    header.addEventListener('drop', function(e) {
      if (e.stopPropagation) e.stopPropagation();
      
      const section = this.closest('.collapsible-section');
      if (dragSourceEl && dragSourceEl !== section) {
        const container = document.getElementById('collapsible-sections-container');
        if (container) {
          const children = Array.from(container.children);
          const fromIndex = children.indexOf(dragSourceEl);
          const toIndex = children.indexOf(section);
          
          if (fromIndex < toIndex) {
            container.insertBefore(dragSourceEl, section.nextSibling);
          } else {
            container.insertBefore(dragSourceEl, section);
          }
          saveSectionsOrder();
        }
      }
      return false;
    });
    
    header.addEventListener('dragend', function(e) {
      document.querySelectorAll('.collapsible-section').forEach(el => {
        el.classList.remove('dragging');
        el.classList.remove('drag-over');
      });
      setTimeout(() => { dragActive = false; }, 50);
    });
  });

  const backBtn = document.getElementById("adminChartBackButton");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (adminChartPath.length > 0) {
        adminChartPath.pop();
        updateAdminChart();
      }
    });
  }
  updateAdminChart();
});

async function apiCall(url, method, elemId) {
  if (method === 'DELETE' && !confirm('Ziur ezabatu nahi duzula?')) return;
  try {
    const res = await fetch(url, { method });
    if (res.ok) {
      if (method === 'DELETE') {
        document.getElementById(elemId).remove();
      } else {
        window.location.reload();
      }
    }
    else alert('Errorea gertatu da');
  } catch (e) { alert('Sareko errorea'); }
}
