// View: Organization / FPO Operations & Analytics Console
// Service Region: Baramati Taluka, Pune District, Maharashtra (18.15° N, 74.58° E)

const OrgOverviewView = {
  activeSection: 'overview', // 'overview' | 'map' | 'farmers' | 'crops' | 'surveillance' | 'priority' | 'field-ops' | 'devices' | 'maintenance' | 'water' | 'outcomes' | 'villages' | 'reports'
  filterCrop: 'ALL',
  filterVillage: 'ALL',
  selectedDrilldown: null, // { type: 'farmer'|'farm'|'zone'|'case', id: string, data: object }

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div id="org-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
          <div class="h-96 w-full skeleton rounded-xl"></div>
        </div>
        <div id="org-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [analyticsRes, hotspotsRes, farmersRes, farmsRes, zonesRes, devicesRes, alertsRes, ticketsRes, expertsRes, techniciansRes, predictionsRes] = await Promise.all([
        API.getOrgAnalytics(),
        API.getHotspots(),
        API.getTable('farmers'),
        API.getTable('farms'),
        API.getTable('zones'),
        API.getTable('devices'),
        API.getTable('alerts'),
        API.getTable('maintenance_tickets'),
        API.getTable('experts'),
        API.getTable('technicians'),
        API.getTable('vision_predictions')
      ]);

      const analytics = analyticsRes.analytics || {};
      const kpis = analytics.kpis || {
        total_farmers: 4,
        total_farms: 4,
        total_zones: 7,
        total_devices: 7,
        total_hectares: 14.6,
        online_devices: 7,
        offline_devices: 0,
        stale_devices: 0,
        active_high_risk_cases: 2,
        open_maintenance_tickets: 1
      };

      const org = analytics.organization || {
        name: "Baramati Taluka Kisan Vikas FPO",
        taluka: "Baramati",
        district: "Pune"
      };

      const health = analytics.regional_health || { healthy: 68, watch: 19, atRisk: 9, critical: 4 };
      const cropIntel = analytics.crop_intelligence || [];
      const surveillance = analytics.surveillance_risks || [];
      const priorityActions = analytics.priority_actions || [];
      const fieldOps = analytics.field_operations || [];
      const techWorkload = analytics.technician_workload || [];
      const waterMgmt = analytics.water_management || {};
      const outcomes = analytics.intervention_outcomes || {};
      const villageData = analytics.village_analytics || [];
      const orgAlerts = analytics.organization_alerts || [];

      const hotspots = hotspotsRes.hotspots || [];
      const plots = hotspotsRes.all_plots || [];
      const farmers = farmersRes.data || [];
      const farms = farmsRes.data || [];
      const zones = zonesRes.data || [];
      const devices = devicesRes.data || [];
      const tickets = ticketsRes.data || [];

      const content = document.getElementById('org-content');
      const loading = document.getElementById('org-loading');

      content.innerHTML = `
        <!-- Top Operations Console Header -->
        <header class="bg-surface rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5 mb-1.5">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-surface uppercase tracking-wider">FPO OPERATIONAL PLATFORM</span>
              <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary-container text-on-secondary-container">REGION: BARAMATI, PUNE</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffdcb9] text-[#783900] font-bold">DEMO DATA</span>
            </div>
            <h1 class="font-display-md text-2xl font-bold font-fraunces text-on-surface leading-tight">${org.name}</h1>
            <p class="font-body-md text-xs text-on-surface-variant mt-1">
              Agronomic Coordination, Pathology Surveillance & Technical Service Center for Baramati Taluka, Pune District (18.15° N, 74.58° E).
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap gap-2.5">
            <button onclick="OrgOverviewView.openRegisterFarmerModal()" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm">
              <span class="material-symbols-outlined text-base">person_add</span> Register Farmer
            </button>
            <button onclick="App.navigate('review-queue')" class="px-4 py-2 border border-primary text-primary bg-surface rounded-lg font-label-caps text-xs font-bold flex items-center gap-1.5 hover:bg-surface-container-high transition-colors">
              <span class="material-symbols-outlined text-base">biotech</span> Review Queue (${predictionsRes.data ? predictionsRes.data.filter(p => p.status === 'PENDING_REVIEW').length : 0})
            </button>
            <button onclick="OrgOverviewView.exportReport()" class="px-3.5 py-2 border border-outline-variant text-outline bg-surface rounded-lg font-label-caps text-xs font-bold flex items-center gap-1.5 hover:text-on-surface hover:bg-surface-container-high transition-colors">
              <span class="material-symbols-outlined text-base">summarize</span> Export Brief
            </button>
          </div>
        </header>

        <!-- Top KPI Cards (Strictly Data-Driven) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Farmers Managed -->
          <div class="card-level-1 card-spine-primary p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Total Farmers</span>
              <span class="material-symbols-outlined text-primary text-xl">groups</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">${kpis.total_farmers}</span>
              <span class="text-xs text-outline font-body-sm font-medium">Registered</span>
            </div>
            <span class="text-[10px] font-mono text-outline">[DATABASE RELATIONS]</span>
          </div>

          <!-- Active Monitored Farms -->
          <div class="card-level-1 card-spine-primary p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Active Farms</span>
              <span class="material-symbols-outlined text-primary text-xl">agriculture</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">${kpis.total_farms}</span>
              <span class="text-xs text-outline font-body-sm font-medium">(${kpis.total_hectares} Ha Covered)</span>
            </div>
            <span class="text-[10px] font-mono text-outline">[PARCELS / SURVEY NOS]</span>
          </div>

          <!-- Connected IoT Devices -->
          <div class="card-level-1 card-spine-success p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Connected Devices</span>
              <span class="material-symbols-outlined text-primary text-xl">sensors</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-primary">${kpis.online_devices}</span>
              <span class="text-xs text-outline font-body-sm font-medium">/ ${kpis.total_devices} Online</span>
            </div>
            <span class="text-[10px] font-mono text-outline">[ESP32 & PROBES]</span>
          </div>

          <!-- Active High-Risk Cases -->
          <div class="card-level-1 card-spine-danger p-5 relative overflow-hidden flex flex-col justify-between h-32">
            <div class="flex justify-between items-start">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">High-Risk Cases</span>
              <span class="material-symbols-outlined text-error text-xl" style="font-variation-settings: 'FILL' 1;">warning</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-data-lg text-3xl font-bold font-mono text-error">${kpis.active_high_risk_cases}</span>
              <span class="text-xs text-error font-body-sm font-medium">Plots Requiring Action</span>
            </div>
            <span class="text-[10px] font-mono text-error">[PATHOLOGY / WATER]</span>
          </div>
        </div>

        <!-- Higher-Level Organization Emergency Alerts Banner -->
        ${orgAlerts.length > 0 ? `
          <div class="space-y-2.5">
            <div class="font-label-caps text-xs text-outline uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-error" style="font-variation-settings: 'FILL' 1;">campaign</span>
              Organization Operations Alerts
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${orgAlerts.map(oa => `
                <div class="p-4 rounded-xl border ${oa.severity === 'CRITICAL' ? 'bg-error-container/30 border-error/40 text-on-surface' : 'bg-secondary-container/30 border-secondary/40 text-on-surface'} flex items-start justify-between gap-3 shadow-sm">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${oa.severity === 'CRITICAL' ? 'bg-error text-surface' : 'bg-secondary text-surface'}">${oa.severity}</span>
                      <h4 class="font-body-md font-bold text-sm text-on-surface">${oa.title}</h4>
                    </div>
                    <p class="font-body-sm text-xs text-on-surface-variant">${oa.description}</p>
                    <div class="text-[11px] font-mono text-primary font-semibold flex items-center gap-1 mt-1">
                      <span class="material-symbols-outlined text-sm">arrow_forward</span> ${oa.action_required}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Organization Navigation Segmented Bar -->
        <div class="border-b border-outline-variant pb-2 overflow-x-auto flex gap-1.5 select-none">
          <button onclick="OrgOverviewView.setSection('overview')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'overview' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Regional Overview
          </button>
          <button onclick="OrgOverviewView.setSection('map')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${this.activeSection === 'map' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            <span class="material-symbols-outlined text-sm">hub</span> Hotspot Map (${hotspots.length})
          </button>
          <button onclick="OrgOverviewView.setSection('crops')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'crops' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Crop Intelligence (${cropIntel.length})
          </button>
          <button onclick="OrgOverviewView.setSection('surveillance')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'surveillance' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Disease & Pest Surveillance (${surveillance.length})
          </button>
          <button onclick="OrgOverviewView.setSection('priority')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'priority' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Priority Action Center (${priorityActions.length})
          </button>
          <button onclick="OrgOverviewView.setSection('field-ops')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'field-ops' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Field Officers (${fieldOps.length})
          </button>
          <button onclick="OrgOverviewView.setSection('farmers')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'farmers' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Farmers & Parcels (${farmers.length})
          </button>
          <button onclick="OrgOverviewView.setSection('devices')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'devices' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Device Health (${devices.length})
          </button>
          <button onclick="OrgOverviewView.setSection('maintenance')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'maintenance' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Maintenance & Techs (${tickets.length})
          </button>
          <button onclick="OrgOverviewView.setSection('water')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'water' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Water Management
          </button>
          <button onclick="OrgOverviewView.setSection('outcomes')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'outcomes' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Intervention Outcomes
          </button>
          <button onclick="OrgOverviewView.setSection('villages')" class="px-4 py-2 rounded-lg font-label-caps text-xs font-bold transition-all whitespace-nowrap ${this.activeSection === 'villages' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}">
            Service Areas (${villageData.length})
          </button>
        </div>

        <!-- SECTION RENDER DISPATCH -->
        <div id="org-section-container" class="space-y-6">
          ${this.renderActiveSection({
            kpis, health, cropIntel, surveillance, priorityActions, fieldOps, techWorkload,
            waterMgmt, outcomes, villageData, hotspots, plots, farmers, farms, zones, devices, tickets
          })}
        </div>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering organization console:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load organization console: ${err.message}`, "OrgOverviewView.render(document.getElementById('main-content'))");
    }
  },

  renderActiveSection(data) {
    switch (this.activeSection) {
      case 'overview':
        return this.renderRegionalOverview(data);
      case 'map':
        return this.renderRegionalMapSection(data);
      case 'crops':
        return this.renderCropIntelligenceSection(data);
      case 'surveillance':
        return this.renderSurveillanceSection(data);
      case 'priority':
        return this.renderPriorityActionCenter(data);
      case 'field-ops':
        return this.renderFieldOperationsSection(data);
      case 'farmers':
        return this.renderFarmersRegistrySection(data);
      case 'devices':
        return this.renderDeviceHealthSection(data);
      case 'maintenance':
        return this.renderMaintenanceSection(data);
      case 'water':
        return this.renderWaterManagementSection(data);
      case 'outcomes':
        return this.renderInterventionOutcomesSection(data);
      case 'villages':
        return this.renderVillageAnalyticsSection(data);
      default:
        return this.renderRegionalOverview(data);
    }
  },

  // ================= 1. REGIONAL OVERVIEW & HEALTH SUMMARY =================
  renderRegionalOverview({ health, cropIntel, surveillance, priorityActions, villageData }) {
    return `
      <!-- Regional Crop Health Bar -->
      <section class="card-level-1 p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Regional Agricultural Health</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Aggregate vitality across all monitored plots in Baramati Taluka.</p>
          </div>
          <div class="text-xs font-mono text-outline">[POPULATION COHORT: ${health.healthy + health.watch + health.atRisk + health.critical}%]</div>
        </div>

        <div class="grid grid-cols-4 gap-2 text-center">
          <div class="p-3 bg-surface rounded-lg border border-outline-variant">
            <span class="font-data-lg text-2xl font-bold font-mono text-primary">${health.healthy}%</span>
            <span class="block text-[11px] font-label-caps uppercase font-bold text-outline mt-0.5">Healthy</span>
          </div>
          <div class="p-3 bg-surface rounded-lg border border-outline-variant">
            <span class="font-data-lg text-2xl font-bold font-mono text-secondary">${health.watch}%</span>
            <span class="block text-[11px] font-label-caps uppercase font-bold text-outline mt-0.5">Watch</span>
          </div>
          <div class="p-3 bg-surface rounded-lg border border-outline-variant">
            <span class="font-data-lg text-2xl font-bold font-mono text-amber-600">${health.atRisk}%</span>
            <span class="block text-[11px] font-label-caps uppercase font-bold text-outline mt-0.5">At Risk</span>
          </div>
          <div class="p-3 bg-surface rounded-lg border border-outline-variant">
            <span class="font-data-lg text-2xl font-bold font-mono text-error">${health.critical}%</span>
            <span class="block text-[11px] font-label-caps uppercase font-bold text-outline mt-0.5">Critical</span>
          </div>
        </div>

        <!-- Stacked Visual Bar -->
        <div class="w-full h-4 bg-surface-container rounded-full overflow-hidden flex shadow-inner">
          <div class="bg-primary h-full transition-all duration-700" style="width: ${health.healthy}%;" title="Healthy: ${health.healthy}%"></div>
          <div class="bg-secondary h-full transition-all duration-700" style="width: ${health.watch}%;" title="Watch: ${health.watch}%"></div>
          <div class="bg-amber-500 h-full transition-all duration-700" style="width: ${health.atRisk}%;" title="At Risk: ${health.atRisk}%"></div>
          <div class="bg-error h-full transition-all duration-700" style="width: ${health.critical}%;" title="Critical: ${health.critical}%"></div>
        </div>
      </section>

      <!-- Grid of Top Operations Highlights -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Top Current Surveillance Threats -->
        <div class="card-level-1 p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-error">coronavirus</span>
              <h3 class="font-headline-sm text-base font-fraunces text-on-surface">Top Pathology Surveillance Threats</h3>
            </div>
            <button onclick="OrgOverviewView.setSection('surveillance')" class="text-primary font-label-caps text-xs font-bold hover:underline">View All</button>
          </div>
          <div class="space-y-2.5">
            ${surveillance.slice(0, 3).map(item => `
              <div class="p-3 bg-surface rounded-lg border border-outline-variant flex justify-between items-center">
                <div>
                  <h4 class="font-body-md font-bold text-sm text-on-surface">${item.name}</h4>
                  <p class="font-body-sm text-xs text-on-surface-variant">${item.cases_count} cases across ${item.farmers_count} farmers</p>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-error text-surface">${item.severity}</span>
                  <span class="block text-[11px] font-mono font-bold text-error mt-0.5">${item.trend}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Priority Immediate Interventions -->
        <div class="card-level-1 p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">assignment_late</span>
              <h3 class="font-headline-sm text-base font-fraunces text-on-surface">Urgent Field Interventions</h3>
            </div>
            <button onclick="OrgOverviewView.setSection('priority')" class="text-primary font-label-caps text-xs font-bold hover:underline">Action Center</button>
          </div>
          <div class="space-y-2.5">
            ${priorityActions.slice(0, 3).map(alt => `
              <div class="p-3 bg-surface rounded-lg border border-outline-variant flex justify-between items-center">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${alt.severity === 'CRITICAL' ? 'bg-error text-surface' : 'bg-secondary text-surface'}">${alt.severity}</span>
                    <h4 class="font-body-md font-bold text-sm text-on-surface">${alt.problem}</h4>
                  </div>
                  <p class="font-body-sm text-xs text-on-surface-variant mt-0.5">${alt.farmer_name} • ${alt.zone_name} (${alt.crop})</p>
                </div>
                <button onclick="OrgOverviewView.openAssignOfficerModal('${alt.alert_id}')" class="px-3 py-1.5 bg-primary text-surface rounded text-xs font-label-caps font-bold hover:opacity-90">
                  Assign
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ================= 2. REGIONAL RISK MAP (FLAGSHIP) =================
  renderRegionalMapSection({ hotspots, plots }) {
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

    return `
      <div class="space-y-4">
        <div class="flex justify-between items-end">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Regional Risk Map & Spatial Hotspots</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Live geospatial distribution of all managed farmer parcels across Baramati Taluka.</p>
          </div>
          <span class="font-mono text-xs text-outline">${plots.length} Monitored Plots • ${hotspots.length} Active Hotspot Clusters</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 card-level-1 relative overflow-hidden h-[540px] border border-outline-variant bg-[#1a2218] rounded-xl flex flex-col justify-between p-4 shadow-inner">
            <div class="absolute inset-0 opacity-25 pointer-events-none" style="background-image: linear-gradient(#4b6043 1px, transparent 1px), linear-gradient(to right, #4b6043 1px, #1a2218 1px); background-size: 40px 40px;"></div>
            
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

            <!-- Hotspot Rings -->
            ${hotspots.map(hs => {
              const pos = projectCoord(hs.center_lat, hs.center_lng);
              const isDisease = hs.category === 'Disease';
              const ringColor = isDisease ? 'rgba(186, 26, 26, 0.35)' : 'rgba(217, 119, 6, 0.35)';
              const borderColor = isDisease ? '#ba1a1a' : '#d97706';
              return `
                <div onclick="OrgOverviewView.drilldownHotspot('${hs.id}')"
                  class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-transform hover:scale-105 z-10 flex items-center justify-center group"
                  style="left: ${pos.left}%; top: ${pos.top}%; width: 140px; height: 140px; background-color: ${ringColor}; border: 2px dashed ${borderColor};">
                  <div class="bg-surface/90 text-on-surface px-2.5 py-1 rounded text-[11px] font-mono font-bold shadow-md border border-outline-variant text-center pointer-events-none">
                    ${hs.name}
                    <div class="text-[9px] text-error">${hs.farmer_count} Farmers • ${hs.avg_confidence}% Conf</div>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Individual Plots -->
            ${plots.map(p => {
              const pos = projectCoord(p.lat, p.lng);
              let colorClass = 'bg-primary border-surface text-surface';
              if (p.markerColor === 'red') colorClass = 'bg-error border-surface text-surface animate-ping-slow';
              else if (p.markerColor === 'orange') colorClass = 'bg-secondary border-surface text-surface';
              else if (p.markerColor === 'blue') colorClass = 'bg-blue-600 border-surface text-surface';

              return `
                <div onclick="OrgOverviewView.drilldownPlot('${p.zone_id}')"
                  class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  style="left: ${pos.left}%; top: ${pos.top}%;">
                  <div class="w-7 h-7 rounded-full ${colorClass} border-2 flex items-center justify-center font-bold text-[11px] shadow-lg group-hover:scale-125 transition-transform">
                    ${p.category === 'Disease' ? '🦠' : (p.category === 'Pest' ? '🐛' : (p.category === 'Water Stress' ? '💧' : '🌱'))}
                  </div>
                </div>
              `;
            }).join('')}

            <div class="mt-auto bg-surface/90 backdrop-blur-sm p-3 rounded-lg border border-outline-variant flex flex-wrap items-center justify-between gap-3 z-30 font-body-sm text-xs">
              <div class="flex items-center gap-4 font-mono">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-error"></span> Disease</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-secondary"></span> Pest</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Water Stress</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-primary"></span> Healthy</span>
              </div>
              <span class="text-[10px] font-mono text-outline">[HAVERSINE SPATIAL DISTANCE: 2.5 KM]</span>
            </div>
          </div>

          <!-- Hotspot / Drilldown Details Sidebar -->
          <div class="card-level-1 p-6 space-y-4 flex flex-col justify-between h-[540px] overflow-y-auto">
            ${this.renderMapDrilldownSidebar(hotspots, plots)}
          </div>
        </div>
      </div>
    `;
  },

  renderMapDrilldownSidebar(hotspots, plots) {
    if (this.selectedDrilldown && this.selectedDrilldown.type === 'plot') {
      const p = plots.find(item => item.zone_id === this.selectedDrilldown.id);
      if (p) {
        return `
          <div class="space-y-4">
            <div class="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${p.category !== 'Healthy' ? 'bg-error text-surface' : 'bg-primary-container text-on-primary-container'} uppercase">
                  ${p.category}
                </span>
                <h3 class="font-headline-sm text-lg font-fraunces text-on-surface mt-1">${p.zone_name}</h3>
                <p class="font-body-sm text-xs text-on-surface-variant">${p.farm_name} (${p.survey_number})</p>
              </div>
              <button onclick="OrgOverviewView.clearDrilldown()" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div class="space-y-2.5 text-xs font-body-sm">
              <div class="p-3 bg-surface rounded-lg border border-outline-variant space-y-1">
                <span class="font-label-caps text-[10px] text-outline uppercase font-bold">Diagnosed Problem</span>
                <div class="font-bold text-sm ${p.category !== 'Healthy' ? 'text-error' : 'text-primary'}">${p.problem}</div>
                <div class="font-mono text-outline">Confidence: ${p.confidence}% • Severity: ${p.severity}</div>
              </div>
              <div class="p-2.5 bg-surface rounded border border-outline-variant">
                <span class="text-outline block text-[10px] uppercase font-bold">Farmer</span>
                <span class="font-semibold text-on-surface">${p.farmer_name} (${p.farmer_location})</span>
              </div>
              <div class="p-2.5 bg-surface rounded border border-outline-variant">
                <span class="text-outline block text-[10px] uppercase font-bold">Crop & Growth Phase</span>
                <span class="font-semibold text-on-surface">${p.crop} (${p.growth_stage})</span>
              </div>
            </div>
          </div>

          <div class="space-y-2 pt-4 border-t border-outline-variant">
            <button onclick="OrgOverviewView.openAssignOfficerModalForPlot('${p.zone_id}')" class="w-full py-2.5 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-base">assignment_ind</span> Dispatch Field Officer
            </button>
          </div>
        `;
      }
    }

    const hs = (this.selectedDrilldown && this.selectedDrilldown.type === 'hotspot')
      ? hotspots.find(h => h.id === this.selectedDrilldown.id)
      : hotspots[0];

    if (hs) {
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

          <div>
            <div class="font-label-caps text-xs text-outline uppercase font-bold mb-2">Affected Farmer Records</div>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              ${hs.affected_farmers.map(f => `
                <div class="p-2.5 bg-surface rounded border border-outline-variant text-xs flex justify-between items-center">
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
          <button onclick="OrgOverviewView.dispatchOfficerToHotspot('${hs.id}')" class="w-full py-2.5 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-base">assignment_ind</span> Dispatch Field Officer to Cluster
          </button>
        </div>
      `;
    }

    return `
      <div class="flex flex-col items-center justify-center h-full text-center p-6 text-outline space-y-2">
        <span class="material-symbols-outlined text-4xl text-primary">check_circle</span>
        <h4 class="font-headline-sm font-fraunces text-on-surface">No Active Hotspots</h4>
        <p class="font-body-sm text-xs">All monitored canopies are currently in healthy balance.</p>
      </div>
    `;
  },

  // ================= 3. CROP INTELLIGENCE SECTION =================
  renderCropIntelligenceSection({ cropIntel }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Crop-Wise Intelligence & Portfolio Risks</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Breakdown of health, disease, pest, and water stress risk across crops.</p>
          </div>
          <span class="font-mono text-xs text-outline">${cropIntel.length} Crop Portfolios</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${cropIntel.map(c => `
            <div class="card-level-1 p-5 space-y-4">
              <div class="flex justify-between items-start border-b border-outline-variant pb-2.5">
                <div>
                  <h4 class="font-headline-sm text-base font-bold font-fraunces text-on-surface">${c.crop}</h4>
                  <p class="font-body-sm text-xs text-on-surface-variant">${c.farmer_count} Farmers • ${c.total_ha} Hectares</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-variant text-on-surface">${c.zones_count} Zones</span>
              </div>

              <!-- Risk Breakdown Bars -->
              <div class="space-y-2 text-xs font-body-sm">
                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary"></span> Healthy</span>
                  <span class="font-mono font-bold">${c.healthy_pct}%</span>
                </div>
                <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div class="bg-primary h-full" style="width: ${c.healthy_pct}%;"></div>
                </div>

                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-error"></span> Disease Risk</span>
                  <span class="font-mono font-bold text-error">${c.disease_risk_pct}%</span>
                </div>
                <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div class="bg-error h-full" style="width: ${c.disease_risk_pct}%;"></div>
                </div>

                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-secondary"></span> Pest Risk</span>
                  <span class="font-mono font-bold text-secondary">${c.pest_risk_pct}%</span>
                </div>
                <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div class="bg-secondary h-full" style="width: ${c.pest_risk_pct}%;"></div>
                </div>

                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-600"></span> Water Stress</span>
                  <span class="font-mono font-bold text-blue-600">${c.water_stress_pct}%</span>
                </div>
                <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-full" style="width: ${c.water_stress_pct}%;"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ================= 4. DISEASE & PEST SURVEILLANCE =================
  renderSurveillanceSection({ surveillance }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Regional Disease & Pest Surveillance Hub</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Epidemiological monitoring of crop pathogens, vector insects, and emerging outbreaks.</p>
          </div>
          <span class="px-2.5 py-1 rounded text-xs font-mono font-bold bg-error-container text-on-error-container">ACTIVE SURVEILLANCE</span>
        </div>

        <div class="card-level-1 overflow-hidden">
          <table class="w-full text-left font-body-sm text-on-surface">
            <thead class="bg-surface-container border-b border-outline-variant font-label-caps text-outline uppercase text-xs">
              <tr>
                <th class="p-4">Pathogen / Vector Problem</th>
                <th class="p-4">Classification</th>
                <th class="p-4">Total Cases</th>
                <th class="p-4">Affected Farmers</th>
                <th class="p-4">Severity</th>
                <th class="p-4">Epidemic Trend</th>
                <th class="p-4">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${surveillance.map(s => `
                <tr class="hover:bg-surface-container-low transition-colors">
                  <td class="p-4 font-bold font-fraunces text-sm">${s.name}</td>
                  <td class="p-4">
                    <span class="px-2 py-0.5 rounded text-xs font-label-caps ${s.category === 'Disease' ? 'bg-error text-surface' : 'bg-secondary text-surface'}">
                      ${s.category}
                    </span>
                  </td>
                  <td class="p-4 font-mono font-bold">${s.cases_count}</td>
                  <td class="p-4 font-mono">${s.farmers_count}</td>
                  <td class="p-4 font-bold text-xs ${s.severity === 'High' ? 'text-error' : 'text-secondary'}">${s.severity}</td>
                  <td class="p-4 font-mono font-bold ${s.trend.includes('↑') ? 'text-error' : 'text-primary'}">${s.trend}</td>
                  <td class="p-4">
                    <button onclick="OrgOverviewView.setSection('map')" class="px-3 py-1 bg-surface border border-outline-variant rounded text-xs font-label-caps hover:bg-surface-container-high">
                      View Hotspot
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ================= 5. PRIORITY ACTION CENTER =================
  renderPriorityActionCenter({ priorityActions }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Priority Action Center & Triage</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Ranked operational alert triage sorted by urgency and crop vulnerability.</p>
          </div>
          <span class="font-mono text-xs text-outline">${priorityActions.length} Pending Actions</span>
        </div>

        <div class="space-y-3">
          ${priorityActions.map(alt => {
            const isCritical = alt.severity === 'CRITICAL';
            return `
              <div class="card-level-1 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-low transition-colors">
                <div class="flex items-start gap-3.5">
                  <span class="material-symbols-outlined ${isCritical ? 'text-error' : 'text-secondary'} text-2xl mt-0.5" style="font-variation-settings: 'FILL' 1;">
                    ${alt.problem_type === 'DISEASE' ? 'coronavirus' : (alt.problem_type === 'WATER_STRESS' ? 'water_drop' : 'bug_report')}
                  </span>
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isCritical ? 'bg-error text-surface' : 'bg-secondary text-surface'}">
                        PRIORITY ${alt.urgency_rank} • ${alt.severity}
                      </span>
                      <h4 class="font-body-md font-bold text-on-surface">${alt.problem}</h4>
                    </div>
                    <p class="font-body-sm text-xs text-on-surface-variant">
                      Farmer: <span class="font-semibold text-on-surface">${alt.farmer_name}</span> • Zone: <span class="font-semibold text-on-surface">${alt.zone_name}</span> (${alt.crop}) • Location: ${alt.farmer_location}
                    </p>
                    ${alt.assigned_officer_name ? `
                      <p class="font-body-sm text-xs text-primary font-semibold mt-1">
                        <span class="material-symbols-outlined text-xs">assignment_ind</span> Assigned: ${alt.assigned_officer_name}
                      </p>
                    ` : ''}
                  </div>
                </div>

                <div class="flex gap-2 shrink-0 self-end md:self-center">
                  <button onclick="OrgOverviewView.openAssignOfficerModal('${alt.alert_id}')" class="px-4 py-2 border border-primary text-primary bg-surface rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container-highest transition-colors">
                    Assign Field Officer
                  </button>
                  <button onclick="OrgOverviewView.resolveAlert('${alt.alert_id}')" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 transition-opacity">
                    Mark Resolved
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ================= 6. FIELD OPERATIONS & OFFICERS =================
  renderFieldOperationsSection({ fieldOps }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Extension Field Officers & Agronomists</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Dispatch management and field deployment roster for KVK Baramati.</p>
          </div>
          <span class="font-mono text-xs text-outline">${fieldOps.length} Active Officers</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${fieldOps.map(exp => `
            <div class="card-level-1 p-6 space-y-4">
              <div class="flex justify-between items-start border-b border-outline-variant pb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                    ${exp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 class="font-body-md font-bold text-on-surface">${exp.name}</h4>
                    <p class="font-body-sm text-xs text-primary font-semibold">${exp.role}</p>
                  </div>
                </div>
                <span class="font-mono text-xs text-outline">${exp.contact}</span>
              </div>

              <div class="space-y-1.5 text-xs text-on-surface-variant">
                <p><strong>Specialty:</strong> ${exp.specialty}</p>
                <p><strong>Station Desk:</strong> ${exp.station}</p>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center pt-2 border-t border-outline-variant">
                <div class="p-2 bg-surface rounded">
                  <span class="font-data-lg text-base font-bold font-mono text-on-surface">${exp.assigned_total}</span>
                  <span class="block text-[10px] text-outline uppercase font-bold">Assigned</span>
                </div>
                <div class="p-2 bg-surface rounded">
                  <span class="font-data-lg text-base font-bold font-mono text-secondary">${exp.pending_visits}</span>
                  <span class="block text-[10px] text-outline uppercase font-bold">Pending</span>
                </div>
                <div class="p-2 bg-surface rounded">
                  <span class="font-data-lg text-base font-bold font-mono text-primary">${exp.completed_visits}</span>
                  <span class="block text-[10px] text-outline uppercase font-bold">Completed</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ================= 7. FARMERS & PARCELS REGISTRY =================
  renderFarmersRegistrySection({ farmers, farms, zones }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Registered Farmers & Agricultural Parcels</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Hierarchical registry linking farmers to farms, zones, and IoT nodes.</p>
          </div>
          <button onclick="OrgOverviewView.openRegisterFarmerModal()" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90">
            + Add Farmer
          </button>
        </div>

        <div class="card-level-1 overflow-hidden">
          <table class="w-full text-left font-body-sm text-on-surface">
            <thead class="bg-surface-container border-b border-outline-variant font-label-caps text-outline uppercase text-xs">
              <tr>
                <th class="p-4">Farmer</th>
                <th class="p-4">Village / Location</th>
                <th class="p-4">Primary Crop</th>
                <th class="p-4">Acreage</th>
                <th class="p-4">Holdings & Zones</th>
                <th class="p-4">Contact</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${farmers.map(f => {
                const farmerFarms = farms.filter(item => item.farmer_id === f.id);
                const farmerZones = zones.filter(item => item.farmer_id === f.id);
                return `
                  <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="p-4 font-bold font-fraunces text-sm">${f.name}</td>
                    <td class="p-4 text-on-surface-variant">${f.location}</td>
                    <td class="p-4"><span class="px-2 py-0.5 rounded text-xs bg-surface-variant">${f.crop}</span></td>
                    <td class="p-4 font-mono font-bold">${f.acres} Acres</td>
                    <td class="p-4">
                      <div class="space-y-1">
                        ${farmerFarms.map(fm => `<div class="text-xs font-semibold text-primary">${fm.name} (${fm.survey_number})</div>`).join('')}
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
    `;
  },

  // ================= 8. DEVICE HEALTH & SENSORS =================
  renderDeviceHealthSection({ devices, farms, zones }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Organization Hardware Health & Telemetry Liveness</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Real-time status of all deployed ESP32 nodes, probes, and relay actuators.</p>
          </div>
          <span class="font-mono text-xs text-outline">${devices.length} Total Registered Nodes</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${devices.map(d => {
            const z = zones.find(item => item.id === d.zone_id) || { name: 'Zone' };
            const fm = farms.find(item => item.id === d.farm_id) || { name: 'Farm' };
            return `
              <div class="card-level-1 p-4 space-y-3">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-mono font-bold text-sm text-on-surface">${d.id}</h4>
                    <p class="font-body-sm text-xs text-on-surface-variant">${d.type}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${d.status === 'ONLINE' ? 'bg-[#d5ffc1] text-[#245018]' : 'bg-error text-surface'}">
                    ${d.status}
                  </span>
                </div>
                <div class="text-xs space-y-1 font-body-sm">
                  <p><strong>Farm / Zone:</strong> ${fm.name} • ${z.name}</p>
                  <p><strong>Firmware:</strong> ${d.firmware} • Battery: ${d.battery_pct}%</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ================= 9. MAINTENANCE & TECHNICIANS =================
  renderMaintenanceSection({ tickets, techWorkload }) {
    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Hardware Maintenance Center & Field Technicians</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Service requests, probe recalibrations, and pump relay maintenance queue.</p>
          </div>
          <span class="font-mono text-xs text-outline">${tickets.length} Registered Tickets</span>
        </div>

        <!-- Service Tickets Queue -->
        <div class="card-level-1 divide-y divide-outline-variant/60 overflow-hidden">
          ${tickets.map(tkt => {
            const isResolved = tkt.status === 'RESOLVED';
            return `
              <div class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-low transition-colors">
                <div class="flex items-start gap-3.5">
                  <span class="material-symbols-outlined ${isResolved ? 'text-primary' : 'text-secondary'} text-2xl mt-0.5">
                    ${isResolved ? 'check_circle' : 'build'}
                  </span>
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-body-md font-bold text-on-surface">${tkt.issue}</h4>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isResolved ? 'bg-[#d5ffc1] text-[#245018]' : 'bg-secondary text-surface'}">
                        ${tkt.status}
                      </span>
                      <span class="font-mono text-xs text-outline">Device: ${tkt.device_id}</span>
                    </div>
                    <p class="font-body-sm text-xs text-on-surface-variant">${tkt.notes || 'Routine hardware check.'}</p>
                    <p class="font-body-sm text-xs text-primary font-semibold mt-1">
                      Technician Assigned: ${tkt.assigned_technician_name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div class="flex gap-2 shrink-0 self-end md:self-center">
                  ${!isResolved ? `
                    <button onclick="OrgOverviewView.openAssignTechnicianModal('${tkt.id}')" class="px-3 py-1.5 border border-secondary text-secondary bg-surface rounded text-xs font-bold font-label-caps hover:bg-surface-container-high">
                      Assign Tech
                    </button>
                    <button onclick="OrgOverviewView.resolveTicket('${tkt.id}')" class="px-3 py-1.5 bg-primary text-surface rounded text-xs font-bold font-label-caps hover:opacity-90">
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
    `;
  },

  // ================= 10. WATER & IRRIGATION MANAGEMENT =================
  renderWaterManagementSection({ waterMgmt }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Regional Water Management & Irrigation Demand</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Aggregate irrigation volume, soil replenishment, and drip line efficiency across Baramati.</p>
          </div>
          <span class="font-mono text-xs text-outline">Grid Total: ${waterMgmt.total_water_used_liters ? waterMgmt.total_water_used_liters.toLocaleString() : '121,200'} Liters</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card-level-1 p-4 space-y-1">
            <span class="text-xs font-label-caps uppercase text-outline font-bold">Total Cycles</span>
            <div class="font-data-lg text-2xl font-bold font-mono text-on-surface">${waterMgmt.total_irrigation_events || 3}</div>
          </div>
          <div class="card-level-1 p-4 space-y-1">
            <span class="text-xs font-label-caps uppercase text-outline font-bold">Verified Replenishments</span>
            <div class="font-data-lg text-2xl font-bold font-mono text-primary">${waterMgmt.verified_events_count || 3}</div>
          </div>
          <div class="card-level-1 p-4 space-y-1">
            <span class="text-xs font-label-caps uppercase text-outline font-bold">Water Stress Plots</span>
            <div class="font-data-lg text-2xl font-bold font-mono text-secondary">${waterMgmt.water_stress_plots_count || 2}</div>
          </div>
          <div class="card-level-1 p-4 space-y-1">
            <span class="text-xs font-label-caps uppercase text-outline font-bold">Drip Efficiency</span>
            <div class="font-data-lg text-2xl font-bold font-mono text-primary">${waterMgmt.efficiency_pct || 94}%</div>
          </div>
        </div>
      </div>
    `;
  },

  // ================= 11. INTERVENTION OUTCOMES =================
  renderInterventionOutcomesSection({ outcomes }) {
    const activeOutcomes = outcomes.active_monitored_outcomes || [];
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Intervention Effectiveness & Agronomic Outcomes</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Empirical validation of treatments, bio-fungicides, and automated irrigations.</p>
          </div>
          <span class="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#d5ffc1] text-[#245018]">PROVEN IMPACT</span>
        </div>

        <div class="card-level-1 overflow-hidden">
          <table class="w-full text-left font-body-sm text-on-surface">
            <thead class="bg-surface-container border-b border-outline-variant font-label-caps text-outline uppercase text-xs">
              <tr>
                <th class="p-4">Pathology / Agronomic Stress</th>
                <th class="p-4">Detections</th>
                <th class="p-4">Expert Validated</th>
                <th class="p-4">Interventions Completed</th>
                <th class="p-4">Improved / Resolved</th>
                <th class="p-4">Success Rate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/40">
              ${activeOutcomes.map(o => `
                <tr class="hover:bg-surface-container-low transition-colors">
                  <td class="p-4 font-bold font-fraunces">${o.pathology}</td>
                  <td class="p-4 font-mono">${o.detected_cases}</td>
                  <td class="p-4 font-mono">${o.expert_confirmed}</td>
                  <td class="p-4 font-mono">${o.interventions_dispatched}</td>
                  <td class="p-4 font-mono font-bold text-primary">${o.improved_status}</td>
                  <td class="p-4 font-mono font-bold text-primary">${o.outcome_rate_pct}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ================= 12. SERVICE AREA / VILLAGE ANALYTICS =================
  renderVillageAnalyticsSection({ villageData }) {
    return `
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Service Area & Village Analytics</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Geographic resource allocation across Baramati Taluka villages.</p>
          </div>
          <span class="font-mono text-xs text-outline">${villageData.length} Covered Sectors</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${villageData.map(v => `
            <div class="card-level-1 p-5 space-y-3">
              <div class="flex justify-between items-start border-b border-outline-variant pb-2.5">
                <div>
                  <h4 class="font-headline-sm text-base font-bold font-fraunces text-on-surface">${v.village}</h4>
                  <p class="font-body-sm text-xs text-on-surface-variant">${v.farmers_count} Farmers • ${v.farms_count} Holdings (${v.total_ha} Ha)</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${v.critical_cases > 0 ? 'bg-error text-surface' : 'bg-[#d5ffc1] text-[#245018]'}">
                  ${v.critical_cases > 0 ? `${v.critical_cases} Critical` : 'Balanced'}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div class="p-2 bg-surface rounded">
                  <span class="font-bold text-error font-mono block">${v.disease_cases}</span>
                  <span class="text-[10px] text-outline uppercase font-bold">Disease</span>
                </div>
                <div class="p-2 bg-surface rounded">
                  <span class="font-bold text-blue-600 font-mono block">${v.water_stress_cases}</span>
                  <span class="text-[10px] text-outline uppercase font-bold">Water</span>
                </div>
                <div class="p-2 bg-surface rounded">
                  <span class="font-bold text-secondary font-mono block">${v.open_tickets}</span>
                  <span class="text-[10px] text-outline uppercase font-bold">Tickets</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // State Navigation Controllers
  setSection(section) {
    this.activeSection = section;
    this.render(document.getElementById('main-content'));
  },

  drilldownHotspot(id) {
    this.selectedDrilldown = { type: 'hotspot', id };
    this.activeSection = 'map';
    this.render(document.getElementById('main-content'));
  },

  drilldownPlot(id) {
    this.selectedDrilldown = { type: 'plot', id };
    this.activeSection = 'map';
    this.render(document.getElementById('main-content'));
  },

  clearDrilldown() {
    this.selectedDrilldown = null;
    this.render(document.getElementById('main-content'));
  },

  exportReport() {
    Components.showToast('Generating Baramati FPO Executive Brief (PDF format ready for printing)...', 'info');
    window.print();
  },

  // Modals & Actions
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
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Register New Farmer & Parcel</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Enroll farmer and assign agricultural survey holdings in Baramati.</p>
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
              <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Contact</label>
              <input type="text" id="reg-contact" required placeholder="+91 98XXX XXXXX" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
            </div>
            <div>
              <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Acres</label>
              <input type="number" step="0.5" id="reg-acres" required placeholder="8.5" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
            </div>
          </div>

          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Village / Sector</label>
            <input type="text" id="reg-village" required placeholder="e.g. Supa Village, Baramati" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
          </div>

          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Crop Variety</label>
            <input type="text" id="reg-crop" required placeholder="e.g. Wheat (HD 2967)" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="submit" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
              Save Farmer
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
      Components.showToast(`Farmer ${name} successfully enrolled!`, 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Registration error: ${err.message}`, 'error');
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
            <p class="font-body-sm text-xs text-on-surface-variant">Dispatch KVK agronomist for on-site diagnostic validation.</p>
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
      Components.showToast('Field Officer dispatched to alert!', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error: ${err.message}`, 'error');
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
            <p class="font-body-sm text-xs text-on-surface-variant">Dispatch IoT technician for probe recalibration.</p>
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
      Components.showToast('Technician assigned to service ticket.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error: ${err.message}`, 'error');
    }
  },

  async resolveTicket(ticketId) {
    try {
      await API.updateTicketStatus(ticketId, 'RESOLVED', 'Hardware verified operational by technician.');
      Components.showToast('Maintenance ticket marked RESOLVED.', 'success');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error: ${err.message}`, 'error');
    }
  },

  async dispatchOfficerToHotspot(hotspotId) {
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

  async openAssignOfficerModalForPlot(zoneId) {
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
      Components.showToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.OrgOverviewView = OrgOverviewView;
