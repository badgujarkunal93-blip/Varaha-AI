// Krishi Vikas AI - UI Components & Helpers

const Components = {
  // Toast Alert System
  showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'check_circle';
    let iconColor = 'text-primary';
    if (type === 'error') {
      icon = 'error';
      iconColor = 'text-error';
    } else if (type === 'warning') {
      icon = 'warning';
      iconColor = 'text-secondary';
    } else if (type === 'info') {
      icon = 'info';
      iconColor = 'text-tertiary';
    }

    toast.innerHTML = `
      <span class="material-symbols-outlined ${iconColor}" style="font-variation-settings: 'FILL' 1;">${icon}</span>
      <div class="flex-1 text-sm font-medium text-on-surface">${message}</div>
      <button class="text-outline hover:text-on-surface text-sm" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  // Sun-Ring Radial Arc Gauge Component
  renderSunRing(percent, label = 'Optimal', colorClass = 'primary', size = 160) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // ~251.3
    const fillLength = (percent / 100) * circumference;
    const dashArray = `${fillLength.toFixed(1)} ${circumference.toFixed(1)}`;

    let fillClass = 'sun-ring-fill-primary';
    let textClass = 'text-primary';
    if (colorClass === 'warning' || (percent >= 50 && percent < 75)) {
      fillClass = 'sun-ring-fill-warning';
      textClass = 'text-secondary';
    } else if (colorClass === 'danger' || percent >= 75) {
      fillClass = 'sun-ring-fill-danger';
      textClass = 'text-error';
    }

    return `
      <div class="relative flex flex-col items-center justify-center" style="width: ${size}px; height: ${size}px;">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle class="sun-ring-bg" cx="50" cy="50" r="${radius}"></circle>
          <circle class="${fillClass}" cx="50" cy="50" r="${radius}" stroke-dasharray="${dashArray}"></circle>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="font-display-md text-display-md ${textClass} leading-none">${percent}%</span>
          <span class="font-label-caps text-label-caps text-on-surface-variant mt-1 uppercase">${label}</span>
        </div>
      </div>
    `;
  },

  // Empty State Generator
  renderEmptyState(icon, title, description, actionBtn = null) {
    return `
      <div class="card-level-1 p-12 text-center flex flex-col items-center justify-center my-6">
        <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mb-4">
          <span class="material-symbols-outlined text-3xl">${icon}</span>
        </div>
        <h4 class="font-headline-sm text-headline-sm text-on-surface mb-2">${title}</h4>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">${description}</p>
        ${actionBtn ? actionBtn : ''}
      </div>
    `;
  },

  // Error State Banner
  renderErrorBanner(message, onRetry = null) {
    return `
      <div class="bg-error-container/30 border border-error text-on-error-container rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-error text-2xl">sensors_off</span>
          <div>
            <p class="font-body-md font-semibold text-error">${message}</p>
            <p class="font-body-sm text-on-surface-variant">Sensor data unavailable — check device connection or telemetry simulator.</p>
          </div>
        </div>
        ${onRetry ? `<button onclick="${onRetry}" class="px-4 py-2 bg-error text-on-error rounded font-label-caps text-label-caps hover:opacity-90">Retry</button>` : ''}
      </div>
    `;
  },

  // Skeleton Loader
  renderSkeletonCard() {
    return `
      <div class="card-level-1 p-6 space-y-4">
        <div class="h-4 w-1/3 skeleton"></div>
        <div class="h-8 w-2/3 skeleton"></div>
        <div class="h-3 w-1/2 skeleton"></div>
      </div>
    `;
  }
};
