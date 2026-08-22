// Krishi Vikas AI - Frontend API Client

const API = {
  async request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // Auth & Roles
  getSession: () => API.request('/api/auth/session'),
  switchRole: (role) => API.request('/api/auth/switch-role', 'POST', { role }),

  // Weather
  getWeather: () => API.request('/api/weather/current'),
  syncWeather: () => API.request('/api/weather/sync', 'POST'),

  // Hardware, Telemetry & Mode
  getFilteredReadings: (zone_id = null) => API.request(`/api/sensor-readings/filtered${zone_id ? `?zone_id=${zone_id}` : ''}`),
  postSensorReading: (data) => API.request('/api/sensor-readings', 'POST', data),
  triggerIrrigation: (zone_id, duration_minutes, trigger_source) =>
    API.request('/api/irrigation/trigger', 'POST', { zone_id, duration_minutes, trigger_source }),
  getIrrigationStatus: () => API.request('/api/irrigation/status'),
  getHardwareStatus: () => API.request('/api/hardware/status'),
  setTelemetryMode: (mode) => API.request('/api/hardware/set-mode', 'POST', { mode }),
  simulatePhysicalPulse: () => API.request('/api/hardware/simulate-physical-pulse', 'POST'),
  toggleSimulator: (active) => API.request('/api/simulator/toggle', 'POST', { active }),
  ackIrrigation: (device_id, cycle_id, relay_status) =>
    API.request('/api/irrigation/ack', 'POST', { device_id, cycle_id, relay_status }),

  // Risk Scores & Hotspots
  getRiskScores: () => API.request('/api/risk-scores/latest'),
  getZoneRisk: (zoneId) => API.request(`/api/risk-scores/zone/${zoneId}`),
  getHotspots: () => API.request('/api/hotspots'),

  // Vision AI
  scanLeaf: async (formData) => {
    const res = await fetch('/api/vision/scan', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // Expert Validation
  expertAction: (prediction_id, status, notes) =>
    API.request('/api/expert-validations/action', 'POST', { prediction_id, status, notes }),

  // Organization Workflows & Service Layer
  assignOfficerToAlert: (alert_id, officer_id) =>
    API.request(`/api/alerts/${alert_id}/assign-officer`, 'POST', { officer_id }),
  assignTechnicianToTicket: (ticket_id, technician_id) =>
    API.request(`/api/maintenance_tickets/${ticket_id}/assign-technician`, 'POST', { technician_id }),
  updateTicketStatus: (ticket_id, status, notes) =>
    API.request(`/api/maintenance_tickets/${ticket_id}/update-status`, 'POST', { status, notes }),
  getOrgAnalytics: () => API.request('/api/organization/analytics'),

  // Generic 16 Table CRUD
  getTable: (tableName) => API.request(`/api/${tableName}`),
  getById: (tableName, id) => API.request(`/api/${tableName}/${id}`),
  createRecord: (tableName, data) => API.request(`/api/${tableName}`, 'POST', data),
  updateRecord: (tableName, id, data) => API.request(`/api/${tableName}/${id}`, 'PUT', data),
  deleteRecord: (tableName, id) => API.request(`/api/${tableName}/${id}`, 'DELETE')
};
