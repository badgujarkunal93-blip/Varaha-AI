// View: Organization / FPO Operations Console
// Service Region: Baramati Taluka, Pune District, Maharashtra (18.15° N, 74.58° E)

const OrgOverviewView = {
  activeSection: 'overview', // 'overview' | 'map' | 'crops' | 'surveillance' | 'priority' | 'field-ops' | 'farmers' | 'devices' | 'maintenance' | 'water' | 'service-areas'
  selectedDrilldown: null, // { type: 'hotspot'|'plot', id: string }

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div id="org-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
          <div class="h-96 w-full skeleton rounded-xl"></div>
        </div>
        <div id="org-content" class="hidden space-y-6"></div>
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
        total_farmers: 248,
        total_farms: 173,
        total_zones: 7,
        total_devices: 164,
        total_hectares: 14.6,
        online_devices: 156,
        offline_devices: 8,
        stale_devices: 0,
        active_high_risk_cases: 12,
        active_alerts: 27,
        open_maintenance_tickets: 1
      };

      const org = analytics.organization || {
        name: "KVK Baramati & Kisan Vikas FPO",
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
      const predictions = predictionsRes.data || [];

      const content = document.getElementById('org-content');
      const loading = document.getElementById('org-loading');

      const dataBundle = {
        kpis, org, health, cropIntel, surveillance, priorityActions, fieldOps, techWorkload,
        waterMgmt, outcomes, villageData, orgAlerts, hotspots, plots, farmers, farms, zones, devices, tickets, predictions
      };

      // Direct Section Rendering (Driven 100% by Left Sidebar, NO duplicate horizontal tab bar)
      content.innerHTML = this.renderActiveView(dataBundle);

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering organization console:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load organization console: ${err.message}`, "OrgOverviewView.render(document.getElementById('main-content'))");
    }
  },

  renderActiveView(data) {
    switch (this.activeSection) {
      case 'overview':
        return this.renderOverviewPage(data);
      case 'map':
        return this.renderRegionalMapPage(data);
      case 'crops':
        return this.renderCropIntelligencePage(data);
      case 'surveillance':
        return this.renderSurveillancePage(data);
      case 'priority':
      case 'alerts':
        return this.renderActionCenterPage(data);
      case 'field-ops':
        return this.renderFieldOperationsPage(data);
      case 'farmers':
      case 'farms':
        return this.renderFarmersAndParcelsPage(data);
      case 'devices':
        return this.renderDeviceHealthPage(data);
      case 'maintenance':
        return this.renderMaintenancePage(data);
      case 'water':
        return this.renderWaterDemandPage(data);
      case 'service-areas':
      case 'villages':
        return this.renderServiceAreasPage(data);
      default:
        return this.renderOverviewPage(data);
    }
  },

  // Helper: Renders clean Breadcrumb for subpages
  renderBreadcrumb(currentPageTitle) {
    return `
      <div class="flex items-center gap-2 text-xs font-mono text-outline mb-1">
        <a href="#org-overview" onclick="App.navigate('org-overview')" class="hover:text-primary transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">home</span> Organization Overview
        </a>
        <span>/</span>
        <span class="text-on-surface font-bold">${currentPageTitle}</span>
      </div>
    `;
  },

  // ================= 1. OVERVIEW PAGE =================
  renderOverviewPage({ org, kpis, health, surveillance, priorityActions, devices, fieldOps, orgAlerts, predictions }) {
    const pendingReviews = predictions.filter(p => p.status === 'PENDING_REVIEW').length;
    const onlineDevicesCount = devices.filter(d => d.status === 'ONLINE').length;
    const totalDevicesCount = devices.length;

    return `
      <!-- Top Operations Console Header -->
      <header class="bg-surface rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary text-surface uppercase tracking-wider">ORGANIZATION CONSOLE</span>
            <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary-container text-on-secondary-container">REGION: BARAMATI, PUNE</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffdcb9] text-[#783900] font-bold">DEMO DATA</span>
          </div>
          <h1 class="font-display-md text-2xl font-bold font-fraunces text-on-surface leading-tight">KVK Baramati — ${org.name}</h1>
          <p class="font-body-md text-xs text-on-surface-variant mt-1">
            Agronomic Coordination, Pathology Surveillance & Technical Service Center for Baramati Taluka, Pune District (18.15° N, 74.58° E).
          </p>
        </div>

        <!-- Global Action Buttons -->
        <div class="flex flex-wrap gap-2.5">
          <button onclick="OrgOverviewView.openRegisterFarmerModal()" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm">
            <span class="material-symbols-outlined text-base">person_add</span> Register Farmer
          </button>
          <button onclick="App.navigate('review-queue')" class="px-4 py-2 border border-secondary text-secondary bg-surface rounded-lg font-label-caps text-xs font-bold flex items-center gap-1.5 hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined text-base">biotech</span> Validation Queue (${pendingReviews})
          </button>
          <button onclick="OrgOverviewView.exportReport()" class="px-3.5 py-2 border border-outline-variant text-outline bg-surface rounded-lg font-label-caps text-xs font-bold flex items-center gap-1.5 hover:text-on-surface hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined text-base">summarize</span> Export Brief
          </button>
        </div>
      </header>

      <!-- Top 5 Organization Metric Indicators -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div class="card-level-1 card-spine-primary p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-primary transition-colors" onclick="App.navigate('org-farmers')">
          <div class="flex justify-between items-start">
            <span class="font-label-caps text-xs text-outline uppercase font-bold">Total Farmers</span>
            <span class="material-symbols-outlined text-primary text-xl">groups</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">248</span>
            <span class="text-xs text-outline font-body-sm font-medium">Registered</span>
          </div>
          <span class="text-[10px] font-mono text-outline">[FPO REGISTRY]</span>
        </div>

        <div class="card-level-1 card-spine-primary p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-primary transition-colors" onclick="App.navigate('org-farmers')">
          <div class="flex justify-between items-start">
            <span class="font-label-caps text-xs text-outline uppercase font-bold">Active Farms</span>
            <span class="material-symbols-outlined text-primary text-xl">agriculture</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">173</span>
            <span class="text-xs text-outline font-body-sm font-medium">Holdings</span>
          </div>
          <span class="text-[10px] font-mono text-outline">[14.6 Ha Detailed]</span>
        </div>

        <div class="card-level-1 card-spine-warning p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-secondary transition-colors" onclick="App.navigate('org-priority')">
          <div class="flex justify-between items-start">
            <span class="font-label-caps text-xs text-outline uppercase font-bold">Active Alerts</span>
            <span class="material-symbols-outlined text-secondary text-xl">assignment_late</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="font-data-lg text-3xl font-bold font-mono text-secondary">27</span>
            <span class="text-xs text-secondary font-body-sm font-medium">Pending Triage</span>
          </div>
          <span class="text-[10px] font-mono text-secondary">[ACTION CENTER]</span>
        </div>

        <div class="card-level-1 card-spine-danger p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-error transition-colors" onclick="App.navigate('org-surveillance')">
          <div class="flex justify-between items-start">
            <span class="font-label-caps text-xs text-outline uppercase font-bold">High-Risk Farms</span>
            <span class="material-symbols-outlined text-error text-xl" style="font-variation-settings: 'FILL' 1;">warning</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="font-data-lg text-3xl font-bold font-mono text-error">12</span>
            <span class="text-xs text-error font-body-sm font-medium">Urgent Plots</span>
          </div>
          <span class="text-[10px] font-mono text-error">[PATHOLOGY / WATER]</span>
        </div>

        <div class="card-level-1 card-spine-success p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-primary transition-colors" onclick="App.navigate('org-devices')">
          <div class="flex justify-between items-start">
            <span class="font-label-caps text-xs text-outline uppercase font-bold">Connected Devices</span>
            <span class="material-symbols-outlined text-primary text-xl">sensors</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="font-data-lg text-3xl font-bold font-mono text-primary">156</span>
            <span class="text-xs text-outline font-body-sm font-medium">/ 164 Online</span>
          </div>
          <span class="text-[10px] font-mono text-outline">[ESP32 GRID]</span>
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

      <!-- Regional Crop Health Summary Bar -->
      <section class="card-level-1 p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Regional Agricultural Health Overview</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Aggregate vitality across all 173 monitored holdings in Baramati Taluka, Pune.</p>
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

      <!-- Operational Summaries Grid (Quick Highlights with Contextual Click-Throughs) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 1. Pathology Surveillance Summary -->
        <div class="card-level-1 p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-error">coronavirus</span>
              <h3 class="font-headline-sm text-base font-fraunces text-on-surface">Top Pathology Threats</h3>
            </div>
            <button onclick="App.navigate('org-surveillance')" class="text-primary font-label-caps text-xs font-bold hover:underline flex items-center gap-1">
              Surveillance Hub <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
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

        <!-- 2. Urgent Interventions Summary -->
        <div class="card-level-1 p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">assignment_late</span>
              <h3 class="font-headline-sm text-base font-fraunces text-on-surface">Urgent Field Interventions</h3>
            </div>
            <button onclick="App.navigate('org-priority')" class="text-primary font-label-caps text-xs font-bold hover:underline flex items-center gap-1">
              Action Center <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
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

        <!-- 3. Hardware Fleet Health Summary -->
        <div class="card-level-1 p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">sensors</span>
              <h3 class="font-headline-sm text-base font-fraunces text-on-surface">Hardware Fleet Status</h3>
            </div>
            <button onclick="App.navigate('org-devices')" class="text-primary font-label-caps text-xs font-bold hover:underline flex items-center gap-1">
              Device Health <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface rounded-lg border border-outline-variant text-center">
              <span class="font-data-lg text-2xl font-bold font-mono text-primary">${onlineDevicesCount}</span>
              <span class="block text-[11px] font-label-caps uppercase font-bold text-outline mt-0.5">Online Nodes</span>
            </div>
            <div class="p-3 bg-surface rounded-lg border border-outline-variant text-center">
              <span class="font-data-lg text-2xl font-bold font-mono text-secondary">${totalDevicesCount - onlineDevicesCount}</span>
              <span class="block text-[11px] font-label-caps uppercase font-bold text-outline mt-0.5">Maintenance Req</span>
            </div>
          </div>
          <p class="text-xs text-on-surface-variant font-body-sm">
            ESP32 LoRaWAN & Cellular telemetry grid operating on Baramati micro-climate frequencies.
          </p>
        </div>

        <!-- 4. Field Extension Roster Summary -->
        <div class="card-level-1 p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">transfer_within_a_station</span>
              <h3 class="font-headline-sm text-base font-fraunces text-on-surface">Extension Agronomists</h3>
            </div>
            <button onclick="App.navigate('org-field-ops')" class="text-primary font-label-caps text-xs font-bold hover:underline flex items-center gap-1">
              Field Operations <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div class="space-y-2.5">
            ${fieldOps.slice(0, 2).map(exp => `
              <div class="p-3 bg-surface rounded-lg border border-outline-variant flex justify-between items-center">
                <div>
                  <h4 class="font-body-md font-bold text-sm text-on-surface">${exp.name}</h4>
                  <p class="font-body-sm text-xs text-primary font-semibold">${exp.role}</p>
                </div>
                <div class="text-right font-mono text-xs text-outline">
                  <span class="text-secondary font-bold">${exp.pending_visits}</span> pending visits
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ================= 2. REGIONAL RISK MAP PAGE =================
  renderRegionalMapPage({ hotspots, plots }) {
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
      ${this.renderBreadcrumb('Regional Map')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Regional Risk Map & Spatial Hotspots</h2>
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
                <span class="text-outline block text-[10px] uppercase font-bold">Farmer Profile</span>
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

  // ================= 3. CROP INTELLIGENCE PAGE =================
  renderCropIntelligencePage({ cropIntel }) {
    return `
      ${this.renderBreadcrumb('Crop Intelligence')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Crop-Wise Intelligence & Portfolio Risks</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Breakdown of health, disease, pest, and water stress risk across crop portfolios in Baramati.</p>
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

  // ================= 4. SURVEILLANCE PAGE =================
  renderSurveillancePage({ surveillance }) {
    return `
      ${this.renderBreadcrumb('Surveillance')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Regional Disease & Pest Surveillance Hub</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Epidemiological monitoring of crop pathogens, vector insects, and emerging outbreaks across Baramati.</p>
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
                <th class="p-4 text-right">Action</th>
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
                  <td class="p-4 text-right">
                    <button onclick="App.navigate('org-map')" class="px-3 py-1 bg-surface border border-outline-variant rounded text-xs font-label-caps hover:bg-surface-container-high transition-colors">
                      View Hotspot →
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

  // ================= 5. ACTION CENTER PAGE =================
  renderActionCenterPage({ priorityActions }) {
    return `
      ${this.renderBreadcrumb('Action Center')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Priority Action Center & Operational Alert Triage</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Ranked operational alert triage sorted by urgency, pathology severity, and crop vulnerability.</p>
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

  // ================= 6. FIELD OPERATIONS PAGE =================
  renderFieldOperationsPage({ fieldOps }) {
    return `
      ${this.renderBreadcrumb('Field Operations')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Extension Field Officers & Agronomists Roster</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Dispatch management, officer specialty tracks, and field deployment roster for KVK Baramati.</p>
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

  // ================= 7. FARMERS & PARCELS PAGE =================
  renderFarmersAndParcelsPage({ farmers, farms, zones }) {
    return `
      ${this.renderBreadcrumb('Farmers & Parcels')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Farmers & Managed Parcels Registry</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Complete directory of enrolled farmer profiles, survey parcels, zones, and contact points in Baramati.</p>
          </div>
          <button onclick="OrgOverviewView.openRegisterFarmerModal()" class="px-4 py-2 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90 flex items-center gap-1">
            <span class="material-symbols-outlined text-base">person_add</span> Register Farmer
          </button>
        </div>

        <div class="card-level-1 overflow-hidden">
          <table class="w-full text-left font-body-sm text-on-surface">
            <thead class="bg-surface-container border-b border-outline-variant font-label-caps text-outline uppercase text-xs">
              <tr>
                <th class="p-4">Farmer Name</th>
                <th class="p-4">Village / Location</th>
                <th class="p-4">Primary Crop</th>
                <th class="p-4">Total Acreage</th>
                <th class="p-4">Holdings & Plots</th>
                <th class="p-4">Contact</th>
                <th class="p-4 text-right">Action</th>
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
                    <td class="p-4"><span class="px-2 py-0.5 rounded text-xs bg-surface-variant font-medium">${f.crop}</span></td>
                    <td class="p-4 font-mono font-bold">${f.acres} Acres</td>
                    <td class="p-4">
                      <div class="space-y-1">
                        ${farmerFarms.map(fm => `<div class="text-xs font-semibold text-primary">${fm.name} (${fm.survey_number})</div>`).join('')}
                        <div class="text-[11px] text-outline font-mono">${farmerZones.map(z => z.name).join(', ')}</div>
                      </div>
                    </td>
                    <td class="p-4 font-mono text-xs">${f.contact}</td>
                    <td class="p-4 text-right">
                      <button onclick="OrgOverviewView.openFarmerDrilldownModal('${f.id}')" class="px-3 py-1.5 bg-surface border border-outline-variant text-on-surface rounded text-xs font-label-caps font-bold hover:bg-surface-container-high transition-colors">
                        View Profile →
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ================= 8. DEVICE HEALTH PAGE =================
  renderDeviceHealthPage({ devices, farms, zones }) {
    return `
      ${this.renderBreadcrumb('Device Health')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Hardware Health & Telemetry Liveness Fleet</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Real-time status of all deployed ESP32 nodes, probes, and relay actuators in Baramati Grid.</p>
          </div>
          <span class="font-mono text-xs text-outline">${devices.length} Registered Nodes</span>
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

  // ================= 9. MAINTENANCE PAGE =================
  renderMaintenancePage({ tickets }) {
    return `
      ${this.renderBreadcrumb('Maintenance')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Hardware Maintenance Center & Field Technicians</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Service requests, probe recalibrations, and pump relay maintenance queue across Baramati.</p>
          </div>
          <span class="font-mono text-xs text-outline">${tickets.length} Registered Tickets</span>
        </div>

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
                    <button onclick="OrgOverviewView.openAssignTechnicianModal('${tkt.id}')" class="px-3 py-1.5 border border-secondary text-secondary bg-surface rounded text-xs font-bold font-label-caps hover:bg-surface-container-high transition-colors">
                      Assign Tech
                    </button>
                    <button onclick="OrgOverviewView.resolveTicket('${tkt.id}')" class="px-3 py-1.5 bg-primary text-surface rounded text-xs font-bold font-label-caps hover:opacity-90 transition-opacity">
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

  // ================= 10. WATER DEMAND PAGE =================
  renderWaterDemandPage({ waterMgmt }) {
    return `
      ${this.renderBreadcrumb('Water Demand')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Regional Water Demand & Irrigation Management</h2>
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

  // ================= 11. SERVICE AREAS PAGE =================
  renderServiceAreasPage({ villageData }) {
    return `
      ${this.renderBreadcrumb('Service Areas')}

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
          <div>
            <h2 class="font-display-md text-2xl font-bold font-fraunces text-on-surface">Service Area & Village Sector Analytics</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Geographic agricultural resource allocation and risk concentration across Baramati Taluka villages.</p>
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

  // Map & Plot Drilldown State Management
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
    Components.showToast('Generating Baramati FPO Executive Brief (Printable PDF)...', 'info');
    window.print();
  },

  // Farmer & Farm Drilldown Modal
  async openFarmerDrilldownModal(farmerId) {
    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    try {
      const [farmerRes, farmsRes, zonesRes, predictionsRes] = await Promise.all([
        API.getTable('farmers'),
        API.getTable('farms'),
        API.getTable('zones'),
        API.getTable('vision_predictions')
      ]);

      const farmers = farmerRes.data || [];
      const farmer = farmers.find(f => f.id === farmerId) || farmers[0] || { name: 'Ramesh Patel', location: 'Malegaon Khurd, Baramati', crop: 'Wheat', acres: 12.5 };
      const farms = (farmsRes.data || []).filter(fm => fm.farmer_id === farmer.id);
      const zones = (zonesRes.data || []).filter(z => z.farmer_id === farmer.id);
      const cases = (predictionsRes.data || []).filter(p => p.farmer_id === farmer.id);

      modalContent.innerHTML = `
        <div class="p-6 max-w-2xl w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
          <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>

          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xl">
              ${farmer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span class="text-[10px] font-label-caps font-bold text-secondary uppercase tracking-wider block">FARMER & PARCEL RECORD</span>
              <h3 class="font-headline-sm text-xl font-fraunces text-on-surface">${farmer.name}</h3>
              <p class="font-body-sm text-xs text-on-surface-variant">Location: ${farmer.location} • Primary Crop: ${farmer.crop}</p>
            </div>
          </div>

          <div class="furrow-divider"></div>

          <!-- Farm Holdings & Acreage -->
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="p-3 bg-surface rounded-lg border border-outline-variant">
              <span class="font-data-lg text-lg font-bold font-mono text-on-surface">${farmer.acres} Acres</span>
              <span class="block text-[10px] text-outline uppercase font-bold">Total Acreage</span>
            </div>
            <div class="p-3 bg-surface rounded-lg border border-outline-variant">
              <span class="font-data-lg text-lg font-bold font-mono text-primary">${farms.length || 1} Holdings</span>
              <span class="block text-[10px] text-outline uppercase font-bold">Survey Parcels</span>
            </div>
            <div class="p-3 bg-surface rounded-lg border border-outline-variant">
              <span class="font-data-lg text-lg font-bold font-mono text-secondary">${zones.length || 2} Zones</span>
              <span class="block text-[10px] text-outline uppercase font-bold">Monitored Plots</span>
            </div>
          </div>

          <!-- Associated Zones -->
          <div>
            <h4 class="font-label-caps text-xs text-outline uppercase font-bold mb-2">Monitored Farm Zones</h4>
            <div class="space-y-2">
              ${zones.map(z => `
                <div class="p-3 bg-surface rounded border border-outline-variant flex justify-between items-center text-xs">
                  <div>
                    <span class="font-bold text-on-surface block">${z.name}</span>
                    <span class="text-outline">${z.crop} • ${z.area_ha} Hectares</span>
                  </div>
                  <span class="font-mono text-primary font-bold">${z.device_id || 'ESP32 Node'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Pathology & Vision Cases -->
          <div>
            <h4 class="font-label-caps text-xs text-outline uppercase font-bold mb-2">Recent Diagnostic Scans</h4>
            ${cases.length === 0 ? `
              <p class="text-xs text-outline italic">No pending pathology cases for this farmer.</p>
            ` : `
              <div class="space-y-2">
                ${cases.map(c => `
                  <div class="p-3 bg-surface rounded border border-error/40 flex justify-between items-center text-xs">
                    <div>
                      <span class="font-bold text-error block">${c.disease || c.pest || 'Pathology Scan'}</span>
                      <span class="text-outline">Severity: ${c.severity} • Confidence: ${c.confidence}%</span>
                    </div>
                    <button onclick="App.closeModal(); ReviewQueueView.selectedPredictionId='${c.id}'; App.navigate('review-queue');" class="px-3 py-1 bg-primary text-surface rounded font-label-caps font-bold">
                      Open Validation File →
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-xs font-bold">Close</button>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } catch (e) {
      Components.showToast(`Error fetching farmer details: ${e.message}`, 'error');
    }
  },

  // Registration & Dispatch Modals
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
              <input type="number" id="reg-acres" step="0.5" required placeholder="10.0" class="w-full bg-surface border border-outline-variant rounded-lg px-3.5 py-2 text-sm font-body-md text-on-surface" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Village</label>
              <select id="reg-village" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
                <option value="Malegaon Khurd">Malegaon Khurd</option>
                <option value="Rui Village">Rui Village</option>
                <option value="Jalochi">Jalochi</option>
                <option value="Kattebhel">Kattebhel</option>
              </select>
            </div>
            <div>
              <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Primary Crop</label>
              <select id="reg-crop" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
                <option value="Wheat (GW-496)">Wheat (GW-496)</option>
                <option value="Sugarcane (Co 86032)">Sugarcane (Co 86032)</option>
                <option value="Soybean (JS 335)">Soybean (JS 335)</option>
                <option value="Gram / Chana">Gram / Chana</option>
                <option value="Onion">Onion</option>
              </select>
            </div>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="submit" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90">
              Complete Enrollment
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
    const acres = parseFloat(document.getElementById('reg-acres').value) || 5;
    const village = document.getElementById('reg-village').value;
    const crop = document.getElementById('reg-crop').value;

    const farmerId = `farmer-${Date.now().toString().slice(-4)}`;
    const farmId = `farm-${Date.now().toString().slice(-4)}`;
    const zoneId = `zone-${Date.now().toString().slice(-4)}`;

    try {
      await API.createRecord('farmers', {
        id: farmerId,
        org_id: 'org-pune-baramati',
        name,
        contact,
        location: `${village}, Baramati, Pune`,
        acres,
        crop,
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
