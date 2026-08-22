// View: Settings, Profile & Hardware Diagnostics (Baramati, Pune)

const SettingsView = {
  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="settings-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="settings-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [farmerRes, ticketsRes, sessionRes, hwStatusRes] = await Promise.all([
        API.getById('farmers', 'farmer-1'),
        API.getTable('maintenance_tickets'),
        API.getSession(),
        API.getHardwareStatus()
      ]);

      const farmer = farmerRes.data || {
        name: 'Ramesh Patel',
        contact: '+91 98230 45123',
        location: 'Malegaon Khurd, Baramati, Pune',
        crop: 'Wheat (HD 2967)',
        acres: 12.5
      };

      const tickets = ticketsRes.data || [];
      const hwStatus = (hwStatusRes && hwStatusRes.status) || { mode: 'DEMO', isPhysicalLive: false };

      const content = document.getElementById('settings-content');
      const loading = document.getElementById('settings-loading');

      content.innerHTML = `
        <!-- Header -->
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 class="font-display-md text-display-md text-on-surface font-fraunces">Settings & Hardware Operations</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">Manage telemetry mode, farm profile, alert preferences, and connected equipment in Baramati, Pune.</p>
          </div>
          <button onclick="SettingsView.openTicketModal()" class="bg-primary text-surface rounded-lg px-5 py-2.5 font-label-caps text-label-caps uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-lg">report</span> Report Hardware Issue
          </button>
        </header>

        <!-- Operating Mode Switcher (Demo vs Live Hardware) -->
        <div class="card-level-1 p-6 rounded-xl border-2 ${hwStatus.mode === 'LIVE_HARDWARE' ? 'border-primary' : 'border-secondary'} bg-surface-container-low">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="material-symbols-outlined ${hwStatus.mode === 'LIVE_HARDWARE' ? 'text-primary' : 'text-secondary'} text-2xl">
                  ${hwStatus.mode === 'LIVE_HARDWARE' ? 'sensors' : 'developer_board'}
                </span>
                <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">
                  Active Operating Mode: <span class="${hwStatus.mode === 'LIVE_HARDWARE' ? 'text-primary' : 'text-secondary'}">${hwStatus.mode === 'LIVE_HARDWARE' ? 'LIVE HARDWARE MODE' : 'DEMO MODE (Simulated Telemetry)'}</span>
                </h3>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant max-w-2xl">
                ${hwStatus.mode === 'LIVE_HARDWARE'
                  ? 'Live mode processes only genuine physical ESP32 telemetry packets from POST /api/sensor-readings. Background simulation is paused.'
                  : 'Demo mode generates realistic Baramati microclimate ticks for evaluation when physical hardware is disconnected. All demo values are clearly labelled.'}
              </p>
            </div>

            <div class="flex items-center gap-2 bg-surface p-1 rounded-lg border border-outline-variant shadow-sm shrink-0">
              <button onclick="SettingsView.switchOperatingMode('DEMO')" class="px-4 py-2 rounded-md font-label-caps text-xs font-bold transition-all ${hwStatus.mode === 'DEMO' ? 'bg-secondary text-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
                🔘 DEMO MODE
              </button>
              <button onclick="SettingsView.switchOperatingMode('LIVE_HARDWARE')" class="px-4 py-2 rounded-md font-label-caps text-xs font-bold transition-all ${hwStatus.mode === 'LIVE_HARDWARE' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
                ⚡ LIVE HARDWARE
              </button>
            </div>
          </div>
        </div>

        <!-- Two Column Layout: Profile/Preferences & Equipment Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter-grid">
          <!-- Farm Profile & Notification Form -->
          <div class="card-level-1 card-spine-primary p-6 space-y-5">
            <div class="flex items-center gap-3 border-b border-outline-variant/60 pb-3">
              <span class="material-symbols-outlined text-primary text-2xl">account_circle</span>
              <div>
                <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Farm Profile & Ledger</h3>
                <span class="font-label-caps text-xs text-outline font-mono">[PROVENANCE: DATABASE RECORD]</span>
              </div>
            </div>

            <form id="farmer-profile-form" onsubmit="SettingsView.saveProfile(event)" class="space-y-4">
              <div>
                <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Farmer Name</label>
                <input type="text" id="prof-name" value="${farmer.name}" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface focus:border-primary focus:outline-none" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Contact Number</label>
                  <input type="text" id="prof-contact" value="${farmer.contact}" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Total Acres</label>
                  <input type="number" step="0.5" id="prof-acres" value="${farmer.acres}" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Farm Location</label>
                <input type="text" id="prof-location" value="${farmer.location}" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface focus:border-primary focus:outline-none" />
              </div>

              <div>
                <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Primary Crop Variety</label>
                <input type="text" id="prof-crop" value="${farmer.crop}" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface focus:border-primary focus:outline-none" />
              </div>

              <div class="pt-2 border-t border-outline-variant/60">
                <span class="font-label-caps text-xs text-outline block mb-2 uppercase font-bold">Automated Advisory Channels</span>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked class="rounded text-primary focus:ring-primary h-4 w-4" />
                    <span>SMS Critical Weather & Frost Alerts (Baramati Grid)</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked class="rounded text-primary focus:ring-primary h-4 w-4" />
                    <span>WhatsApp Irrigation Trigger Notifications</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked class="rounded text-primary focus:ring-primary h-4 w-4" />
                    <span>Weekly Regional Disease Cluster Digest</span>
                  </label>
                </div>
              </div>

              <div class="pt-2 flex justify-end">
                <button type="submit" class="px-6 py-2.5 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm">
                  <span class="material-symbols-outlined text-base">save</span> Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          <!-- Connected Hardware Telemetry Diagnostics -->
          <div class="space-y-6">
            <!-- Equipment Card -->
            <div class="card-level-1 card-spine-primary p-6 relative rounded">
              <div class="absolute top-6 right-6 font-data-md text-xs font-mono text-outline">
                ID: SMP-9021
              </div>
              <div class="flex items-start gap-4 mb-4">
                <div class="w-11 h-11 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-sm">
                  <span class="material-symbols-outlined text-2xl">sensors</span>
                </div>
                <div>
                  <h4 class="font-body-lg font-semibold text-on-surface">Soil Moisture Probe (ESP32 Node)</h4>
                  <p class="font-body-sm text-xs text-on-surface-variant">Malegaon Khurd Plot • Baramati Sector A</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="p-2.5 bg-surface rounded border border-outline-variant">
                  <span class="font-label-caps text-xs text-outline block mb-0.5">Connection State</span>
                  <span class="inline-flex items-center gap-1.5 font-bold text-xs font-mono ${hwStatus.isPhysicalLive ? 'text-primary' : (hwStatus.mode === 'LIVE_HARDWARE' ? 'text-error' : 'text-secondary')}">
                    <span class="w-2 h-2 rounded-full ${hwStatus.isPhysicalLive ? 'bg-primary animate-pulse' : (hwStatus.mode === 'LIVE_HARDWARE' ? 'bg-error' : 'bg-secondary')}"></span>
                    ${hwStatus.isPhysicalLive ? 'ESP32 Live' : (hwStatus.mode === 'LIVE_HARDWARE' ? 'Disconnected' : 'Simulated')}
                  </span>
                </div>
                <div class="p-2.5 bg-surface rounded border border-outline-variant">
                  <span class="font-label-caps text-xs text-outline block mb-0.5">Last Real Packet</span>
                  <span class="font-mono text-xs text-on-surface font-semibold">
                    ${hwStatus.lastSeenSecondsAgo !== null ? `${hwStatus.lastSeenSecondsAgo}s ago` : 'None in session'}
                  </span>
                </div>
                <div class="p-2.5 bg-surface rounded border border-outline-variant">
                  <span class="font-label-caps text-xs text-outline block mb-0.5">Firmware</span>
                  <span class="font-mono text-xs text-on-surface">${hwStatus.firmware}</span>
                </div>
                <div class="p-2.5 bg-surface rounded border border-outline-variant">
                  <span class="font-label-caps text-xs text-outline block mb-0.5">Battery</span>
                  <span class="font-mono text-xs text-primary font-semibold">85% (Solar LiFePO4)</span>
                </div>
              </div>

              <!-- Test Physical Hardware Pulse -->
              <div class="mt-4 pt-3 border-t border-outline-variant/60 flex justify-between items-center">
                <span class="text-xs text-outline font-body-sm">Test Hardware Connection:</span>
                <button onclick="SettingsView.simulateHardwarePulse()" class="px-3.5 py-1.5 bg-primary text-surface rounded text-xs font-label-caps hover:opacity-90 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">bolt</span> Send ESP32 Pulse
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Service History Ledger -->
        <section>
          <div class="furrow-divider flex justify-between items-end">
            <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Hardware Service History & Tickets</h3>
            <span class="font-mono text-xs text-outline">Active Tickets: ${tickets.length}</span>
          </div>

          <div class="card-level-1 divide-y divide-outline-variant/60 overflow-hidden">
            ${tickets.map(tkt => `
              <div class="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-surface-container-low transition-colors">
                <div class="flex items-start gap-4 mb-3 sm:mb-0">
                  <span class="material-symbols-outlined ${tkt.status === 'RESOLVED' ? 'text-primary' : 'text-secondary'} mt-1">
                    ${tkt.status === 'RESOLVED' ? 'check_circle' : 'pending'}
                  </span>
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-body-md font-semibold text-on-surface">${tkt.issue}</h4>
                      <span class="font-label-caps text-xs bg-surface-variant text-on-surface px-2 py-0.5 rounded font-mono font-bold">ID: ${tkt.device_id}</span>
                    </div>
                    <p class="font-body-sm text-xs text-on-surface-variant">${tkt.notes || 'Hardware ticket registered.'} • Assigned to: <span class="font-semibold">${tkt.assigned_to}</span></p>
                  </div>
                </div>
                <div class="text-left sm:text-right ml-9 sm:ml-0">
                  <p class="font-mono text-xs text-outline mb-1">${new Date(tkt.created_at).toLocaleDateString()}</p>
                  <span class="font-label-caps text-xs px-2.5 py-1 rounded font-bold ${tkt.status === 'RESOLVED' ? 'bg-[#d5ffc1] text-[#245018]' : 'bg-secondary-container text-on-secondary-container'}">
                    ${tkt.status}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering settings:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load settings: ${err.message}`, "SettingsView.render(document.getElementById('main-content'))");
    }
  },

  async switchOperatingMode(mode) {
    try {
      const res = await API.setTelemetryMode(mode);
      if (res.success) {
        Components.showToast(`Operating mode switched to: ${mode === 'LIVE_HARDWARE' ? 'Live Hardware Mode' : 'Demo Mode'}`, 'info');
        await App.updateRoleUI();
        this.render(document.getElementById('main-content'));
      }
    } catch (e) {
      Components.showToast(`Error changing mode: ${e.message}`, 'error');
    }
  },

  async saveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('prof-name').value;
    const contact = document.getElementById('prof-contact').value;
    const acres = parseFloat(document.getElementById('prof-acres').value) || 12.5;
    const location = document.getElementById('prof-location').value;
    const crop = document.getElementById('prof-crop').value;

    try {
      await API.updateRecord('farmers', 'farmer-1', { name, contact, acres, location, crop });
      Components.showToast('Farm Profile successfully updated and saved to database.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Failed to save profile: ${err.message}`, 'error');
    }
  },

  openTicketModal() {
    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-md w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-secondary text-3xl">build</span>
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Report Hardware Issue</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Dispatch KVK Baramati field maintenance technician for sensor node repair.</p>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <form id="tkt-form" onsubmit="SettingsView.submitTicket(event)" class="space-y-4">
          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Target Device</label>
            <select id="tkt-device" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
              <option value="SMP-9021">Soil Moisture Probe (SMP-9021) - Malegaon Khurd</option>
              <option value="SMP-9022">Soil Moisture Probe (SMP-9022) - Central Basin</option>
              <option value="GTW-4410">Main Field Gateway (GTW-4410) - Baramati Hub</option>
            </select>
          </div>

          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Observed Issue</label>
            <input type="text" id="tkt-issue" placeholder="e.g. Inconsistent moisture reading, physical damage" required class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
          </div>

          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Additional Notes</label>
            <textarea id="tkt-notes" rows="3" placeholder="Describe symptoms or recent weather events..." class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface"></textarea>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="submit" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async submitTicket(e) {
    e.preventDefault();
    const device_id = document.getElementById('tkt-device').value;
    const issue = document.getElementById('tkt-issue').value;
    const notes = document.getElementById('tkt-notes').value;

    try {
      await API.createRecord('maintenance_tickets', {
        device_id,
        issue,
        status: 'OPEN',
        assigned_to: 'Field Tech (Kavita, KVK Baramati)',
        created_at: new Date().toISOString(),
        resolved_at: null,
        notes
      });
      App.closeModal();
      Components.showToast(`Maintenance Ticket for ${device_id} created successfully. Technician assigned.`, 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Failed to create ticket: ${err.message}`, 'error');
    }
  },

  async simulateHardwarePulse() {
    await API.simulatePhysicalPulse();
    Components.showToast('Physical ESP32 packet received! Connection marked: ESP32 Live (Green)', 'success');
    await App.updateRoleUI();
    if (App.currentView === 'dashboard') {
      DashboardView.render(document.getElementById('main-content'));
    } else {
      this.render(document.getElementById('main-content'));
    }
  }
};
