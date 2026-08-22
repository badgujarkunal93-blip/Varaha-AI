// Master Application Controller & Router (Krishi Vikas AI — Baramati, Pune District)

const App = {
  currentView: 'dashboard',
  session: { role: 'Farmer', name: 'Ramesh Patel' },
  livePollTimer: null,
  hardwareStatus: { mode: 'DEMO', isPhysicalLive: false, label: 'DEMO MODE' },

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

    // Check hash route or default to dashboard
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(hash);

    // Set up auto-poll (every 10 seconds) to update live cards and hardware health
    this.startLivePolling();
  },

  async updateRoleUI() {
    const roleBadge = document.getElementById('user-role-badge');
    const userName = document.getElementById('user-display-name');
    const roleSelect = document.getElementById('global-role-switcher');
    const expertNavItems = document.querySelectorAll('.nav-expert-only');

    if (roleBadge) {
      roleBadge.innerText = this.session.role === 'OrgExpert' ? 'Org / Expert' : 'Farmer';
      roleBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-label-caps font-bold ${
        this.session.role === 'OrgExpert' ? 'bg-secondary text-surface' : 'bg-primary-container text-on-primary-container'
      }`;
    }

    if (userName) {
      userName.innerText = this.session.name;
    }

    if (roleSelect) {
      roleSelect.value = this.session.role;
    }

    // Toggle expert navigation links
    expertNavItems.forEach(el => {
      if (this.session.role === 'OrgExpert') {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

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
        Components.showToast(`Switched active profile to: ${this.session.name} (${this.session.role})`, 'info');

        // Route based on role
        if (newRole === 'OrgExpert') {
          this.navigate('review-queue');
        } else {
          this.navigate('dashboard');
        }
      }
    } catch (err) {
      Components.showToast(`Error switching role: ${err.message}`, 'error');
    }
  },

  navigate(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Update navigation sidebar active class
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkView = link.getAttribute('data-view');
      if (linkView === viewName) {
        link.classList.add('nav-link-active');
        link.classList.remove('text-on-surface-variant', 'text-on-primary-fixed-variant');
      } else {
        link.classList.remove('nav-link-active');
        link.classList.add('text-on-surface-variant');
      }
    });

    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    // Route to corresponding view
    switch (viewName) {
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
      case 'review-queue':
        ReviewQueueView.render(mainContainer);
        break;
      case 'advisory':
        AdvisoryView.render(mainContainer);
        break;
      case 'settings':
        SettingsView.render(mainContainer);
        break;
      case 'support':
      case 'expert-support':
        SupportView.render(mainContainer);
        break;
      case 'org-overview':
        OrgOverviewView.render(mainContainer);
        break;
      default:
        DashboardView.render(mainContainer);
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
