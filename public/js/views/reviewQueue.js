// View: Expert Validation Queue (Org/Expert Role Gated - KVK Baramati, Pune)

const ReviewQueueView = {
  selectedPredictionId: null,

  async render(container) {
    container.innerHTML = `
      <div class="h-full w-full flex flex-col md:flex-row overflow-hidden">
        <div id="review-loading" class="p-8 w-full">
          <div class="h-8 w-1/3 skeleton mb-6"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="review-content" class="hidden h-full w-full flex flex-col md:flex-row overflow-hidden"></div>
      </div>
    `;

    try {
      const [sessionRes, predictionsRes, farmersRes, weatherRes] = await Promise.all([
        API.getSession(),
        API.getTable('vision_predictions'),
        API.getTable('farmers'),
        API.getWeather()
      ]);

      const session = sessionRes.session || { role: 'Farmer' };
      const isExpert = session.role === 'OrgExpert';
      const predictions = predictionsRes.data || [];
      const farmers = farmersRes.data || [];
      const weather = weatherRes.weather || { temp: 28, humidity: 65, location: 'Baramati, Pune' };

      // If user is currently a Farmer, show a gate banner with quick role toggle
      if (!isExpert) {
        const loading = document.getElementById('review-loading');
        loading.classList.add('hidden');
        container.innerHTML = `
          <div class="p-8 max-w-2xl mx-auto my-12 card-level-1 card-spine-warning p-8 text-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto">
              <span class="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">Expert Validation Queue Gated</h3>
            <p class="font-body-md text-on-surface-variant">
              The validation queue is reserved for Agricultural Extension Officers, Agronomists, and KVK Baramati Specialists to confirm or reject AI field pathology detections.
            </p>
            <div class="pt-4 flex justify-center gap-4">
              <button onclick="App.navigate('crop-health')" class="px-4 py-2 border border-outline-variant rounded font-label-caps text-label-caps">
                Return to Farmer Scans
              </button>
              <button onclick="App.switchRole('OrgExpert')" class="px-6 py-2 bg-primary text-surface rounded font-label-caps text-label-caps hover:opacity-90">
                Switch to Org/Expert Role
              </button>
            </div>
          </div>
        `;
        return;
      }

      // Pending cases directly from database
      const pendingList = predictions.filter(p => p.status === 'PENDING_REVIEW');
      if (!this.selectedPredictionId && pendingList.length > 0) {
        this.selectedPredictionId = pendingList[0].id;
      }

      const activeCase = pendingList.find(p => p.id === this.selectedPredictionId) || pendingList[0] || null;
      const farmerObj = activeCase ? (farmers.find(f => f.id === activeCase.farmer_id) || { name: 'Rajesh Patil', location: 'Rui Village, Baramati' }) : null;

      const content = document.getElementById('review-content');
      const loading = document.getElementById('review-loading');

      content.innerHTML = `
        <!-- Left Queue Pane (Width 1/3) -->
        <section class="w-full md:w-80 lg:w-96 border-r border-outline-variant bg-surface flex flex-col h-full shrink-0">
          <div class="p-4 border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-10 flex justify-between items-center">
            <div>
              <h2 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">Pending Diagnoses</h2>
              <span class="font-label-caps text-xs text-outline">KVK Baramati Agronomy Desk</span>
            </div>
            <span class="bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-data-md text-data-md font-bold font-mono">
              ${pendingList.length}
            </span>
          </div>

          <div class="overflow-y-auto flex-1 p-3 space-y-2.5">
            ${pendingList.length === 0 ? `
              <div class="p-8 text-center text-outline font-body-sm">
                <span class="material-symbols-outlined text-4xl mb-2 text-primary">check_circle</span>
                <p>All diagnosis cases have been reviewed!</p>
              </div>
            ` : pendingList.map(item => {
              const isSelected = activeCase && activeCase.id === item.id;
              const isHigh = item.severity === 'High';
              const spine = isHigh ? 'spine-danger' : 'spine-warning';

              return `
                <button onclick="ReviewQueueView.selectCase('${item.id}')" class="w-full text-left ${isSelected ? 'bg-surface-container-high border-primary shadow-sm' : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant'} border rounded-lg p-3.5 ${spine} flex flex-col gap-1.5 transition-all">
                  <div class="flex justify-between items-start">
                    <span class="font-label-caps text-xs font-bold uppercase ${isHigh ? 'text-error' : 'text-secondary'}">
                      ${item.disease || item.pest || 'ANOMALY DETECTED'}
                    </span>
                    <span class="font-data-md text-xs text-on-surface-variant font-mono">${new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div class="font-body-md text-sm text-on-surface font-medium">${item.crop} • Case #${item.id}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="material-symbols-outlined ${isHigh ? 'text-error' : 'text-secondary'} text-sm" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
                    <span class="font-data-md text-xs font-bold font-mono ${isHigh ? 'text-error' : 'text-secondary'}">${item.confidence}% AI Confidence</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Right Detail Pane (Width 2/3) -->
        <section class="flex-1 overflow-y-auto bg-surface-container-lowest p-6 md:p-10 flex flex-col relative pb-32">
          ${!activeCase ? `
            <div class="flex-1 flex flex-col items-center justify-center text-center p-12 text-outline">
              <span class="material-symbols-outlined text-6xl text-primary mb-3">task_alt</span>
              <h3 class="font-headline-sm text-headline-sm text-on-surface">Queue Clear</h3>
              <p class="font-body-md max-w-md text-on-surface-variant mt-1">There are no pending case files awaiting expert agronomist validation at this moment.</p>
            </div>
          ` : `
            <!-- Case Header -->
            <header class="mb-6">
              <div class="flex items-center justify-between">
                <span class="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">CASE ID #${activeCase.id}</span>
                <span class="px-3 py-1 rounded bg-error-container text-on-error-container font-label-caps text-xs font-bold">${activeCase.severity} Severity</span>
              </div>
              <h1 class="font-display-md text-3xl font-fraunces text-on-surface mt-1 mb-2">Validation Required: ${activeCase.disease || activeCase.pest}</h1>
              <div class="flex flex-wrap gap-4 text-on-surface-variant font-body-sm">
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-primary">person</span> ${farmerObj.name}</span>
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-primary">grass</span> ${activeCase.crop}</span>
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-primary">location_on</span> ${farmerObj.location} (${activeCase.zone_id.toUpperCase()})</span>
              </div>
            </header>

            <div class="furrow-divider"></div>

            <!-- Bento Grid Content -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-grid mb-8">
              <!-- Main Image Card (8 cols) -->
              <div class="lg:col-span-8 card-level-1 card-spine-danger p-4 flex flex-col">
                <div class="flex justify-between items-center mb-3">
                  <span class="font-label-caps text-xs text-error font-bold flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">camera</span>
                    HIGH-RES FIELD SCAN (BARAMATI)
                  </span>
                  <span class="font-data-md text-xs font-mono text-outline">${new Date(activeCase.timestamp).toLocaleString()}</span>
                </div>
                <div class="relative w-full aspect-video rounded bg-surface-variant overflow-hidden group">
                  <img src="${activeCase.image_url}" class="w-full h-full object-cover" />
                  <!-- AI Bounding Box Overlay -->
                  <div class="absolute top-1/4 left-1/4 w-36 h-36 border-2 border-error border-dashed rounded opacity-80 group-hover:opacity-100 transition-opacity">
                    <div class="absolute -top-6 left-0 bg-error text-on-error text-[10px] font-label-caps px-1.5 py-0.5 rounded font-bold">
                      Pathogen Focus Area
                    </div>
                  </div>
                </div>
                <p class="font-body-sm text-xs text-on-surface-variant mt-3 italic">${activeCase.notes || 'Pathology scan processed by Gemini Vision.'}</p>
              </div>

              <!-- AI Confidence Sun-Ring Gauge (4 cols) -->
              <div class="lg:col-span-4 card-level-1 card-spine-warning p-6 flex flex-col items-center justify-center text-center">
                <span class="font-label-caps text-xs text-outline uppercase tracking-wider mb-2">AI CONFIDENCE SCORE</span>
                ${Components.renderSunRing(activeCase.confidence, activeCase.disease ? 'Pathogen' : 'Pest', activeCase.severity === 'High' ? 'danger' : 'warning', 150)}
                <p class="font-body-sm text-xs text-on-surface-variant mt-3">
                  ${activeCase.confidence >= 85 ? 'High confidence match. Symptoms align with regional wheat rust strain.' : 'Moderate confidence. Expert visual verification required.'}
                </p>
              </div>

              <!-- Environmental Evidence (6 cols) -->
              <div class="lg:col-span-6 card-level-1 card-spine-neutral p-4">
                <span class="font-label-caps text-xs text-outline font-bold flex items-center gap-1.5 mb-3 uppercase">
                  <span class="material-symbols-outlined text-base text-secondary">thermostat</span>
                  Environmental Correlation (Baramati Grid)
                </span>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-surface p-3 rounded border border-outline-variant">
                    <span class="font-label-caps text-xs text-outline block mb-1">Microclimate Humidity</span>
                    <span class="font-data-lg text-xl font-bold font-mono text-on-surface">${weather.humidity}%</span>
                    <span class="font-body-sm text-xs text-error mt-1 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">trending_up</span> Conducive for Spores
                    </span>
                  </div>
                  <div class="bg-surface p-3 rounded border border-outline-variant">
                    <span class="font-label-caps text-xs text-outline block mb-1">Canopy Temp</span>
                    <span class="font-data-lg text-xl font-bold font-mono text-on-surface">${weather.temp}°C</span>
                    <span class="font-body-sm text-xs text-secondary mt-1 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">horizontal_rule</span> Favorable Range
                    </span>
                  </div>
                </div>
              </div>

              <!-- Sensor Evidence (6 cols) -->
              <div class="lg:col-span-6 card-level-1 card-spine-neutral p-4">
                <span class="font-label-caps text-xs text-outline font-bold flex items-center gap-1.5 mb-3 uppercase">
                  <span class="material-symbols-outlined text-base text-primary">sensors</span>
                  Canopy Leaf Sensors
                </span>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-surface p-3 rounded border border-outline-variant">
                    <span class="font-label-caps text-xs text-outline block mb-1">Leaf Wetness Duration</span>
                    <span class="font-data-lg text-xl font-bold font-mono text-on-surface">${activeCase.leaf_wetness_hrs || 6.4} <span class="text-xs">hrs/day</span></span>
                    <span class="font-body-sm text-xs text-secondary mt-1 block">Elevated Wetness</span>
                  </div>
                  <div class="bg-surface p-3 rounded border border-outline-variant">
                    <span class="font-label-caps text-xs text-outline block mb-1">Historical Incidence</span>
                    <span class="font-data-lg text-lg font-bold font-mono text-on-surface">Reported</span>
                    <span class="font-body-sm text-xs text-outline mt-1 block">Previous rabi cycle</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticky Bottom Action Bar -->
            <div class="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-surface/95 backdrop-blur-sm border-t border-outline-variant shadow-lg z-20 flex flex-wrap justify-end items-center gap-3">
              <button onclick="ReviewQueueView.submitExpertDecision('${activeCase.id}', 'REFERRED', 'Referred to KVK Baramati Agricultural Research Station laboratory.')" class="px-5 py-2.5 rounded-lg font-label-caps text-label-caps font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors">
                REFER TO LAB
              </button>
              <button onclick="ReviewQueueView.submitExpertDecision('${activeCase.id}', 'REJECTED', 'Image resolution insufficient for definitive classification.')" class="px-5 py-2.5 rounded-lg font-label-caps text-label-caps font-bold border border-error text-error hover:bg-error-container transition-colors">
                REJECT AI DIAGNOSIS
              </button>
              <button onclick="ReviewQueueView.submitExpertDecision('${activeCase.id}', 'CONFIRMED', 'KVK Baramati agronomist visual inspection confirms pathological symptoms.')" class="px-7 py-2.5 rounded-lg font-label-caps text-label-caps font-bold bg-primary text-on-primary shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-base">check</span> CONFIRM DIAGNOSIS
              </button>
            </div>
          `}
        </section>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering review queue:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load review queue: ${err.message}`, "ReviewQueueView.render(document.getElementById('main-content'))");
    }
  },

  selectCase(predictionId) {
    this.selectedPredictionId = predictionId;
    this.render(document.getElementById('main-content'));
  },

  async submitExpertDecision(predictionId, status, notes) {
    try {
      const res = await API.expertAction(predictionId, status, notes);
      if (res.success) {
        Components.showToast(`Case #${predictionId} marked as ${status}. Database updated.`, 'success');
        this.selectedPredictionId = null;
        this.render(document.getElementById('main-content'));
      }
    } catch (err) {
      Components.showToast(`Validation action failed: ${err.message}`, 'error');
    }
  }
};
