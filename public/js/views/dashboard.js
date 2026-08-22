// View: Farmer Dashboard (My Farm Overview - Baramati, Pune District)

const DashboardView = {
  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="dash-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="dash-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [weatherRes, filteredSensorsRes, zonesRes, riskRes, farmerRes, hwStatusRes] = await Promise.all([
        API.getWeather(),
        API.getFilteredReadings(),
        API.getTable('zones'),
        API.getRiskScores(),
        API.getById('farmers', 'farmer-1'),
        API.getHardwareStatus()
      ]);

      const weather = weatherRes.weather || { status: 'UNAVAILABLE', temp: null, humidity: null, condition: 'Unavailable' };
      const sensors = filteredSensorsRes.data || [];
      const zones = zonesRes.data || [];
      const riskScores = riskRes.risk_scores || {};
      const farmer = farmerRes.data || { name: 'Ramesh Patel', location: 'Malegaon Khurd, Baramati, Pune', acres: 12.5, crop: 'Wheat (HD 2967)' };
      const hwStatus = (hwStatusRes && hwStatusRes.status) || { mode: 'DEMO', isPhysicalLive: false };

      // Primary sensor readings (Zone A)
      const zoneAReadings = sensors.filter(s => s.zone_id === 'zone-a');
      const latestA = zoneAReadings[0] || (hwStatus.mode === 'LIVE_HARDWARE' ? null : { moisture: 31.8, temp: 27.2, humidity: 66 });

      // Identify critical decision
      let criticalZone = null;
      let criticalRisk = null;
      for (const z of zones) {
        const r = riskScores[z.id];
        if (r && (r.computed_action === 'IRRIGATE' || r.computed_action === 'PROTECT' || r.computed_action === 'INSPECT')) {
          if (r.computed_action === 'IRRIGATE' || !criticalZone) {
            criticalZone = z;
            criticalRisk = r;
          }
        }
      }

      const content = document.getElementById('dash-content');
      const loading = document.getElementById('dash-loading');

      content.innerHTML = `
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="font-display-md text-display-md text-on-surface font-fraunces">My Farm — ${farmer.name}</h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${hwStatus.mode === 'LIVE_HARDWARE' ? (hwStatus.isPhysicalLive ? 'bg-primary text-surface' : 'bg-error text-surface') : 'bg-secondary-container text-on-secondary-container'}">
                ${hwStatus.mode === 'LIVE_HARDWARE' ? (hwStatus.isPhysicalLive ? 'LIVE HARDWARE' : 'AWAITING HARDWARE') : 'DEMO MODE'}
              </span>
            </div>
            <p class="font-body-md text-body-md text-on-surface-variant">${farmer.location} • ${farmer.acres} Acres • Crop: ${farmer.crop}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="App.navigate('advisory')" class="bg-transparent border border-primary text-primary px-4 py-2 rounded font-label-caps text-label-caps hover:bg-surface-container-low transition-colors">
              View Advisory Feed
            </button>
            <button onclick="App.navigate('settings')" class="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded font-label-caps text-label-caps hover:bg-surface-container-high transition-colors flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">settings_input_component</span> Hardware Mode
            </button>
          </div>
        </div>

        ${hwStatus.mode === 'LIVE_HARDWARE' && !hwStatus.isPhysicalLive ? `
          <!-- Live Mode Awaiting Hardware Banner -->
          <div class="bg-surface-container-high border-2 border-secondary text-on-surface rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-secondary text-3xl">sensors_off</span>
              <div>
                <h4 class="font-body-md font-bold text-on-surface">Live Hardware Mode Active — Awaiting Physical ESP32 Stream</h4>
                <p class="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  The system is listening on <code class="bg-surface px-1.5 py-0.5 rounded font-mono text-primary font-bold">POST /api/sensor-readings</code>. Connect your ESP32 device or click below to simulate an incoming hardware pulse.
                </p>
              </div>
            </div>
            <div class="flex gap-2 shrink-0">
              <button onclick="SettingsView.simulateHardwarePulse()" class="px-4 py-2 bg-primary text-surface rounded font-label-caps text-xs font-bold hover:opacity-90 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">bolt</span> Send ESP32 Pulse
              </button>
              <button onclick="App.toggleMode('DEMO')" class="px-4 py-2 border border-outline-variant text-on-surface-variant bg-surface rounded font-label-caps text-xs hover:bg-surface-container-highest">
                Switch to Demo Mode
              </button>
            </div>
          </div>
        ` : ''}

        ${criticalZone && criticalRisk ? `
          <!-- Active AI Decision Alert Banner -->
          <div class="card-level-1 ${criticalRisk.computed_action === 'IRRIGATE' ? 'card-spine-danger bg-error-container/20 border-error/40' : 'card-spine-warning bg-secondary-container/20 border-secondary/40'} p-6 relative overflow-hidden">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined ${criticalRisk.computed_action === 'IRRIGATE' ? 'text-error' : 'text-secondary'}" style="font-variation-settings: 'FILL' 1;">warning</span>
                  <span class="font-label-caps text-label-caps ${criticalRisk.computed_action === 'IRRIGATE' ? 'text-error' : 'text-secondary'} font-bold tracking-wider uppercase">ACTION REQUIRED: ${criticalRisk.computed_action}</span>
                  <span class="font-data-md text-data-md text-outline font-mono text-xs">[CALCULATED: RULE TREE]</span>
                </div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">${criticalZone.name}: ${criticalRisk.reasons[0] || 'Attention required'}</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">${criticalRisk.reasons.slice(1).join(' ')}</p>
              </div>
              <div class="flex gap-3 shrink-0">
                <button onclick="DashboardView.showWhyModal('${criticalZone.id}')" class="px-4 py-2 border border-outline-variant bg-surface rounded font-label-caps text-label-caps text-on-surface hover:bg-surface-container-high transition-colors">
                  Why this action?
                </button>
                ${criticalRisk.computed_action === 'IRRIGATE' ? `
                  <button onclick="DashboardView.approveIrrigation('${criticalZone.id}')" class="px-6 py-2 bg-primary text-surface rounded font-label-caps text-label-caps hover:opacity-90 transition-opacity flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">water_drop</span> Approve Irrigation
                  </button>
                ` : `
                  <button onclick="App.navigate('crop-health')" class="px-6 py-2 bg-primary text-surface rounded font-label-caps text-label-caps hover:opacity-90 transition-opacity">
                    Inspect Zone
                  </button>
                `}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Current Conditions Furrow -->
        <section>
          <div class="furrow-divider flex justify-between items-end">
            <div class="flex items-center gap-2">
              <h3 class="font-label-caps text-label-caps text-outline uppercase tracking-widest">Current Telemetry (Zone A)</h3>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded ${hwStatus.mode === 'LIVE_HARDWARE' ? (hwStatus.isPhysicalLive ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-variant text-outline') : 'bg-secondary-container/60 text-on-secondary-container'}">
                ${hwStatus.mode === 'LIVE_HARDWARE' ? (hwStatus.isPhysicalLive ? 'REAL SENSOR' : 'OFFLINE') : 'SIMULATED / DEMO'}
              </span>
            </div>
            <span class="font-data-md text-data-md ${hwStatus.isPhysicalLive ? 'text-primary' : 'text-outline'} flex items-center gap-1.5 font-mono text-xs">
              <span class="w-2 h-2 rounded-full ${hwStatus.isPhysicalLive ? 'bg-primary animate-pulse' : 'bg-secondary'}"></span>
              ${hwStatus.label}
            </span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter-grid">
            <!-- Soil Moisture -->
            <div class="card-level-1 card-spine-primary p-4 rounded-r-lg relative flex flex-col justify-between h-32">
              <span class="font-mono text-[10px] text-outline absolute top-3 right-3">${latestA ? (latestA.source === 'PHYSICAL_ESP32' ? 'REAL' : 'DEMO') : 'NO DATA'}</span>
              <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">water_drop</span>
                <span class="font-label-caps text-label-caps">Soil Moisture</span>
              </div>
              <div class="mt-auto">
                <span class="font-data-lg text-data-lg text-on-surface text-2xl font-bold font-mono">${latestA ? latestA.moisture : '--'}</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant ml-1">%</span>
              </div>
            </div>

            <!-- Temperature -->
            <div class="card-level-1 card-spine-primary p-4 rounded-r-lg relative flex flex-col justify-between h-32">
              <span class="font-mono text-[10px] text-outline absolute top-3 right-3">${latestA ? (latestA.source === 'PHYSICAL_ESP32' ? 'REAL' : 'DEMO') : 'NO DATA'}</span>
              <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-secondary">thermostat</span>
                <span class="font-label-caps text-label-caps">Canopy Temp</span>
              </div>
              <div class="mt-auto">
                <span class="font-data-lg text-data-lg text-on-surface text-2xl font-bold font-mono">${latestA ? latestA.temp : '--'}</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant ml-1">°C</span>
              </div>
            </div>

            <!-- Humidity -->
            <div class="card-level-1 card-spine-primary p-4 rounded-r-lg relative flex flex-col justify-between h-32">
              <span class="font-mono text-[10px] text-outline absolute top-3 right-3">${latestA ? (latestA.source === 'PHYSICAL_ESP32' ? 'REAL' : 'DEMO') : 'NO DATA'}</span>
              <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-tertiary">humidity_percentage</span>
                <span class="font-label-caps text-label-caps">Rel. Humidity</span>
              </div>
              <div class="mt-auto">
                <span class="font-data-lg text-data-lg text-on-surface text-2xl font-bold font-mono">${latestA ? latestA.humidity : '--'}</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant ml-1">%</span>
              </div>
            </div>

            <!-- Weather (Honest Live or Unavailable) -->
            <div class="card-level-1 card-spine-primary p-4 rounded-r-lg relative flex flex-col justify-between h-32">
              <span class="font-mono text-[10px] text-outline absolute top-3 right-3">${weather.is_live ? 'LIVE API' : 'UNCONFIGURED'}</span>
              <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-secondary">${weather.is_live ? 'sunny' : 'cloud_off'}</span>
                <span class="font-label-caps text-label-caps">Pune Weather</span>
              </div>
              <div class="mt-auto">
                ${weather.is_live ? `
                  <span class="font-body-lg text-body-lg text-on-surface font-semibold">${weather.condition} (${weather.temp}°C)</span>
                ` : `
                  <span class="text-xs text-outline font-body-sm block leading-tight">Live sync unavailable (Set API key)</span>
                `}
              </div>
            </div>
          </div>
        </section>

        <!-- Visual Field Summary Furrow -->
        <section>
          <div class="furrow-divider flex justify-between items-end">
            <div class="flex items-center gap-2">
              <h3 class="font-label-caps text-label-caps text-outline uppercase tracking-widest">Field Summary & Risk Status</h3>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-variant text-outline font-bold">DATABASE & CALC</span>
            </div>
            <button onclick="App.navigate('map')" class="text-primary hover:underline font-label-caps text-label-caps flex items-center gap-1">
              Open Baramati Field Map <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-grid">
            ${zones.filter(z => z.farmer_id === 'farmer-1').map(z => {
              const r = riskScores[z.id] || { computed_action: 'OPTIMAL', water_stress_risk: 0.1, disease_risk: 0.1, pest_risk: 0.1 };
              const readings = sensors.filter(s => s.zone_id === z.id);
              const latest = readings[0] || { moisture: 32 };
              
              let spineClass = 'card-spine-primary';
              let badgeClass = 'bg-primary-container text-on-primary-container';
              let statusText = 'Healthy';

              if (r.computed_action === 'IRRIGATE' || r.water_stress_risk >= 0.7) {
                spineClass = 'card-spine-warning';
                badgeClass = 'bg-secondary-container text-on-secondary-container';
                statusText = 'Water Stress';
              } else if (r.computed_action === 'PROTECT' || r.disease_risk >= 0.7) {
                spineClass = 'card-spine-danger';
                badgeClass = 'bg-error-container text-on-error-container';
                statusText = 'Disease Risk';
              } else if (r.pest_risk >= 0.7) {
                spineClass = 'card-spine-warning';
                badgeClass = 'bg-[#ffddb5] text-[#714800]';
                statusText = 'Pest Alert';
              }

              return `
                <div class="card-level-1 ${spineClass} p-5 rounded-r-lg flex flex-col justify-between h-48 cursor-pointer hover:shadow-md transition-shadow" onclick="DashboardView.showWhyModal('${z.id}')">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h4 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">${z.name}</h4>
                      <p class="font-body-sm text-body-sm text-on-surface-variant">${z.crop} • ${z.growth_stage} (${z.area_ha} Ha)</p>
                    </div>
                    <span class="${badgeClass} font-label-caps text-label-caps px-2 py-1 rounded">${statusText}</span>
                  </div>
                  
                  <div class="border-t border-outline-variant/60 pt-3 mt-auto">
                    <div class="flex items-center justify-between">
                      <span class="font-label-caps text-label-caps text-outline">Moisture</span>
                      <span class="font-data-md text-data-md text-on-surface font-mono font-bold">${latest.moisture}%</span>
                    </div>
                    <div class="w-full bg-surface-container-highest rounded-full h-1.5 mt-2 overflow-hidden">
                      <div class="h-full ${latest.moisture < 20 ? 'bg-error' : 'bg-primary'}" style="width: ${Math.min(latest.moisture * 2.5, 100)}%;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Decorative Map Canvas Grounding (Baramati Field Canvas) -->
        <div onclick="App.navigate('map')" class="cursor-pointer rounded-lg overflow-hidden border border-outline-variant h-64 relative bg-[#e2f3d8] hover:border-primary transition-colors" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAVGfUHoqFnRF-b65KryRnbrAiyTomGpjH1uT6AZuf7rv1MJoiFxUzh7Bo9GTS_UN7vJ9Y9ohzc59PIKY5E-tdVRCa0eSV4op_tH18IY0fJzcyUg_2OSUFhqDFENzNLdRZa54FgCNsdUNEm2rdiBFP1rIM7eLPTln9UqMTWlPgp4M4r3IDjVfszkm5GJn08n3XyLyyCgG5in_nybCvVpYxuZxUi8FWKEKipk0rQQmEoLaRaiunLZge-'); background-size: cover; background-position: center;">
          <div class="absolute inset-0 bg-surface/30 backdrop-blur-[1px]"></div>
          <div class="absolute bottom-4 left-4 bg-surface/95 px-4 py-2 rounded-lg border border-outline-variant backdrop-blur-sm flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">map</span>
            <div>
              <span class="font-data-md text-data-md text-on-surface font-bold">Baramati Field Map (18.15° N, 74.58° E)</span>
              <p class="font-body-sm text-xs text-on-surface-variant">Click to view micro-zones across Malegaon Khurd, Rui, and Kattebhel</p>
            </div>
          </div>
        </div>
      </div>
    `;

    loading.classList.add('hidden');
    content.classList.remove('hidden');

  } catch (err) {
    console.error('Error rendering dashboard:', err);
    container.innerHTML = Components.renderErrorBanner(`Failed to load dashboard data: ${err.message}`, "DashboardView.render(document.getElementById('main-content'))");
  }
  },

  async showWhyModal(zoneId) {
    const [zoneRes, riskRes, weatherRes, sensorsRes] = await Promise.all([
      API.getById('zones', zoneId),
      API.getRiskScores(),
      API.getWeather(),
      API.getFilteredReadings(zoneId)
    ]);

    const zone = zoneRes.data || { name: 'Zone', crop: 'Wheat' };
    const risk = (riskRes.risk_scores && riskRes.risk_scores[zoneId]) || {
      computed_action: 'OPTIMAL',
      reasons: ['Optimal growing conditions.'],
      disease_risk: 0.1,
      pest_risk: 0.1,
      water_stress_risk: 0.1
    };
    const weather = weatherRes.weather || { temp: '--', humidity: '--', rain_probability: '--', is_live: false };
    const readings = sensorsRes.data || [];
    const latest = readings[0] || { moisture: 32, temp: 28, humidity: 65, provenance: 'DATABASE' };

    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-xl w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-primary text-3xl">psychology</span>
          <div>
            <span class="font-label-caps text-label-caps text-outline uppercase tracking-wider">AI Decision Engine Audit [PROVENANCE: CALCULATED]</span>
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">${zone.name}</h3>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <div class="space-y-4">
          <div class="bg-surface-container p-4 rounded-lg border border-outline-variant/60 flex justify-between items-center">
            <div>
              <span class="font-label-caps text-xs text-outline uppercase block">Computed Action</span>
              <p class="font-display-md text-2xl font-bold text-primary font-fraunces mt-0.5">${risk.computed_action}</p>
            </div>
            <span class="px-2.5 py-1 rounded text-xs font-mono font-bold ${risk.computed_action === 'IRRIGATE' ? 'bg-error text-surface' : (risk.computed_action === 'PROTECT' ? 'bg-secondary text-surface' : 'bg-primary-container text-on-primary-container')}">
              ${risk.computed_action}
            </span>
          </div>

          <div>
            <span class="font-label-caps text-xs text-outline uppercase block mb-2 font-bold">Multimodal Decision Logic Trace</span>
            <ul class="space-y-2 font-body-md text-xs text-on-surface">
              ${risk.reasons.map(r => `
                <li class="flex items-start gap-2 bg-[#FBFBF6] p-2.5 rounded border border-[#DCE1D3]">
                  <span class="material-symbols-outlined text-primary text-sm mt-0.5" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                  <span class="leading-relaxed">${r}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Comprehensive Multimodal Input Factors Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2">
            <div class="p-2.5 bg-surface rounded border border-outline-variant">
              <span class="font-label-caps text-[10px] text-outline block uppercase">Soil Moisture</span>
              <span class="font-data-md font-bold font-mono text-on-surface text-sm">${latest.moisture}%</span>
              <span class="text-[9px] text-outline block mt-0.5">${zone.growth_stage || 'Stage'} Limit: 22%</span>
            </div>
            <div class="p-2.5 bg-surface rounded border border-outline-variant">
              <span class="font-label-caps text-[10px] text-outline block uppercase">Canopy Microclimate</span>
              <span class="font-data-md font-bold font-mono text-on-surface text-sm">${latest.temp}°C / ${latest.humidity}%</span>
              <span class="text-[9px] text-outline block mt-0.5">Temp / Rel. Hum</span>
            </div>
            <div class="p-2.5 bg-surface rounded border border-outline-variant">
              <span class="font-label-caps text-[10px] text-outline block uppercase">Pune Rain Chance</span>
              <span class="font-data-md font-bold font-mono text-on-surface text-sm">${weather.rain_probability !== null ? weather.rain_probability + '%' : '10%'}</span>
              <span class="text-[9px] text-outline block mt-0.5">${weather.is_live ? 'Live Sync' : 'Baramati Grid'}</span>
            </div>
            <div class="p-2.5 bg-surface rounded border border-outline-variant">
              <span class="font-label-caps text-[10px] text-outline block uppercase">AI Vision Pathology</span>
              <span class="font-data-md font-bold font-mono text-xs ${risk.inputs && risk.inputs.ai_confidence ? 'text-secondary' : 'text-outline'} block truncate">
                ${risk.inputs && risk.inputs.ai_disease ? risk.inputs.ai_disease : (risk.inputs && risk.inputs.ai_status === 'UNAVAILABLE' ? 'AI Unavailable' : 'No Active Pests')}
              </span>
              <span class="text-[9px] text-outline block mt-0.5 font-mono">${risk.inputs && risk.inputs.ai_confidence ? `${risk.inputs.ai_confidence}% Conf` : 'Heuristic/Sensor'}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button onclick="App.closeModal()" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
            Dismiss
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async approveIrrigation(zoneId) {
    try {
      const res = await API.triggerIrrigation(zoneId, 8, 'FARMER_APPROVAL');
      if (res.success) {
        Components.showToast(`Irrigation pump cycle approved for ${zoneId.toUpperCase()} (8 minutes). Relay triggered.`, 'success');
        this.render(document.getElementById('main-content'));
      }
    } catch (e) {
      Components.showToast(`Failed to trigger irrigation: ${e.message}`, 'error');
    }
  }
};
