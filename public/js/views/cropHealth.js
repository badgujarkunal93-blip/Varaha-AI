// View: Crop Health Management & Real Leaf Scanner (Baramati, Pune)

const CropHealthView = {
  activeTab: 'scans',
  filterCrop: 'all',

  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
        <div id="crop-loading" class="space-y-6">
          <div class="h-10 w-1/3 skeleton"></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
            ${Components.renderSkeletonCard()}
          </div>
        </div>
        <div id="crop-content" class="hidden space-y-8"></div>
      </div>
    `;

    try {
      const [predictionsRes, zonesRes, sessionRes] = await Promise.all([
        API.getTable('vision_predictions'),
        API.getTable('zones'),
        API.getSession()
      ]);

      const predictions = predictionsRes.data || [];
      const zones = zonesRes.data || [];
      const userRole = sessionRes.session ? sessionRes.session.role : 'Farmer';

      const filteredScans = this.filterCrop === 'all'
        ? predictions
        : predictions.filter(p => (p.crop || '').toLowerCase().includes(this.filterCrop.toLowerCase()));

      const content = document.getElementById('crop-content');
      const loading = document.getElementById('crop-loading');

      content.innerHTML = `
        <!-- Header & Segmented Control -->
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 class="font-display-lg text-display-lg text-on-surface font-fraunces">Crop Health</h2>
            <p class="font-body-lg text-body-lg text-outline">Real-time leaf scan diagnostics and pathology detection in Baramati, Pune.</p>
          </div>
          <div class="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant w-fit">
            <button onclick="CropHealthView.switchTab('scans')" class="px-6 py-2 rounded font-label-caps text-label-caps ${this.activeTab === 'scans' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'} transition-colors">
              Scans (${predictions.length})
            </button>
            <button onclick="CropHealthView.switchTab('review')" class="px-6 py-2 rounded font-label-caps text-label-caps ${this.activeTab === 'review' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'} transition-colors flex items-center gap-1.5">
              Review Queue
              ${userRole !== 'OrgExpert' ? `<span class="material-symbols-outlined text-[14px]">lock</span>` : `<span class="bg-secondary text-surface text-[10px] px-1.5 py-0.5 rounded-full font-bold">${predictions.filter(p => p.status === 'PENDING_REVIEW').length}</span>`}
            </button>
          </div>
        </header>

        <!-- Filters & Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-center pb-4 furrow-divider gap-4">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="font-label-caps text-label-caps text-outline mr-2 uppercase tracking-wider">Filter:</span>
            <button onclick="CropHealthView.setFilter('all')" class="px-4 py-1.5 rounded-full border ${this.filterCrop === 'all' ? 'border-primary bg-primary text-surface' : 'border-outline-variant text-on-surface-variant bg-surface'} font-body-sm text-body-sm transition-colors">
              All Scans (${predictions.length})
            </button>
            <button onclick="CropHealthView.setFilter('wheat')" class="px-4 py-1.5 rounded-full border ${this.filterCrop === 'wheat' ? 'border-primary bg-primary text-surface' : 'border-outline-variant text-on-surface-variant bg-surface'} font-body-sm text-body-sm transition-colors">
              Wheat
            </button>
            <button onclick="CropHealthView.setFilter('corn')" class="px-4 py-1.5 rounded-full border ${this.filterCrop === 'corn' ? 'border-primary bg-primary text-surface' : 'border-outline-variant text-on-surface-variant bg-surface'} font-body-sm text-body-sm transition-colors">
              Sweet Corn
            </button>
            <button onclick="CropHealthView.setFilter('soybean')" class="px-4 py-1.5 rounded-full border ${this.filterCrop === 'soybean' ? 'border-primary bg-primary text-surface' : 'border-outline-variant text-on-surface-variant bg-surface'} font-body-sm text-body-sm transition-colors">
              Soybeans
            </button>
          </div>

          <button onclick="CropHealthView.openScanModal()" class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">add_a_photo</span> New Leaf Scan
          </button>
        </div>

        <!-- Scans Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-grid">
          ${filteredScans.map(scan => {
            const isUnavailable = scan.status === 'AI_UNAVAILABLE' || scan.ai_status === 'UNAVAILABLE';
            const isDisease = !isUnavailable && scan.disease && !scan.disease.toLowerCase().includes('healthy') && !scan.disease.toLowerCase().includes('none');
            const isPest = !isUnavailable && scan.pest && !scan.pest.toLowerCase().includes('none');

            let spine = 'card-spine-primary';
            let badgeBg = 'bg-[#d5ffc1] text-[#245018]';
            let badgeIcon = 'check_circle';
            let badgeText = 'Healthy';
            let progressColor = 'bg-primary';

            if (isUnavailable) {
              spine = 'card-spine-warning';
              badgeBg = 'bg-surface-variant text-on-surface-variant';
              badgeIcon = 'cloud_off';
              badgeText = 'AI Analysis Unavailable';
              progressColor = 'bg-outline';
            } else if (isDisease) {
              spine = 'card-spine-danger';
              badgeBg = 'bg-error-container text-on-error-container';
              badgeIcon = 'warning';
              badgeText = scan.disease;
              progressColor = 'bg-error';
            } else if (isPest) {
              spine = 'card-spine-warning';
              badgeBg = 'bg-[#ffddb5] text-[#714800]';
              badgeIcon = 'bug_report';
              badgeText = scan.pest;
              progressColor = 'bg-[#fcb654]';
            }

            const zoneObj = zones.find(z => z.id === scan.zone_id) || { name: scan.zone_id };

            return `
              <article onclick="CropHealthView.showScanDetails('${scan.id}')" class="card-level-1 ${spine} rounded-lg p-5 flex flex-col justify-between gap-4 relative cursor-pointer hover:shadow-md transition-shadow">
                <span class="absolute top-4 right-4 font-data-md text-xs text-outline font-mono">${new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                
                <div class="flex gap-4 items-start">
                  <img src="${scan.image_url}" alt="Crop Scan" class="w-16 h-16 rounded object-cover border border-outline-variant shadow-sm" />
                  <div class="flex flex-col gap-0.5 mt-1">
                    <h3 class="font-headline-sm text-headline-sm text-on-surface leading-tight font-fraunces">${zoneObj.name}</h3>
                    <span class="font-label-caps text-xs text-on-surface-variant">${scan.crop || 'Crop Specimen'} • <span class="font-mono text-outline">${scan.status}</span></span>
                  </div>
                </div>

                <div class="border-t border-outline-variant/50 pt-3 mt-auto">
                  <div class="flex justify-between items-center mb-2">
                    <span class="px-2 py-1 rounded ${badgeBg} font-label-caps text-xs flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">${badgeIcon}</span> ${badgeText}
                    </span>
                    <span class="font-data-md text-data-md font-mono font-bold ${isUnavailable ? 'text-outline' : (isDisease ? 'text-error' : 'text-primary')}">
                      ${scan.confidence !== null && scan.confidence !== undefined ? `${scan.confidence}%` : '--'}
                    </span>
                  </div>
                  <div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div class="h-full ${progressColor}" style="width: ${scan.confidence || 0}%;"></div>
                  </div>
                  <span class="text-[10px] font-mono text-outline mt-2 block">[PROVENANCE: ${scan.provenance || 'VISION INFERENCE'}]</span>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

    } catch (err) {
      console.error('Error rendering crop health:', err);
      container.innerHTML = Components.renderErrorBanner(`Failed to load crop health scans: ${err.message}`, "CropHealthView.render(document.getElementById('main-content'))");
    }
  },

  setFilter(crop) {
    this.filterCrop = crop;
    this.render(document.getElementById('main-content'));
  },

  switchTab(tab) {
    if (tab === 'review') {
      App.navigate('review-queue');
    } else {
      this.activeTab = 'scans';
      this.render(document.getElementById('main-content'));
    }
  },

  openScanModal() {
    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-lg w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
          <div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">New Leaf Scan</h3>
            <p class="font-body-sm text-xs text-on-surface-variant">Sends actual image bytes to Google Gemini Vision AI model.</p>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <form id="scan-upload-form" onsubmit="CropHealthView.submitScan(event)" class="space-y-4">
          <div>
            <label class="font-label-caps text-xs text-outline block mb-1 uppercase">Field Zone (Baramati)</label>
            <select name="zone_id" id="scan-zone" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-body-md text-on-surface">
              <option value="zone-a">Zone A (Malegaon Khurd Plot)</option>
              <option value="zone-b">Zone B (Central Basin)</option>
              <option value="zone-c">Zone C (East Ridge)</option>
              <option value="zone-d">Zone D (South Field)</option>
            </select>
          </div>

          <!-- Drag and drop zone -->
          <div id="drop-zone" class="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-6 text-center cursor-pointer bg-[#FBFBF6] transition-colors" onclick="document.getElementById('scan-file-input').click()">
            <input type="file" id="scan-file-input" name="image" accept="image/*" class="hidden" onchange="CropHealthView.previewFile(this)" />
            <div id="drop-preview" class="flex flex-col items-center justify-center">
              <span class="material-symbols-outlined text-primary text-4xl mb-2">cloud_upload</span>
              <p class="font-body-md font-semibold text-on-surface">Click to upload or take a photo</p>
              <p class="font-body-sm text-xs text-outline mt-1">Transmits actual image bytes to Vision AI</p>
            </div>
          </div>

          <!-- Quick Test Photo Presets -->
          <div>
            <span class="font-label-caps text-xs text-outline uppercase block mb-1.5">Or choose a test sample:</span>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" onclick="CropHealthView.useSampleImage('rust')" class="p-2 text-left bg-surface rounded border border-outline-variant hover:border-primary text-xs flex items-center gap-2">
                <span class="material-symbols-outlined text-error text-sm">coronavirus</span> Wheat Leaf Rust
              </button>
              <button type="button" onclick="CropHealthView.useSampleImage('aphid')" class="p-2 text-left bg-surface rounded border border-outline-variant hover:border-primary text-xs flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary text-sm">bug_report</span> Aphid Infestation
              </button>
            </div>
          </div>

          <!-- Inference Progress State -->
          <div id="scan-progress" class="hidden space-y-2 pt-2">
            <div class="flex justify-between text-xs font-label-caps text-primary">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-primary animate-ping"></span> Vision AI processing pathology...</span>
              <span id="scan-percent">0%</span>
            </div>
            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div id="scan-bar" class="h-full bg-primary w-0 transition-all duration-300"></div>
            </div>
          </div>

          <div class="pt-2 flex justify-end gap-3">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg font-label-caps text-label-caps">Cancel</button>
            <button type="submit" id="btn-submit-scan" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps hover:opacity-90 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">biotech</span> Run Diagnosis
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  selectedSampleUrl: null,

  previewFile(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('drop-preview');
        preview.innerHTML = `
          <img src="${e.target.result}" class="max-h-32 rounded object-contain mb-2 border border-outline-variant" />
          <p class="font-body-sm text-xs text-primary font-semibold">${file.name}</p>
        `;
        this.selectedSampleUrl = null;
      };
      reader.readAsDataURL(file);
    }
  },

  useSampleImage(type) {
    const preview = document.getElementById('drop-preview');
    if (type === 'rust') {
      this.selectedSampleUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCeyOaFll6LFKwfiYxeM3M96KH2r0MlnLCU2IsqMrupXSgtralAW8VUoL_TTAAN9NsBfQ_I_1ovSl6O_v48Y53OwuNwrsRpLmesCNYIdgFiBveNLgh8y7-1JicEkJXhXI7CHoe-3jDjR5ePnAbTSma1KGeOtOPTuAA7CTEbQhttWWIC2HC8w4NE3E3qB055Zo7Xm9VisPqAezTYneYvDBQxxq7O5eXXzzWLWWnrcWheYZOHrc9g-Joz";
      preview.innerHTML = `<img src="${this.selectedSampleUrl}" class="max-h-32 rounded object-contain mb-2 border border-outline-variant" /><p class="font-body-sm text-xs text-error font-semibold">Selected: Wheat Leaf Rust Sample</p>`;
    } else {
      this.selectedSampleUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBlTnnOlC4-pBkdJmjAuMPFY9trrkX6nN-krrVjiUtDwuKW2SnGLnQN1fy3mPA1Y3b6plNJ_5BXldpuZCumtRhYA9n4RSznYZC_sLk_ZVNDwMnmvIw4o4DhSaMFMzxtVi1h748-q5_FwtJ5IlCcCBzpa7zdbaL_HWX2kVREocT1u-J6zbDv0SRi6ptAoRUdzQUc6fwTGumoR-RE6OtmzJ7QOMTeQO6lK0TCTaZvYKUMpD232LPlJT14";
      preview.innerHTML = `<img src="${this.selectedSampleUrl}" class="max-h-32 rounded object-contain mb-2 border border-outline-variant" /><p class="font-body-sm text-xs text-secondary font-semibold">Selected: Aphid Infestation Sample</p>`;
    }
  },

  async submitScan(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const progress = document.getElementById('scan-progress');
    const bar = document.getElementById('scan-bar');
    const percent = document.getElementById('scan-percent');
    const submitBtn = document.getElementById('btn-submit-scan');

    progress.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50');

    let progressVal = 10;
    const timer = setInterval(() => {
      progressVal = Math.min(progressVal + 15, 90);
      bar.style.width = `${progressVal}%`;
      percent.innerText = `${progressVal}%`;
    }, 200);

    try {
      if (this.selectedSampleUrl) {
        formData.append('image_url', this.selectedSampleUrl);
      }

      const res = await API.scanLeaf(formData);
      clearInterval(timer);
      bar.style.width = '100%';
      percent.innerText = '100%';

      setTimeout(() => {
        App.closeModal();
        if (res.success && res.prediction) {
          if (res.prediction.ai_status === 'UNAVAILABLE') {
            Components.showToast(`Scan saved. AI Analysis is currently unavailable (No fake diagnosis generated).`, 'info');
          } else {
            Components.showToast(`Scan complete: ${res.prediction.disease} (${res.prediction.confidence}% confidence)`, 'success');
          }
          CropHealthView.render(document.getElementById('main-content'));
        }
      }, 400);

    } catch (err) {
      clearInterval(timer);
      Components.showToast(`Diagnosis failed: ${err.message}`, 'error');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50');
      progress.classList.add('hidden');
    }
  },

  async showScanDetails(scanId) {
    const res = await API.getById('vision_predictions', scanId);
    const scan = res.data;
    if (!scan) return;

    const isUnavailable = scan.status === 'AI_UNAVAILABLE' || scan.ai_status === 'UNAVAILABLE';

    const modal = document.getElementById('app-modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
      <div class="p-6 max-w-xl w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl relative">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 text-outline hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-primary text-3xl">biotech</span>
          <div>
            <span class="font-label-caps text-xs text-outline uppercase font-mono">REPORT #${scan.id} • [PROVENANCE: ${scan.provenance || 'VISION INFERENCE'}]</span>
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-fraunces">${scan.crop}: ${scan.disease}</h3>
          </div>
        </div>

        <div class="furrow-divider"></div>

        <div class="space-y-4">
          <div class="aspect-video w-full rounded-lg overflow-hidden border border-outline-variant bg-surface-variant relative">
            <img src="${scan.image_url}" class="w-full h-full object-cover" />
            <div class="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm px-3 py-1 rounded text-xs font-mono font-bold text-on-surface">
              ${isUnavailable ? 'AI Analysis Unavailable' : `Confidence: ${scan.confidence}% (${scan.severity} Severity)`}
            </div>
          </div>

          <div class="bg-surface-container p-4 rounded-lg">
            <h4 class="font-label-caps text-xs text-outline uppercase mb-1">Pathology Findings</h4>
            <p class="font-body-md text-sm text-on-surface">${scan.notes || 'No specific notes.'}</p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 bg-surface rounded border border-outline-variant">
              <span class="font-label-caps text-xs text-outline block mb-1">Model & Provider</span>
              <span class="font-bold text-on-surface font-mono text-xs">${scan.model_provider || 'Google Gemini 1.5 Flash'}</span>
            </div>
            <div class="p-3 bg-surface rounded border border-outline-variant">
              <span class="font-label-caps text-xs text-outline block mb-1">Validation Status</span>
              <span class="font-bold text-on-surface font-mono text-xs">${scan.status}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button onclick="App.closeModal()" class="px-6 py-2 bg-primary text-surface rounded-lg font-label-caps text-label-caps">
            Close
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};
