// View: Geospatial Disease & Stress Hotspot Map (Baramati Taluka, Pune District)

const MapView = {
  selectedHotspot: null,
  selectedPlot: null,
  filterCategory: 'ALL',

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="map-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="h-96 w-full skeleton rounded-xl"></div>
        </div>
        <div id="map-content" class="hidden space-y-6"></div>
      </div>
    `;

    try {
      const hotspotsData = await API.getHotspots();
      const hotspots = hotspotsData.hotspots || [];
      const plots = hotspotsData.all_plots || [];
      const isDemo = true;

      const content = document.getElementById('map-content');
      const loading = document.getElementById('map-loading');

      // Geospatial Bounding Box (Baramati Taluka, Pune: 18.130°N to 18.180°N, 74.560°E to 74.610°E)
      const minLat = 18.130, maxLat = 18.180;
      const minLng = 74.560, maxLng = 74.610;

      const projectCoord = (lat, lng) => {
        const x = ((lng - minLng) / (maxLng - minLng)) * 76 + 12;
        const y = ((maxLat - lat) / (maxLat - minLat)) * 74 + 13;
        return {
          left: Math.max(5, Math.min(95, x)),
          top: Math.max(5, Math.min(95, y))
        };
      };

      // Filtered plots based on selected filter
      const visiblePlots = this.filterCategory === 'ALL'
        ? plots
        : plots.filter(p => p.category.toLowerCase().includes(this.filterCategory.toLowerCase()));

      content.innerHTML = `
        <!-- Top Title & Controls -->
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="font-display-md text-display-md text-on-surface font-fraunces">Regional Agronomic Hotspot Map</h2>
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffdcb9] text-[#783900]">
                ${isDemo ? 'DEMO DATA (Baramati Coordinates)' : 'LIVE SATELLITE / GRID'}
              </span>
            </div>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Spatial clustering of crop pathology, pest incidence, and irrigation stress across Baramati Taluka, Pune District (18.15° N, 74.58° E).
            </p>
          </div>

          <!-- Category Filters -->
          <div class="flex flex-wrap gap-2">
            <button onclick="MapView.setCategoryFilter('ALL')" class="px-3 py-1.5 rounded-lg text-xs font-label-caps font-bold transition-colors ${this.filterCategory === 'ALL' ? 'bg-primary text-surface' : 'bg-surface-container text-outline hover:bg-surface-container-high'}">
              All Plots (${plots.length})
            </button>
            <button onclick="MapView.setCategoryFilter('Disease')" class="px-3 py-1.5 rounded-lg text-xs font-label-caps font-bold transition-colors flex items-center gap-1.5 ${this.filterCategory === 'Disease' ? 'bg-error text-surface' : 'bg-surface-container text-error hover:bg-surface-container-high'}">
              <span class="w-2 h-2 rounded-full bg-error"></span> Disease
            </button>
            <button onclick="MapView.setCategoryFilter('Pest')" class="px-3 py-1.5 rounded-lg text-xs font-label-caps font-bold transition-colors flex items-center gap-1.5 ${this.filterCategory === 'Pest' ? 'bg-secondary text-surface' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}">
              <span class="w-2 h-2 rounded-full bg-secondary"></span> Pest
            </button>
            <button onclick="MapView.setCategoryFilter('Water Stress')" class="px-3 py-1.5 rounded-lg text-xs font-label-caps font-bold transition-colors flex items-center gap-1.5 ${this.filterCategory === 'Water Stress' ? 'bg-blue-600 text-surface' : 'bg-surface-container text-blue-600 hover:bg-surface-container-high'}">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span> Water Stress
            </button>
          </div>
        </header>

        <!-- Main Map Area + Hotspot Detail Sidebar -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Interactive Map Container -->
          <div class="lg:col-span-2 card-level-1 relative overflow-hidden h-[540px] border border-outline-variant bg-[#1a2218] rounded-xl flex flex-col justify-between p-4 shadow-inner">
            
            <!-- Map Grid & Background Map Simulation -->
            <div class="absolute inset-0 opacity-25 pointer-events-none" style="background-image: linear-gradient(#4b6043 1px, transparent 1px), linear-gradient(to right, #4b6043 1px, #1a2218 1px); background-size: 40px 40px;"></div>
            
            <!-- Geographic Landmarks & Village Labels -->
            <div class="absolute top-6 left-8 text-[11px] font-mono font-bold text-[#8fa886] tracking-wider pointer-events-none">
              📍 MALEGAON KHURD (18.16° N, 74.57° E)
            </div>
            <div class="absolute top-8 right-12 text-[11px] font-mono font-bold text-[#8fa886] tracking-wider pointer-events-none">
              📍 RUI VILLAGE (18.17° N, 74.58° E)
            </div>
            <div class="absolute bottom-10 left-12 text-[11px] font-mono font-bold text-[#8fa886] tracking-wider pointer-events-none">
              📍 JALOCHI (18.14° N, 74.58° E)
            </div>
            <div class="absolute bottom-12 right-12 text-[11px] font-mono font-bold text-[#8fa886] tracking-wider pointer-events-none">
              📍 KATTEBHEL (18.15° N, 74.60° E)
            </div>

            <!-- Dynamic Hotspot Cluster Rings (Computed Centroids) -->
            ${hotspots.map(hs => {
              const pos = projectCoord(hs.center_lat, hs.center_lng);
              const isDisease = hs.category === 'Disease';
              const ringColor = isDisease ? 'rgba(186, 26, 26, 0.35)' : (hs.category === 'Pest' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(37, 99, 235, 0.35)');
              const borderColor = isDisease ? '#ba1a1a' : (hs.category === 'Pest' ? '#d97706' : '#2563eb');
              return `
                <div onclick="MapView.selectHotspot('${hs.id}')"
                  class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-transform hover:scale-105 z-10 flex items-center justify-center group"
                  style="left: ${pos.left}%; top: ${pos.top}%; width: 140px; height: 140px; background-color: ${ringColor}; border: 2px dashed ${borderColor};">
                  <div class="bg-surface/90 text-on-surface px-2 py-1 rounded text-[11px] font-mono font-bold shadow-md border border-outline-variant pointer-events-none group-hover:scale-110 transition-transform text-center">
                    ${hs.name}
                    <div class="text-[9px] text-error">${hs.farmer_count} Farmers • ${hs.avg_confidence}% Conf</div>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Individual Farmer / Farm Plot Markers -->
            ${visiblePlots.map(p => {
              const pos = projectCoord(p.lat, p.lng);
              let colorClass = 'bg-primary border-surface text-surface';
              let pulseClass = '';
              if (p.markerColor === 'red') {
                colorClass = 'bg-error border-surface text-surface';
                pulseClass = 'animate-ping';
              } else if (p.markerColor === 'orange') {
                colorClass = 'bg-secondary border-surface text-surface';
              } else if (p.markerColor === 'blue') {
                colorClass = 'bg-blue-600 border-surface text-surface';
              }

              return `
                <div onclick="MapView.selectPlot('${p.zone_id}')"
                  class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  style="left: ${pos.left}%; top: ${pos.top}%;">
                  
                  <div class="relative flex items-center justify-center">
                    ${p.markerColor === 'red' ? `
                      <span class="absolute w-6 h-6 rounded-full bg-error opacity-75 ${pulseClass}"></span>
                    ` : ''}
                    <div class="w-7 h-7 rounded-full ${colorClass} border-2 flex items-center justify-center font-bold text-[11px] shadow-lg group-hover:scale-125 transition-transform">
                      ${p.category === 'Disease' ? '🦠' : (p.category === 'Pest' ? '🐛' : (p.category === 'Water Stress' ? '💧' : '🌱'))}
                    </div>
                  </div>

                  <!-- Hover Tooltip -->
                  <div class="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-xs px-2.5 py-1 rounded shadow-lg border border-outline-variant font-mono whitespace-nowrap pointer-events-none transition-opacity z-30">
                    <strong>${p.farmer_name}</strong> (${p.crop})<br/>
                    <span class="text-error">${p.problem}</span>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Map Legend (Bottom Overlay) -->
            <div class="mt-auto bg-surface/90 backdrop-blur-sm p-3 rounded-lg border border-outline-variant flex flex-wrap items-center justify-between gap-3 z-30 font-body-sm text-xs">
              <div class="flex items-center gap-4 font-mono">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-error"></span> Disease (Red)</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-secondary"></span> Pest (Orange)</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Water Stress (Blue)</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-primary"></span> Healthy (Green)</span>
              </div>
              <span class="text-[10px] font-mono text-outline">[CALCULATED VIA HAVERSINE SPATIAL RADIUS: 2.5 KM]</span>
            </div>
          </div>

          <!-- Hotspot / Plot Detail Drawer -->
          <div id="hotspot-detail-panel" class="card-level-1 p-6 space-y-6 flex flex-col justify-between h-[540px] overflow-y-auto">
            ${this.renderDetailPanel(hotspots, plots)}
          </div>
        </div>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering map view:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load geospatial map: ${err.message}`, "MapView.render(document.getElementById('main-content'))");
    }
  },

  renderDetailPanel(hotspots, plots) {
    if (this.selectedPlot) {
      const p = plots.find(item => item.zone_id === this.selectedPlot);
      if (p) {
        const isProblem = p.category !== 'Healthy';
        return `
          <div class="space-y-4">
            <div class="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isProblem ? 'bg-error text-surface' : 'bg-primary-container text-on-primary-container'} uppercase">
                  ${p.category}
                </span>
                <h3 class="font-headline-sm text-lg font-fraunces text-on-surface mt-1">${p.zone_name}</h3>
                <p class="font-body-sm text-xs text-on-surface-variant">${p.farm_name} (${p.survey_number})</p>
              </div>
              <button onclick="MapView.clearSelection()" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <!-- Plot Diagnostic Information -->
            <div class="space-y-2.5 text-xs font-body-sm">
              <div class="p-3 bg-surface rounded-lg border border-outline-variant space-y-1">
                <div class="font-label-caps text-[10px] text-outline uppercase font-bold">Diagnosed Problem</div>
                <div class="font-bold text-sm ${isProblem ? 'text-error' : 'text-primary'}">${p.problem}</div>
                <div class="font-mono text-outline">Confidence: ${p.confidence}% • Severity: ${p.severity}</div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="p-2.5 bg-surface rounded border border-outline-variant">
                  <span class="text-outline block text-[10px] uppercase font-bold">Farmer</span>
                  <span class="font-semibold text-on-surface">${p.farmer_name}</span>
                </div>
                <div class="p-2.5 bg-surface rounded border border-outline-variant">
                  <span class="text-outline block text-[10px] uppercase font-bold">Crop / Stage</span>
                  <span class="font-semibold text-on-surface">${p.crop} (${p.growth_stage})</span>
                </div>
              </div>

              <div class="p-2.5 bg-surface rounded border border-outline-variant">
                <span class="text-outline block text-[10px] uppercase font-bold">Location & Coordinates</span>
                <span class="font-mono text-on-surface">${p.lat}° N, ${p.lng}° E (${p.farmer_location})</span>
              </div>
            </div>
          </div>

          <div class="space-y-2 pt-4 border-t border-outline-variant">
            <button onclick="MapView.dispatchOfficerForPlot('${p.zone_id}')" class="w-full py-2.5 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-base">assignment_ind</span> Dispatch Field Officer
            </button>
            <button onclick="App.navigate('dashboard')" class="w-full py-2 border border-outline-variant text-outline bg-surface rounded-lg font-label-caps text-xs hover:bg-surface-container-high">
              View Sensor Dashboard
            </button>
          </div>
        `;
      }
    }

    if (hotspots.length > 0) {
      const hs = this.selectedHotspot
        ? (hotspots.find(h => h.id === this.selectedHotspot) || hotspots[0])
        : hotspots[0];

      return `
        <div class="space-y-4">
          <div class="border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-error text-surface uppercase">
                ${hs.category} HOTSPOT
              </span>
              <span class="text-xs text-outline font-mono">${hs.radius_km} km Radius</span>
            </div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">${hs.name}</h3>
            <p class="font-body-sm text-xs text-error font-semibold">${hs.problem}</p>
          </div>

          <!-- Hotspot Analytics Card -->
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2.5 bg-surface rounded-lg border border-outline-variant">
              <span class="font-data-lg text-lg font-bold font-mono text-on-surface">${hs.farmer_count}</span>
              <span class="block text-[10px] text-outline uppercase font-bold">Farmers</span>
            </div>
            <div class="p-2.5 bg-surface rounded-lg border border-outline-variant">
              <span class="font-data-lg text-lg font-bold font-mono text-on-surface">${hs.zone_count}</span>
              <span class="block text-[10px] text-outline uppercase font-bold">Plots</span>
            </div>
            <div class="p-2.5 bg-surface rounded-lg border border-outline-variant">
              <span class="font-data-lg text-lg font-bold font-mono text-primary">${hs.avg_confidence}%</span>
              <span class="block text-[10px] text-outline uppercase font-bold">Avg Conf</span>
            </div>
          </div>

          <!-- Affected Farmers List -->
          <div>
            <div class="font-label-caps text-xs text-outline uppercase font-bold mb-2">Affected Farmer Records</div>
            <div class="space-y-2 max-h-36 overflow-y-auto">
              ${hs.affected_farmers.map(f => `
                <div class="p-2 bg-surface rounded border border-outline-variant text-xs flex justify-between items-center">
                  <div>
                    <span class="font-bold text-on-surface">${f.farmer_name}</span>
                    <span class="text-outline text-[11px] block">${f.zone_name} • ${f.crop}</span>
                  </div>
                  <span class="font-mono text-[10px] text-error font-bold">${f.severity}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-4 border-t border-outline-variant">
          <button onclick="MapView.dispatchOfficerForHotspot('${hs.id}')" class="w-full py-2.5 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-base">assignment_ind</span> Dispatch Field Officer to Cluster
          </button>
        </div>
      `;
    }

    return `
      <div class="flex flex-col items-center justify-center h-full text-center p-6 text-outline space-y-3">
        <span class="material-symbols-outlined text-4xl text-primary">check_circle</span>
        <h4 class="font-headline-sm font-fraunces text-on-surface">No Active Hotspots Detected</h4>
        <p class="font-body-sm text-xs">All monitored farm canopies in Baramati Taluka are currently in healthy equilibrium.</p>
      </div>
    `;
  },

  selectHotspot(id) {
    this.selectedHotspot = id;
    this.selectedPlot = null;
    this.render(document.getElementById('main-content'));
  },

  selectPlot(zoneId) {
    this.selectedPlot = zoneId;
    this.render(document.getElementById('main-content'));
  },

  clearSelection() {
    this.selectedPlot = null;
    this.selectedHotspot = null;
    this.render(document.getElementById('main-content'));
  },

  setCategoryFilter(cat) {
    this.filterCategory = cat;
    this.render(document.getElementById('main-content'));
  },

  async dispatchOfficerForHotspot(hotspotId) {
    try {
      await API.createRecord('alerts', {
        org_id: 'org-pune-baramati',
        farmer_id: 'farmer-2',
        farm_id: 'farm-2',
        zone_id: 'zone-north-1',
        problem: 'Rui Village Wheat Leaf Rust Hotspot',
        problem_type: 'DISEASE',
        severity: 'CRITICAL',
        status: 'INSPECTION_ASSIGNED',
        assigned_officer_id: 'exp-2',
        assigned_officer_name: 'Sanjay Kulkarni',
        timestamp: new Date().toISOString()
      });
      Components.showToast('Field Officer Sanjay Kulkarni dispatched to Hotspot cluster.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error dispatching officer: ${err.message}`, 'error');
    }
  },

  async dispatchOfficerForPlot(zoneId) {
    try {
      await API.createRecord('alerts', {
        org_id: 'org-pune-baramati',
        zone_id: zoneId,
        problem: 'Field Inspection Required',
        problem_type: 'DISEASE',
        severity: 'HIGH',
        status: 'INSPECTION_ASSIGNED',
        assigned_officer_id: 'exp-1',
        assigned_officer_name: 'Dr. Anita Deshmukh',
        timestamp: new Date().toISOString()
      });
      Components.showToast('Agronomist Dr. Anita Deshmukh assigned for on-site diagnostic.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error dispatching agronomist: ${err.message}`, 'error');
    }
  }
};

window.MapView = MapView;
window.FieldMapView = MapView;
