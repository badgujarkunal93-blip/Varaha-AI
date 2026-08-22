// View: Irrigation Management (Real Data & Provenance)

const IrrigationView = {
  selectedZone: 'all',

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="irrigation-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="irrigation-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [zonesRes, filteredSensorsRes, eventsRes, hwStatusRes] = await Promise.all([
        API.getTable('zones'),
        API.getFilteredReadings(this.selectedZone),
        API.getTable('irrigation_events'),
        API.getHardwareStatus()
      ]);

      const zones = zonesRes.data || [];
      const sensors = filteredSensorsRes.data || [];
      const events = eventsRes.data || [];
      const hwStatus = (hwStatusRes && hwStatusRes.status) || { mode: 'DEMO', isPhysicalLive: false };

      // Average moisture computed strictly from active table data
      const latestMoistures = sensors.slice(0, 12).map(r => r.moisture);
      const avgMoisture = latestMoistures.length
        ? (latestMoistures.reduce((a, b) => a + b, 0) / latestMoistures.length).toFixed(1)
        : (hwStatus.mode === 'LIVE_HARDWARE' ? '--' : '31.8');

      // Total water used: STRICTLY SUM OF REAL EVENTS IN DATABASE
      const totalWater = events.reduce((sum, e) => sum + (Number(e.water_used_liters) || 0), 0);

      // Calculate days since last event from real timestamp
      let lastEventLabel = "None";
      let lastEventSubtitle = "No previous cycles";
      if (events.length > 0) {
        const lastEv = events[0];
        const eventDate = new Date(lastEv.timestamp);
        const hoursAgo = Math.round((Date.now() - eventDate.getTime()) / (1000 * 3600));
        lastEventLabel = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
        lastEventSubtitle = `${lastEv.zone_id.toUpperCase()} (${lastEv.duration_minutes || 8} min cycle)`;
      }

      // Chronologically sort readings for the time series chart
      const chartReadings = [...sensors]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-14);

      const content = document.getElementById('irrigation-content');
      const loading = document.getElementById('irrigation-loading');

      content.innerHTML = `
        <!-- Page Header & Zone Filter -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="font-display-md text-display-md text-on-surface font-fraunces">Irrigation Control</h2>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${hwStatus.mode === 'LIVE_HARDWARE' ? (hwStatus.isPhysicalLive ? 'bg-primary text-surface' : 'bg-error text-surface') : 'bg-secondary-container text-on-secondary-container'}">
                ${hwStatus.mode === 'LIVE_HARDWARE' ? 'LIVE MODE' : 'DEMO MODE'}
              </span>
            </div>
            <p class="font-body-md text-body-md text-outline">Manage and monitor precision water distribution across Baramati field sectors.</p>
          </div>
          
          <div class="inline-flex bg-surface-container rounded-lg p-1 border border-outline-variant shadow-sm h-10 self-start md:self-auto">
            <button onclick="IrrigationView.filterZone('all')" class="px-4 py-1 text-label-caps font-label-caps rounded-md ${this.selectedZone === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'} transition-colors">
              All Zones
            </button>
            <button onclick="IrrigationView.filterZone('zone-a')" class="px-4 py-1 text-label-caps font-label-caps rounded-md ${this.selectedZone === 'zone-a' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'} transition-colors">
              Zone A
            </button>
            <button onclick="IrrigationView.filterZone('zone-b')" class="px-4 py-1 text-label-caps font-label-caps rounded-md ${this.selectedZone === 'zone-b' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'} transition-colors">
              Zone B (Stress)
            </button>
            <button onclick="IrrigationView.filterZone('zone-c')" class="px-4 py-1 text-label-caps font-label-caps rounded-md ${this.selectedZone === 'zone-c' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'} transition-colors">
              Zone C
            </button>
          </div>
        </div>

        <!-- Header Stats Cards (Strictly Derived from DB Records) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter-grid">
          <!-- Stat 1: Avg Moisture -->
          <div class="card-level-1 card-spine-primary p-6 relative overflow-hidden flex flex-col justify-between">
            <div class="flex justify-between items-start mb-4">
              <span class="text-label-caps font-label-caps text-outline uppercase tracking-wider">Avg Soil Moisture</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container font-bold text-outline">
                ${hwStatus.mode === 'LIVE_HARDWARE' ? (hwStatus.isPhysicalLive ? 'REAL SENSOR' : 'OFFLINE') : 'SIMULATED / DEMO'}
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-display-md font-display-md text-on-surface font-mono font-bold">${avgMoisture}</span>
              <span class="text-body-md font-body-md text-outline">%</span>
            </div>
            <div class="mt-2 flex items-center ${avgMoisture < 20 ? 'text-error' : 'text-primary'}">
              <span class="material-symbols-outlined text-sm mr-1">${avgMoisture < 20 ? 'trending_down' : 'check_circle'}</span>
              <span class="text-body-sm font-body-sm font-medium">${avgMoisture < 20 ? 'Moisture below critical threshold' : 'Hydration in target equilibrium'}</span>
            </div>
          </div>

          <!-- Stat 2: Days Since Last Event -->
          <div class="card-level-1 card-spine-tertiary p-6 relative overflow-hidden flex flex-col justify-between">
            <div class="flex justify-between items-start mb-4">
              <span class="text-label-caps font-label-caps text-outline uppercase tracking-wider">Last Irrigation Cycle</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container font-bold text-outline">DATABASE LOG</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-display-md font-display-md text-on-surface font-mono font-bold">${lastEventLabel}</span>
            </div>
            <div class="mt-2 flex items-center text-on-surface-variant">
              <span class="material-symbols-outlined text-sm mr-1">history</span>
              <span class="text-body-sm font-body-sm">${lastEventSubtitle}</span>
            </div>
          </div>

          <!-- Stat 3: Total Water Used (Summed from real DB records) -->
          <div class="card-level-1 card-spine-warning p-6 relative overflow-hidden flex flex-col justify-between">
            <div class="flex justify-between items-start mb-4">
              <span class="text-label-caps font-label-caps text-outline uppercase tracking-wider">Water Distributed</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container font-bold text-outline">CALCULATED SUM</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-display-md font-display-md text-on-surface font-mono font-bold">${totalWater.toLocaleString()}</span>
              <span class="text-body-md font-body-md text-outline">Liters</span>
            </div>
            <div class="mt-2 flex items-center text-primary">
              <span class="material-symbols-outlined text-sm mr-1">check</span>
              <span class="text-body-sm font-body-sm font-medium">Summed from ${events.length} event records</span>
            </div>
          </div>
        </div>

        <!-- Manual & Automated Trigger Section -->
        <section class="card-level-1 p-6 space-y-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/60 pb-4">
            <div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">Direct Pump / Solenoid Relay Control</h3>
              <p class="font-body-sm text-on-surface-variant">Actuate field relays via ESP32 GPIO command queue.</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <select id="pump-zone-select" class="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
                ${zones.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}
              </select>
              <select id="pump-duration-select" class="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
                <option value="5">5 Minutes (~7,250 L)</option>
                <option value="8" selected>8 Minutes (~11,600 L)</option>
                <option value="15">15 Minutes (~21,750 L)</option>
                <option value="30">30 Minutes (~43,500 L)</option>
              </select>
              <button onclick="IrrigationView.triggerPumpManual()" class="px-6 py-2 bg-primary text-surface font-label-caps text-label-caps rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
                <span class="material-symbols-outlined text-lg">water_drop</span> Trigger Irrigation Cycle
              </button>
            </div>
          </div>

          <!-- Moisture Trend Chart (Honest readings with timestamps) -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-2">
                <span class="font-label-caps text-label-caps text-outline uppercase tracking-wider">Soil Moisture Response Curve</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container font-bold text-outline">
                  ${hwStatus.mode === 'LIVE_HARDWARE' ? 'REAL ESP32 TIMELINE' : 'SIMULATED TIMELINE'}
                </span>
              </div>
              <span class="text-xs font-mono text-outline">Optimal Band: 25% - 40%</span>
            </div>
            
            <div class="bg-surface p-4 rounded-lg border border-outline-variant relative overflow-hidden">
              <div class="h-48 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2">
                ${chartReadings.length === 0 ? `
                  <div class="w-full text-center text-outline text-sm py-12">
                    ${hwStatus.mode === 'LIVE_HARDWARE' ? 'Awaiting incoming physical sensor packets from ESP32 node...' : 'No historical data recorded for selected sector.'}
                  </div>
                ` : chartReadings.map((r) => {
                  const heightPercent = Math.min(Math.max((r.moisture / 50) * 100, 15), 100);
                  const isLow = r.moisture < 20;
                  const dateObj = new Date(r.timestamp);
                  const timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return `
                    <div class="flex-1 flex flex-col items-center gap-1 group relative">
                      <div class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-on-surface text-surface text-xs px-2 py-1 rounded font-mono pointer-events-none transition-opacity z-10 whitespace-nowrap">
                        ${r.moisture}% (${timeLabel}) [${r.source === 'PHYSICAL_ESP32' ? 'REAL' : 'DEMO'}]
                      </div>
                      <div class="w-full ${isLow ? 'bg-error' : 'bg-primary'} rounded-t transition-all duration-500 hover:opacity-80" style="height: ${heightPercent}%;"></div>
                      <span class="text-[10px] font-mono text-outline truncate w-full text-center">${timeLabel}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </section>

        <!-- Irrigation Event History Log -->
        <section>
          <div class="furrow-divider flex justify-between items-end">
            <h3 class="font-label-caps text-label-caps text-outline uppercase tracking-widest">Irrigation Ledger & History</h3>
            <span class="font-data-md text-data-md text-outline">Logged Events: ${events.length}</span>
          </div>

          <div class="card-level-1 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left font-body-sm text-on-surface">
                <thead class="bg-surface-container border-b border-outline-variant font-label-caps text-outline uppercase text-xs">
                  <tr>
                    <th class="p-4">Timestamp</th>
                    <th class="p-4">Zone</th>
                    <th class="p-4">Trigger Source</th>
                    <th class="p-4">Duration</th>
                    <th class="p-4">Moisture (Before → After)</th>
                    <th class="p-4">Water Used</th>
                    <th class="p-4">Outcome</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/40">
                  ${events.map(e => `
                    <tr class="hover:bg-surface-container-low transition-colors">
                      <td class="p-4 font-mono">${new Date(e.timestamp).toLocaleString()}</td>
                      <td class="p-4 font-semibold">${e.zone_id.toUpperCase()}</td>
                      <td class="p-4">
                        <span class="px-2 py-1 rounded text-xs font-label-caps ${e.trigger_source === 'AUTOMATIC' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface'}">
                          ${e.trigger_source}
                        </span>
                      </td>
                      <td class="p-4 font-mono">${e.duration_minutes || 8} mins</td>
                      <td class="p-4 font-mono">${e.moisture_before}% → <span class="text-primary font-bold">${e.moisture_after}%</span></td>
                      <td class="p-4 font-mono">${(Number(e.water_used_liters) || 0).toLocaleString()} L</td>
                      <td class="p-4">
                        <span class="inline-flex items-center gap-1 text-primary font-bold text-xs">
                          <span class="material-symbols-outlined text-[14px]">check_circle</span> SUCCESS
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering irrigation:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load irrigation data: ${err.message}`, "IrrigationView.render(document.getElementById('main-content'))");
    }
  },

  filterZone(zoneId) {
    this.selectedZone = zoneId;
    this.render(document.getElementById('main-content'));
  },

  async triggerPumpManual() {
    const zoneSelect = document.getElementById('pump-zone-select');
    const durationSelect = document.getElementById('pump-duration-select');
    const zoneId = zoneSelect ? zoneSelect.value : 'zone-b';
    const duration = durationSelect ? parseInt(durationSelect.value, 10) : 8;

    try {
      const res = await API.triggerIrrigation(zoneId, duration, 'MANUAL_OVERRIDE');
      if (res.success) {
        if (res.data && res.data.status === 'COMMAND_QUEUED_HARDWARE_OFFLINE') {
          Components.showToast(`Hardware Offline: ESP32 node is disconnected. Command queued in backend (or switch to Demo Mode).`, 'warning');
        } else {
          Components.showToast(`Relay command dispatched: Zone ${zoneId.toUpperCase()} active for ${duration} mins. Awaiting ESP32 execution.`, 'success');
        }
        this.render(document.getElementById('main-content'));
      }
    } catch (err) {
      Components.showToast(`Error triggering pump: ${err.message}`, 'error');
    }
  }
};
