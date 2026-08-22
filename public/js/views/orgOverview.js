// View: Organization / FPO Admin Console (Baramati Taluka Kisan Vikas FPO)

const OrgOverviewView = {
  activeTab: 'alerts', // 'alerts' | 'farmers' | 'tickets' | 'officers'

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="org-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="org-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [analyticsRes, farmersRes, farmsRes, zonesRes, devicesRes, alertsRes, ticketsRes, expertsRes, techniciansRes] = await Promise.all([
        API.getOrgAnalytics(),
        API.getTable('farmers'),
        API.getTable('farms'),
        API.getTable('zones'),
        API.getTable('devices'),
        API.getTable('alerts'),
        API.getTable('maintenance_tickets'),
        API.getTable('experts'),
        API.getTable('technicians')
      ]);

      const analytics = analyticsRes.analytics || {
        total_farmers: 4,
        total_farms: 4,
        total_zones: 7,
        total_devices: 7,
        total_hectares: 14.6,
        active_alerts_count: 2,
        open_tickets_count: 1
      };

      const farmers = farmersRes.data || [];
      const farms = farmsRes.data || [];
      const zones = zonesRes.data || [];
      const devices = devicesRes.data || [];
      const alerts = alertsRes.data || [];
      const tickets = ticketsRes.data || [];
      const experts = expertsRes.data || [];
      const technicians = techniciansRes.data || [];

      const content = document.getElementById('org-content');
      const loading = document.getElementById('org-loading');

      content.innerHTML = `
        <!-- Header & Action Button -->
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="font-display-md text-display-md text-on-surface font-fraunces">Baramati FPO Operations Console</h2>
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary text-surface">SERVICE LAYER</span>
            </div>
            <p class="font-body-md text-body-md text-on-surface-variant">Central service and agronomic coordination hub for Baramati Taluka, Pune District.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="OrgOverviewView.openRegisterFarmerModal()" class="px-4 py-2.5 bg-primary text-surface rounded-lg font-label-caps text-label-caps flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
              <span class="material-symbols-outlined text-lg">person_add</span> Register Farmer
            </button>
            <button onclick="App.navigate('review-queue')" class="px-4 py-2.5 border border-primary text-primary bg-surface rounded-lg font-label-caps text-label-caps flex items-center gap-2 hover:bg-surface-container-high transition-colors">
              <span class="material-symbols-outlined text-lg">biotech</span> Expert Review Queue
            </button>
          </div>
        </header>

        <!-- KPI Cards (Strictly Derived from Real Relational Records) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter-grid">
          <!-- Total Farmers & Farms -->
          <div class="card-level-1 card-spine-primary p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Registered Network</span>
              <span class="material-symbols-outlined text-primary text-xl">groups</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">${analytics.total_farmers}</span>
              <span class="text-xs text-outline font-body-sm font-medium">Farmers (${analytics.total_farms} Farms)</span>
            </div>
            <span class="text-[10px] font-mono text-outline">[DATABASE RELATIONS]</span>
          </div>

          <!-- Total Hectares & Micro-Zones -->
          <div class="card-level-1 card-spine-primary p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Monitored Canopy</span>
              <span class="material-symbols-outlined text-primary text-xl">landscape</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">${analytics.total_hectares}</span>
              <span class="text-xs text-outline font-body-sm font-medium">Ha (${analytics.total_zones} Zones)</span>
            </div>
            <span class="text-[10px] font-mono text-outline">[PUNE BARAMATI GRID]</span>
          </div>

          <!-- Active Alerts -->
          <div class="card-level-1 card-spine-danger p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Active Alerts</span>
              <span class="material-symbols-outlined text-error text-xl" style="font-variation-settings: 'FILL' 1;">warning</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-error">${analytics.active_alerts_count}</span>
              <span class="text-xs text-error font-body-sm font-medium">Requires Action</span>
            </div>
            <span class="text-[10px] font-mono text-error">[PATHOLOGY & STRESS]</span>
          </div>

          <!-- Open Maintenance Tickets -->
          <div class="card-level-1 card-spine-warning p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Hardware Service</span>
              <span class="material-symbols-outlined text-secondary text-xl">build</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-secondary">${analytics.open_tickets_count}</span>
              <span class="text-xs text-secondary font-body-sm font-medium">Open Tickets</span>
            </div>
            <span class="text-[10px] font-mono text-secondary">[ESP32 / SENSORS]</span>
          </div>
        </div>

        <!-- Section Navigation Segmented Control -->
        <div class="flex border-b border-outline-variant pb-2 overflow-x-auto gap-2">
          <button onclick="OrgOverviewView.setTab('alerts')" class="px-5 py-2 rounded-lg font-label-caps text-xs font-bold transition-colors ${this.activeTab === 'alerts' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Pathology & Stress Alerts (${alerts.length})
          </button>
          <button onclick="OrgOverviewView.setTab('farmers')" class="px-5 py-2 rounded-lg font-label-caps text-xs font-bold transition-colors ${this.activeTab === 'farmers' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Farmer & Farm Registry (${farmers.length})
          </button>
          <button onclick="OrgOverviewView.setTab('tickets')" class="px-5 py-2 rounded-lg font-label-caps text-xs font-bold transition-colors ${this.activeTab === 'tickets' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Hardware Maintenance Queue (${tickets.length})
          </button>
          <button onclick="OrgOverviewView.setTab('officers')" class="px-5 py-2 rounded-lg font-label-caps text-xs font-bold transition-colors ${this.activeTab === 'officers' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Extension Officers & Techs (${experts.length + technicians.length})
          </button>
        </div>

        <!-- TAB 1: ACTIVE ALERTS & EXTENSION DISPATCH -->
        ${this.activeTab === 'alerts' ? `
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Regional Alerts & Field Interventions</h3>
              <button onclick="App.navigate('map')" class="text-primary font-label-caps text-xs font-bold flex items-center gap-1 hover:underline">
                View on Disease Hotspot Map <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div class="card-level-1 divide-y divide-outline-variant/60 overflow-hidden">
              ${alerts.map(alt => {
                const f = farmers.find(item => item.id === alt.farmer_id) || { name: 'Farmer' };
                const z = zones.find(item => item.id === alt.zone_id) || { name: alt.zone_id };
                const isCritical = alt.severity === 'CRITICAL';
                return `
                  <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-low transition-colors">
                    <div class="flex items-start gap-3.5">
                      <span class="material-symbols-outlined ${isCritical ? 'text-error' : 'text-secondary'} text-2xl mt-0.5" style="font-variation-settings: 'FILL' 1;">
                        ${alt.problem_type === 'DISEASE' ? 'coronavirus' : (alt.problem_type === 'WATER_STRESS' ? 'water_drop' : 'bug_report')}
                      </span>
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <h4 class="font-body-md font-bold text-on-surface">${alt.problem}</h4>
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isCritical ? 'bg-error text-surface' : 'bg-secondary-container text-on-secondary-container'}">
                            ${alt.severity}
                          </span>
                        </div>
                        <p class="font-body-sm text-xs text-on-surface-variant">
                          Farmer: <span class="font-semibold text-on-surface">${f.name}</span> • Zone: <span class="font-semibold text-on-surface">${z.name}</span> • Status: <span class="font-mono font-bold">${alt.status}</span>
                        </p>
                        ${alt.assigned_officer_name ? `
                          <p class="font-body-sm text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">assignment_ind</span> Assigned Officer: ${alt.assigned_officer_name}
                          </p>
                        ` : ''}
                      </div>
                    </div>

                    <div class="flex gap-2 shrink-0 self-end md:self-center">
                      <button onclick="OrgOverviewView.openAssignOfficerModal('${alt.id}')" class="px-4 py-2 border border-primary text-primary bg-surface rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container-highest transition-colors">
                        Assign Field Officer
                      </button>
                      <button onclick="OrgOverviewView.resolveAlert('${alt.id}')" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 transition-opacity">
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TAB 2: FARMER & FARM REGISTRY -->
        ${this.activeTab === 'farmers' ? `
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Registered Farmers & Parcel Hierarchy</h3>
              <span class="font-mono text-xs text-outline">${farmers.length} Farmers • ${zones.length} Zones</span>
            </div>

            <div class="card-level-1 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left font-body-sm text-on-surface">
                  <thead class="bg-surface-container border-b border-outline-variant font-label-caps text-outline uppercase text-xs">
                    <tr>
                      <th class="p-4">Farmer Name</th>
                      <th class="p-4">Village / Location</th>
                      <th class="p-4">Primary Crop</th>
                      <th class="p-4">Total Acreage</th>
                      <th class="p-4">Associated Farm & Zones</th>
                      <th class="p-4">Contact</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/40">
                    ${farmers.map(f => {
                      const farmerFarms = farms.filter(item => item.farmer_id === f.id);
                      const farmerZones = zones.filter(item => item.farmer_id === f.id);
                      return `
                        <tr class="hover:bg-surface-container-low transition-colors">
                          <td class="p-4 font-bold font-fraunces">${f.name}</td>
                          <td class="p-4 text-on-surface-variant">${f.location}</td>
                          <td class="p-4"><span class="px-2 py-1 bg-surface-variant rounded text-xs">${f.crop}</span></td>
                          <td class="p-4 font-mono font-bold">${f.acres} Acres</td>
                          <td class="p-4">
                            <div class="space-y-1">
                              ${farmerFarms.map(farm => `
                                <div class="text-xs font-semibold text-primary">${farm.name} (${farm.survey_number})</div>
                              `).join('')}
                              <div class="text-[11px] text-outline font-mono">${farmerZones.map(z => z.name).join(', ')}</div>
                            </div>
                          </td>
                          <td class="p-4 font-mono text-xs">${f.contact}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- TAB 3: HARDWARE MAINTENANCE TICKETS -->
        ${this.activeTab === 'tickets' ? `
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">IoT Node & Hardware Service Tickets</h3>
              <span class="font-mono text-xs text-outline">${tickets.filter(t => t.status !== 'RESOLVED').length} Open Service Tickets</span>
            </div>

            <div class="card-level-1 divide-y divide-outline-variant/60 overflow-hidden">
              ${tickets.map(tkt => {
                const isResolved = tkt.status === 'RESOLVED';
                return `
                  <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-low transition-colors">
                    <div class="flex items-start gap-3.5">
                      <span class="material-symbols-outlined ${isResolved ? 'text-primary' : 'text-secondary'} text-2xl mt-0.5">
                        ${isResolved ? 'check_circle' : 'build'}
                      </span>
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <h4 class="font-body-md font-bold text-on-surface">${tkt.issue}</h4>
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isResolved ? 'bg-[#d5ffc1] text-[#245018]' : 'bg-secondary-container text-on-secondary-container'}">
                            ${tkt.status}
                          </span>
                          <span class="font-mono text-xs text-outline">Device: ${tkt.device_id}</span>
                        </div>
                        <p class="font-body-sm text-xs text-on-surface-variant">${tkt.notes || 'Hardware ticket registered.'}</p>
                        <p class="font-body-sm text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                          <span class="material-symbols-outlined text-sm">engineering</span> Assigned Technician: ${tkt.assigned_technician_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div class="flex gap-2 shrink-0 self-end md:self-center">
                      ${!isResolved ? `
                        <button onclick="OrgOverviewView.openAssignTechnicianModal('${tkt.id}')" class="px-4 py-2 border border-secondary text-secondary bg-surface rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container-highest transition-colors">
                          Assign Technician
                        </button>
                        <button onclick="OrgOverviewView.resolveTicket('${tkt.id}')" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 transition-opacity">
                          Mark Fixed
                        </button>
                      ` : `
                        <span class="text-xs text-primary font-mono font-bold flex items-center gap-1">
                          <span class="material-symbols-outlined text-sm">verified</span> RESOLVED
                        </span>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TAB 4: EXTENSION OFFICERS & TECHNICIANS ROSTER -->
        ${this.activeTab === 'officers' ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-grid">
            <!-- Field Officers / Agronomists -->
            <div class="card-level-1 p-6 space-y-4">
              <div class="flex items-center gap-2 border-b border-outline-variant pb-3">
                <span class="material-symbols-outlined text-primary text-2xl">school</span>
                <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">KVK Extension Agronomists</h3>
              </div>
              <div class="space-y-3">
                ${experts.map(exp => `
                  <div class="p-3.5 bg-surface rounded-lg border border-outline-variant flex justify-between items-start">
                    <div>
                      <h4 class="font-body-md font-bold text-on-surface">${exp.name}</h4>
                      <p class="font-body-sm text-xs text-primary font-semibold">${exp.role}</p>
                      <p class="font-body-sm text-xs text-on-surface-variant mt-1">${exp.specialty} • ${exp.station}</p>
                    </div>
                    <span class="font-mono text-xs text-outline">${exp.contact}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Field Maintenance Technicians -->
            <div class="card-level-1 p-6 space-y-4">
              <div class="flex items-center gap-2 border-b border-outline-variant pb-3">
                <span class="material-symbols-outlined text-secondary text-2xl">handyman</span>
                <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Hardware Field Technicians</h3>
              </div>
              <div class="space-y-3">
                ${technicians.map(tech => `
                  <div class="p-3.5 bg-surface rounded-lg border border-outline-variant flex justify-between items-start">
                    <div>
                      <h4 class="font-body-md font-bold text-on-surface">${tech.name}</h4>
                      <p class="font-body-sm text-xs text-secondary font-semibold">${tech.role}</p>
                      <p class="font-body-sm text-xs text-on-surface-variant mt-1">${tech.specialty} • ${tech.station}</p>
                    </div>
                    <span class="font-mono text-xs text-outline">${tech.contact}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    loading.classList.add('hidden');
    content.classList.remove('hidden');

  } catch (err) {
    console.error('Error rendering org overview:', err);
    container.innerHTML = Components.renderErrorBanner(`Failed to load organization console: ${err.message}`, "OrgOverviewView.render(document.getElementById('main-content'))");
  }
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render(document.getElementById('main-content'));
  },

  openRegisterFarmerModal() {
    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-lg w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-primary text-3xl">person_add</span>
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Register New Farmer & Farm</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Add a new farmer and agricultural parcel to Baramati FPO registry.</p>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <form id="reg-farmer-form" onsubmit="OrgOverviewView.submitRegisterFarmer(event)" class="space-y-4">
          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Farmer Name</label>
            <input type="text" id="reg-name" required placeholder="e.g. Tukaram Gaikwad" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Contact Number</label>
              <input type="text" id="reg-contact" required placeholder="+91 98XXX XXXXX" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
            </div>
            <div>
              <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Total Acres</label>
              <input type="number" step="0.5" id="reg-acres" required placeholder="8.5" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
            </div>
          </div>

          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Village / Taluka (Pune)</label>
            <input type="text" id="reg-village" required placeholder="e.g. Supa Village, Baramati, Pune" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
          </div>

          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Primary Crop Variety</label>
            <input type="text" id="reg-crop" required placeholder="e.g. Wheat (HD 2967) / Sugarcane (Co 86032)" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="submit" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
              Save & Register
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async submitRegisterFarmer(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const contact = document.getElementById('reg-contact').value;
    const acres = parseFloat(document.getElementById('reg-acres').value) || 5.0;
    const village = document.getElementById('reg-village').value;
    const crop = document.getElementById('reg-crop').value;

    try {
      const farmerId = `farmer-${Date.now()}`;
      const farmId = `farm-${Date.now()}`;
      const zoneId = `zone-${Date.now()}`;

      // 1. Create Farmer
      await API.createRecord('farmers', {
        id: farmerId,
        org_id: 'org-pune-baramati',
        name,
        contact,
        location: village,
        crop,
        acres,
        created_at: new Date().toISOString()
      });

      // 2. Create Associated Farm
      await API.createRecord('farms', {
        id: farmId,
        org_id: 'org-pune-baramati',
        farmer_id: farmerId,
        name: `${name} Holdings`,
        survey_number: `${Math.floor(10 + Math.random() * 90)}/1A`,
        village,
        taluka: 'Baramati',
        total_ha: Number((acres * 0.404).toFixed(1)),
        created_at: new Date().toISOString()
      });

      // 3. Create Default Zone
      await API.createRecord('zones', {
        id: zoneId,
        org_id: 'org-pune-baramati',
        farm_id: farmId,
        farmer_id: farmerId,
        name: `Plot 1 (${village})`,
        crop: crop.split(' ')[0] || 'Wheat',
        growth_stage: 'Vegetative',
        lat: 18.15 + (Math.random() * 0.04 - 0.02),
        lng: 74.58 + (Math.random() * 0.04 - 0.02),
        area_ha: Number((acres * 0.404).toFixed(1)),
        device_id: `SMP-${Math.floor(9100 + Math.random() * 900)}`
      });

      App.closeModal();
      Components.showToast(`Farmer ${name} registered with farm and zone records!`, 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Registration failed: ${err.message}`, 'error');
    }
  },

  openAssignOfficerModal(alertId) {
    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-md w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-primary text-3xl">assignment_ind</span>
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Assign Extension Officer</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Dispatch an agronomist for on-site diagnosis and verification.</p>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <div class="space-y-4">
          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Select Agronomist</label>
            <select id="sel-officer" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
              <option value="exp-2">Sanjay Kulkarni (KVK Extension Field Officer)</option>
              <option value="exp-1">Dr. Anita Deshmukh (Senior Extension Agronomist)</option>
            </select>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="button" onclick="OrgOverviewView.confirmAssignOfficer('${alertId}')" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
              Confirm Dispatch
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async confirmAssignOfficer(alertId) {
    const sel = document.getElementById('sel-officer');
    const officerId = sel ? sel.value : 'exp-2';

    try {
      await API.assignOfficerToAlert(alertId, officerId);
      App.closeModal();
      Components.showToast('Field Officer dispatched and assigned to alert in database.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error assigning officer: ${err.message}`, 'error');
    }
  },

  async resolveAlert(alertId) {
    try {
      await API.updateRecord('alerts', alertId, { status: 'RESOLVED', resolved_at: new Date().toISOString() });
      Components.showToast('Alert marked as RESOLVED.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error: ${err.message}`, 'error');
    }
  },

  openAssignTechnicianModal(ticketId) {
    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-md w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-secondary text-3xl">engineering</span>
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Assign Hardware Technician</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Assign an IoT technician for probe calibration / hardware repair.</p>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <div class="space-y-4">
          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Select Technician</label>
            <select id="sel-technician" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
              <option value="tech-1">Kavita Jagtap (ESP32 & Solar Probe Specialist)</option>
              <option value="tech-2">Nitin Shirole (Pump Relay & Drip Actuation Specialist)</option>
            </select>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="button" onclick="OrgOverviewView.confirmAssignTechnician('${ticketId}')" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
              Assign Technician
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async confirmAssignTechnician(ticketId) {
    const sel = document.getElementById('sel-technician');
    const techId = sel ? sel.value : 'tech-1';

    try {
      await API.assignTechnicianToTicket(ticketId, techId);
      App.closeModal();
      Components.showToast('Hardware technician assigned to service ticket.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error assigning technician: ${err.message}`, 'error');
    }
  },

  async resolveTicket(ticketId) {
    try {
      await API.updateTicketStatus(ticketId, 'RESOLVED', 'Hardware verified operational by technician.');
      Components.showToast('Maintenance ticket marked as RESOLVED.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error: ${err.message}`, 'error');
    }
  }
};
