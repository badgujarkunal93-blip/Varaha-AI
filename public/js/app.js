// Master Application Controller & Router (Krishi Vikas AI — Baramati, Pune District)

const App = {
  currentView: 'dashboard',
  session: { role: 'Farmer', name: 'Ramesh Patel' },
  livePollTimer: null,
  hardwareStatus: { mode: 'DEMO', isPhysicalLive: false, label: 'DEMO MODE' },

  // Role Route Definitions
  farmerRoutes: ['dashboard', 'map', 'irrigation', 'crop-health', 'advisory'],
  orgRoutes: [
    'org-overview',
    'org-map',
    'org-crops',
    'org-surveillance',
    'org-priority',
    'org-alerts',
    'org-field-ops',
    'review-queue',
    'org-validation',
    'org-farmers',
    'org-farms',
    'org-devices',
    'org-maintenance',
    'org-water',
    'org-service-areas',
    'org-villages'
  ],
  sharedRoutes: ['settings', 'support', 'expert-support'],

  async init() {
    console.log('Initializing Krishi Vikas AI client (Baramati, Pune District)...');

    // Fetch initial auth session
    try {
      const sessionRes = await API.getSession();
      if (sessionRes && sessionRes.session) {
        this.session = sessionRes.session;
      }
    } catch (e) {
      console.warn('Using default session:', e);
    }

    await this.updateRoleUI();

    // Check hash route or default based on role
    const hash = window.location.hash.replace('#', '');
    const defaultRoute = this.session.role === 'OrgExpert' ? 'org-overview' : 'dashboard';
    const targetRoute = hash || defaultRoute;
    this.navigate(targetRoute);

    // Set up auto-poll (every 10 seconds) to update live cards and hardware health
    this.startLivePolling();
  },

  async updateRoleUI() {
    const roleBadge = document.getElementById('user-role-badge');
    const userName = document.getElementById('user-display-name');
    const userSubLabel = document.getElementById('user-sub-label');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const roleSelect = document.getElementById('global-role-switcher');

    const isOrg = this.session.role === 'OrgExpert';

    if (roleBadge) {
      roleBadge.innerText = isOrg ? 'ORG / EXPERT' : 'Farmer';
      roleBadge.className = `px-2 py-0.5 rounded-full text-[9px] font-label-caps font-bold ${
        isOrg ? 'bg-secondary text-surface' : 'bg-primary-container text-on-primary-container'
      }`;
    }

    if (userName) {
      userName.innerText = isOrg ? 'Dr. Anita Deshmukh' : (this.session.name || 'Ramesh Patel');
    }

    if (userSubLabel) {
      userSubLabel.innerText = isOrg ? 'KVK Baramati Expert' : 'Farmer';
    }

    if (userAvatarImg) {
      if (isOrg) {
        userAvatarImg.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
      } else {
        userAvatarImg.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4uIMiYDIDQM1xkQL0VBBYdyJLcc9Yl-ZVmPnoQdP6n53qu1yOIMmFrBN4thNaYmjuCTDDm_UCxkpG5zjolIo8tw7p_sY16dFAnhPXfi8EFL71mIAIho8HXHNdwFWPJPFLgMWCJ8B8MPHSZdYyfjH_bPygJBzYtObm8Jf4zYsvsQx3LEl0e-cF8oxvn2SaXZDIZ7dWEIefgIaCp_jTCJxza_ma2Wi_AJ5VXLXesXWV8BgJd8TJWeze';
      }
    }

    if (roleSelect) {
      roleSelect.value = this.session.role;
    }

    // Toggle Desktop Sidebar Navigation Links
    const farmerNav = document.getElementById('nav-farmer-links');
    const orgNav = document.getElementById('nav-org-links');

    if (isOrg) {
      if (farmerNav) farmerNav.classList.add('hidden');
      if (orgNav) orgNav.classList.remove('hidden');
    } else {
      if (farmerNav) farmerNav.classList.remove('hidden');
      if (orgNav) orgNav.classList.add('hidden');
    }

    // Toggle Mobile Bottom Navigation Bars
    const mobileFarmerNav = document.getElementById('mobile-farmer-nav');
    const mobileOrgNav = document.getElementById('mobile-org-nav');

    if (isOrg) {
      if (mobileFarmerNav) mobileFarmerNav.classList.add('hidden');
      if (mobileOrgNav) mobileOrgNav.classList.remove('hidden');
    } else {
      if (mobileFarmerNav) mobileFarmerNav.classList.remove('hidden');
      if (mobileOrgNav) mobileOrgNav.classList.add('hidden');
    }

    // Update Hardware & Operating Mode Indicator in Top App Bar
    try {
      const hwRes = await API.getHardwareStatus();
      this.hardwareStatus = (hwRes && hwRes.status) || { mode: 'DEMO', isPhysicalLive: false, label: 'DEMO MODE' };
      const hwDot = document.getElementById('hw-status-dot');
      const hwLabel = document.getElementById('hw-status-label');
      const modeBtn = document.getElementById('global-mode-toggle-btn');
      
      if (hwDot && hwLabel) {
        if (this.hardwareStatus.mode === 'LIVE_HARDWARE') {
          if (this.hardwareStatus.isPhysicalLive) {
            hwDot.className = 'w-2.5 h-2.5 rounded-full bg-primary inline-block animate-ping';
            hwLabel.innerText = 'ESP32 Live (Baramati Grid)';
            hwLabel.className = 'text-primary font-bold';
          } else {
            hwDot.className = 'w-2.5 h-2.5 rounded-full bg-error inline-block';
            hwLabel.innerText = 'Live Mode: Awaiting ESP32 Packet';
            hwLabel.className = 'text-error font-medium';
          }
        } else {
          hwDot.className = 'w-2.5 h-2.5 rounded-full bg-secondary inline-block';
          hwLabel.innerText = 'Demo Mode (Simulated Pune Telemetry)';
          hwLabel.className = 'text-secondary font-medium';
        }
      }

      if (modeBtn) {
        if (this.hardwareStatus.mode === 'LIVE_HARDWARE') {
          modeBtn.innerHTML = `<span class="material-symbols-outlined text-sm">sensors</span> Live Hardware Mode`;
          modeBtn.className = `hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-primary text-surface shadow-sm cursor-pointer hover:opacity-90 transition-opacity`;
        } else {
          modeBtn.innerHTML = `<span class="material-symbols-outlined text-sm">developer_board</span> Demo Mode`;
          modeBtn.className = `hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-secondary-container text-on-secondary-container border border-secondary/40 shadow-sm cursor-pointer hover:opacity-90 transition-opacity`;
        }
      }
    } catch (e) {
      console.warn('Could not query hardware status:', e.message);
    }
  },

  async toggleMode(targetMode = null) {
    const nextMode = targetMode || (this.hardwareStatus.mode === 'DEMO' ? 'LIVE_HARDWARE' : 'DEMO');
    try {
      const res = await API.setTelemetryMode(nextMode);
      if (res.success) {
        Components.showToast(`Operating mode switched to: ${nextMode === 'LIVE_HARDWARE' ? 'Live Hardware Mode' : 'Demo Mode'}`, 'info');
        await this.updateRoleUI();
        this.navigate(this.currentView);
      }
    } catch (err) {
      Components.showToast(`Error changing mode: ${err.message}`, 'error');
    }
  },

  async switchRole(newRole) {
    try {
      const res = await API.switchRole(newRole);
      if (res.success && res.session) {
        this.session = res.session;
        await this.updateRoleUI();
        Components.showToast(`Switched active profile to: ${this.session.name} (${this.session.role === 'OrgExpert' ? 'Organization Console' : 'Farmer App'})`, 'info');

        // Route directly to the corresponding default landing page
        if (newRole === 'OrgExpert') {
          this.navigate('org-overview');
        } else {
          this.navigate('dashboard');
        }
      }
    } catch (err) {
      Components.showToast(`Error switching role: ${err.message}`, 'error');
    }
  },

  navigate(viewName) {
    const isOrg = this.session && this.session.role === 'OrgExpert';

    // Route Protection Logic
    if (!isOrg && this.orgRoutes.includes(viewName)) {
      Components.showToast('Access Restricted: Organization Console is reserved for FPO & Agronomist accounts.', 'warning');
      this.currentView = 'dashboard';
      window.location.hash = 'dashboard';
      viewName = 'dashboard';
    } else if (isOrg && this.farmerRoutes.includes(viewName)) {
      // If Org user clicks a farmer-only route, redirect to the corresponding organization module
      let mappedView = 'org-overview';
      if (viewName === 'map') mappedView = 'org-map';
      else if (viewName === 'irrigation') mappedView = 'org-water';
      else if (viewName === 'crop-health') mappedView = 'org-crops';
      else if (viewName === 'advisory') mappedView = 'org-priority';

      Components.showToast(`Navigated to Organization Console: ${mappedView.replace('org-', '').toUpperCase()}`, 'info');
      this.currentView = mappedView;
      window.location.hash = mappedView;
      viewName = mappedView;
    } else {
      this.currentView = viewName;
      window.location.hash = viewName;
    }

    // Normalize canonical route key for sidebar active indicator
    let canonicalView = viewName;
    if (viewName === 'org-alerts') canonicalView = 'org-priority';
    if (viewName === 'org-validation') canonicalView = 'review-queue';
    if (viewName === 'org-farms') canonicalView = 'org-farmers';
    if (viewName === 'org-villages') canonicalView = 'org-service-areas';

    // Update navigation sidebar active link styles (Desktop + Mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkView = link.getAttribute('data-view');
      if (linkView === canonicalView || linkView === viewName) {
        link.classList.add('nav-link-active');
        link.classList.remove('text-on-surface-variant');
      } else {
        link.classList.remove('nav-link-active');
        link.classList.add('text-on-surface-variant');
      }
    });

    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    // Route Dispatch
    switch (viewName) {
      // FARMER ROUTES
      case 'dashboard':
        DashboardView.render(mainContainer);
        break;
      case 'map':
        FieldMapView.render(mainContainer);
        break;
      case 'irrigation':
        IrrigationView.render(mainContainer);
        break;
      case 'crop-health':
        CropHealthView.render(mainContainer);
        break;
      case 'advisory':
        AdvisoryView.render(mainContainer);
        break;

      // ORGANIZATION ROUTES (12 Canonical Modules)
      case 'org-overview':
        OrgOverviewView.activeSection = 'overview';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-map':
        OrgOverviewView.activeSection = 'map';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-crops':
        OrgOverviewView.activeSection = 'crops';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-surveillance':
        OrgOverviewView.activeSection = 'surveillance';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-priority':
      case 'org-alerts':
        OrgOverviewView.activeSection = 'priority';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-field-ops':
        OrgOverviewView.activeSection = 'field-ops';
        OrgOverviewView.render(mainContainer);
        break;
      case 'review-queue':
      case 'org-validation':
        ReviewQueueView.render(mainContainer);
        break;
      case 'org-farmers':
      case 'org-farms':
        OrgOverviewView.activeSection = 'farmers';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-devices':
        OrgOverviewView.activeSection = 'devices';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-maintenance':
        OrgOverviewView.activeSection = 'maintenance';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-water':
        OrgOverviewView.activeSection = 'water';
        OrgOverviewView.render(mainContainer);
        break;
      case 'org-service-areas':
      case 'org-villages':
        OrgOverviewView.activeSection = 'service-areas';
        OrgOverviewView.render(mainContainer);
        break;

      // SHARED SYSTEM ROUTES
      case 'settings':
        SettingsView.render(mainContainer);
        break;
      case 'support':
      case 'expert-support':
        SupportView.render(mainContainer);
        break;

      default:
        if (isOrg) {
          OrgOverviewView.activeSection = 'overview';
          OrgOverviewView.render(mainContainer);
        } else {
          DashboardView.render(mainContainer);
        }
    }
  },

  startLivePolling() {
    if (this.livePollTimer) clearInterval(this.livePollTimer);
    this.livePollTimer = setInterval(async () => {
      await this.updateRoleUI();
      const container = document.getElementById('main-content');
      if (this.currentView === 'dashboard' && !document.getElementById('app-modal').classList.contains('flex')) {
        DashboardView.render(container);
      }
    }, 10000);
  },

  closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
