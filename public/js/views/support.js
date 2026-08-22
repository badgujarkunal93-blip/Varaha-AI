// View: Support & Agronomy Expert Assistance (KVK Baramati, Pune)

const SupportView = {
  async render(container) {
    container.innerHTML = `
      <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 class="font-display-md text-display-md text-on-surface font-fraunces">Expert Support & Agronomy Desk</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">Connect directly with Krishi Vigyan Kendra (KVK) Baramati agronomists and technical support.</p>
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter-grid">
          <!-- Card 1: KVK Baramati Agronomist Hotline -->
          <div class="card-level-1 card-spine-primary p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-2xl">call</span>
              </div>
              <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">KVK Baramati Helpline</h3>
              <p class="font-body-sm text-xs text-on-surface-variant mt-1">Direct voice consultation with certified crop pathology and soil health specialists.</p>
              <div class="mt-4 p-3 bg-surface rounded border border-outline-variant">
                <span class="font-mono text-base font-bold text-primary block">02112-255227</span>
                <span class="text-[11px] text-outline">KVK Baramati Agronomy Desk • 08:00 AM - 06:00 PM</span>
              </div>
            </div>
            <button onclick="Components.showToast('Calling KVK Baramati Desk (02112-255227)...', 'info')" class="w-full py-2.5 bg-primary text-surface rounded-lg font-label-caps text-xs font-bold hover:opacity-90">
              Call Helpline
            </button>
          </div>

          <!-- Card 2: Field Officer Inspection Request -->
          <div class="card-level-1 card-spine-tertiary p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-2xl">person_pin_circle</span>
              </div>
              <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Field Officer Visit</h3>
              <p class="font-body-sm text-xs text-on-surface-variant mt-1">Request an on-site soil and leaf sampling verification by local extension officer.</p>
              <div class="mt-4 p-3 bg-surface rounded border border-outline-variant text-xs space-y-1">
                <div>Assigned Agronomist: <span class="font-semibold">Sanjay Kulkarni</span></div>
                <div>Station: <span class="font-semibold">KVK Baramati Agricultural Center</span></div>
              </div>
            </div>
            <button onclick="SupportView.requestVisit()" class="w-full py-2.5 border border-tertiary text-tertiary rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container">
              Schedule Field Visit
            </button>
          </div>

          <!-- Card 3: Knowledge Base & Guides -->
          <div class="card-level-1 card-spine-warning p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <h3 class="font-headline-sm text-lg font-fraunces text-on-surface">Pathology Manual</h3>
              <p class="font-body-sm text-xs text-on-surface-variant mt-1">Integrated Pest & Disease Management protocols for Pune district wheat, sugarcane, and vegetables.</p>
              <div class="mt-4 p-3 bg-surface rounded border border-outline-variant text-xs space-y-1">
                <div>• Wheat Leaf Rust spray regimens</div>
                <div>• Precision drip scheduling during tillering</div>
              </div>
            </div>
            <button onclick="Components.showToast('Opening KVK Baramati IPM Manual...', 'info')" class="w-full py-2.5 border border-secondary text-secondary rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container">
              Read Protocols
            </button>
          </div>
        </div>
      </div>
    `;
  },

  requestVisit() {
    Components.showToast('Field inspection request registered. KVK Baramati Officer will arrive within 24 hours.', 'success');
  }
};
