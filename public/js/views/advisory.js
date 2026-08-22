// View: Multilingual Advisory Feed & Real Insights (Baramati, Pune District)

const AdvisoryView = {
  currentLang: 'ENG', // 'ENG' | 'MAR' | 'HIN'
  filterCategory: 'all', // 'all' | 'unread' | 'disease' | 'pest' | 'water'

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="advisory-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="advisory-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [advisoriesRes, predictionsRes, validationsRes] = await Promise.all([
        API.getTable('advisory_messages'),
        API.getTable('vision_predictions'),
        API.getTable('expert_validations')
      ]);

      const messages = advisoriesRes.data || [];
      const predictions = predictionsRes.data || [];
      const validations = validationsRes.data || [];

      // Calculate Insights KPIs — STRICTLY TRACEABLE TO DATABASE RECORDS
      const totalPredictions = predictions.length;
      const confirmedCount = predictions.filter(p => p.status === 'CONFIRMED').length;
      const rejectedCount = predictions.filter(p => p.status === 'REJECTED').length;
      const pendingCount = predictions.filter(p => p.status === 'PENDING_REVIEW').length;

      // Filter messages
      const filtered = messages.filter(m => {
        if (this.filterCategory === 'unread') return !m.read_status;
        if (this.filterCategory === 'disease') return m.category === 'disease';
        if (this.filterCategory === 'pest') return m.category === 'pest';
        if (this.filterCategory === 'water') return m.category === 'water';
        return true;
      });

      const content = document.getElementById('advisory-content');
      const loading = document.getElementById('advisory-loading');

      content.innerHTML = `
        <!-- Header Section & Language Switcher -->
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 class="font-display-lg text-display-lg text-on-surface font-fraunces">Advisory Feed</h1>
            <p class="font-body-lg text-body-lg text-outline">Actionable precision agronomy recommendations generated from Baramati field telemetry.</p>
          </div>

          <!-- Language Selector Pills -->
          <div class="flex items-center gap-3">
            <span class="font-label-caps text-xs text-outline uppercase font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">translate</span> Language:
            </span>
            <div class="flex items-center gap-1 p-1 bg-surface-container-highest rounded-lg border border-outline-variant">
              <button onclick="AdvisoryView.setLang('ENG')" class="px-3 py-1 rounded font-label-caps text-xs uppercase font-bold transition-colors ${this.currentLang === 'ENG' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:text-primary'}">
                ENG
              </button>
              <button onclick="AdvisoryView.setLang('MAR')" class="px-3 py-1 rounded font-label-caps text-xs uppercase font-bold transition-colors ${this.currentLang === 'MAR' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:text-primary'}">
                मराठी (MAR)
              </button>
              <button onclick="AdvisoryView.setLang('HIN')" class="px-3 py-1 rounded font-label-caps text-xs uppercase font-bold transition-colors ${this.currentLang === 'HIN' ? 'bg-primary text-surface shadow-sm' : 'text-on-surface-variant hover:text-primary'}">
                हिंदी (HIN)
              </button>
            </div>
          </div>
        </header>

        <!-- Category Filters -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 furrow-divider">
          <button onclick="AdvisoryView.setFilter('all')" class="px-4 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors ${this.filterCategory === 'all' ? 'bg-primary text-surface' : 'border border-primary text-primary hover:bg-primary/5'}">
            All (${messages.length})
          </button>
          <button onclick="AdvisoryView.setFilter('unread')" class="px-4 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors ${this.filterCategory === 'unread' ? 'bg-primary text-surface' : 'border border-primary text-primary hover:bg-primary/5'}">
            Unread (${messages.filter(m => !m.read_status).length})
          </button>
          <button onclick="AdvisoryView.setFilter('disease')" class="px-4 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors ${this.filterCategory === 'disease' ? 'bg-primary text-surface' : 'border border-primary text-primary hover:bg-primary/5'}">
            Disease
          </button>
          <button onclick="AdvisoryView.setFilter('pest')" class="px-4 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors ${this.filterCategory === 'pest' ? 'bg-primary text-surface' : 'border border-primary text-primary hover:bg-primary/5'}">
            Pest
          </button>
          <button onclick="AdvisoryView.setFilter('water')" class="px-4 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors ${this.filterCategory === 'water' ? 'bg-primary text-surface' : 'border border-primary text-primary hover:bg-primary/5'}">
            Water
          </button>
        </div>

        <!-- Advisory Feed Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter-grid mb-8">
          ${filtered.length === 0 ? `
            <div class="col-span-2 card-level-1 p-8 text-center text-outline">
              <span class="material-symbols-outlined text-4xl text-primary mb-2">mark_chat_read</span>
              <p>No advisory notices in this category.</p>
            </div>
          ` : filtered.map(item => {
            let spine = 'card-spine-primary';
            let icon = 'eco';
            let iconBg = 'bg-surface-container-high text-primary';
            let categoryLabel = 'Optimal Growth';

            if (item.category === 'disease') {
              spine = 'card-spine-danger';
              icon = 'coronavirus';
              iconBg = 'bg-error-container text-on-error-container';
              categoryLabel = 'Pathology Alert';
            } else if (item.category === 'pest') {
              spine = 'card-spine-warning';
              icon = 'bug_report';
              iconBg = 'bg-secondary-container text-on-secondary-container';
              categoryLabel = 'Pest Warning';
            } else if (item.category === 'water') {
              spine = 'card-spine-tertiary';
              icon = 'water_drop';
              iconBg = 'bg-tertiary-container text-on-tertiary-container';
              categoryLabel = 'Hydration Advisory';
            }

            let messageText = item.message_en;
            if (this.currentLang === 'MAR' && item.message_mr) {
              messageText = item.message_mr;
            } else if (this.currentLang === 'HIN' && item.message_hi) {
              messageText = item.message_hi;
            }

            return `
              <div class="card-level-1 ${spine} p-5 rounded-lg flex gap-4 relative group ${item.read_status ? 'opacity-70' : ''}">
                <div class="flex-shrink-0 w-11 h-11 rounded-full ${iconBg} flex items-center justify-center shadow-sm">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${icon}</span>
                </div>
                
                <div class="flex-grow pr-6">
                  <div class="flex justify-between items-start mb-1">
                    <span class="font-label-caps text-xs text-outline uppercase font-bold">${item.zone_id.toUpperCase()} • ${categoryLabel}</span>
                    <span class="font-data-md text-xs font-mono text-outline">${new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p class="font-body-md text-sm text-on-surface mt-1 leading-relaxed">${messageText}</p>
                  <span class="text-[10px] font-mono text-outline mt-2 block">[PROVENANCE: RULE ENGINE AUDIT]</span>
                </div>

                <button onclick="AdvisoryView.toggleRead('${item.id}', ${!item.read_status})" title="${item.read_status ? 'Mark unread' : 'Mark as read'}" class="absolute top-4 right-4 ${item.read_status ? 'text-primary' : 'text-outline opacity-0 group-hover:opacity-100'} hover:text-primary transition-all">
                  <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${item.read_status ? 1 : 0};">check_circle</span>
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Real Data Insights Section (Computed 100% from DB table rows) -->
        <section>
          <div class="mb-4 flex justify-between items-end">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-display-md text-display-md text-on-surface font-fraunces">Insights & Validation Ledger</h2>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container font-bold text-outline">EXACT ROW QUERIES</span>
              </div>
              <p class="font-body-sm text-on-surface-variant">Live aggregated counts computed directly from vision_predictions and expert_validations tables in database.</p>
            </div>
          </div>
          <div class="w-full h-px bg-outline-variant mb-6"></div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter-grid">
            <div class="card-level-1 card-spine-primary p-6 rounded-lg flex flex-col justify-between h-32">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Total Scans Run</span>
              <span class="font-data-lg text-3xl font-bold font-mono text-on-surface">${totalPredictions}</span>
              <span class="text-[10px] font-mono text-outline">[ALL PREDICTIONS]</span>
            </div>

            <div class="card-level-1 card-spine-primary p-6 rounded-lg flex flex-col justify-between h-32">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Confirmed Valid</span>
              <span class="font-data-lg text-3xl font-bold font-mono text-primary">${confirmedCount}</span>
              <span class="text-[10px] font-mono text-primary">[EXPERT VALIDATED]</span>
            </div>

            <div class="card-level-1 card-spine-danger p-6 rounded-lg flex flex-col justify-between h-32">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Rejected / Retake</span>
              <span class="font-data-lg text-3xl font-bold font-mono text-error">${rejectedCount}</span>
              <span class="text-[10px] font-mono text-error">[EXPERT REJECTED]</span>
            </div>

            <div class="card-level-1 card-spine-warning p-6 rounded-lg flex flex-col justify-between h-32">
              <span class="font-label-caps text-xs text-outline uppercase font-bold">Pending Review</span>
              <span class="font-data-lg text-3xl font-bold font-mono text-secondary">${pendingCount}</span>
              <span class="text-[10px] font-mono text-secondary">[IN EXPERT QUEUE]</span>
            </div>
          </div>
        </section>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering advisory:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load advisories: ${err.message}`, "AdvisoryView.render(document.getElementById('main-content'))");
    }
  },

  setLang(lang) {
    this.currentLang = lang;
    this.render(document.getElementById('main-content'));
  },

  setFilter(category) {
    this.filterCategory = category;
    this.render(document.getElementById('main-content'));
  },

  async toggleRead(id, newStatus) {
    try {
      await API.updateRecord('advisory_messages', id, { read_status: newStatus });
      Components.showToast(`Advisory message marked as ${newStatus ? 'read' : 'unread'}.`, 'info');
      this.render(document.getElementById('main-content'));
    } catch (err) {
      Components.showToast(`Error: ${err.message}`, 'error');
    }
  }
};
