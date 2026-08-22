const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./db');
const { updateWeatherData, getLatestWeather, DEFAULT_LOCATION } = require('./weather');
const { analyzeCropImage } = require('./vision');
const {
  ingestSensorReading,
  handleHardwareAck,
  triggerIrrigation,
  startSensorSimulator,
  setSimulatorState,
  getRelayState,
  getHardwareStatus,
  setTelemetryMode,
  getZoneReadings
} = require('./hardware');
const { evaluateAllZones, evaluateZoneRisk } = require('./riskEngine');
const { generateHotspots } = require('./clustering');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup upload directory for vision scans
const upload = multer({
  dest: path.join(__dirname, '..', 'public', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple Auth & Role State
let currentSession = {
  user_id: "user-1",
  name: "Ramesh Patel",
  role: "Farmer", // "Farmer" | "OrgExpert"
  farmer_id: "farmer-1",
  org_id: "org-pune-baramati"
};

// =================== AUTH ROUTES ===================
app.get('/api/auth/session', (req, res) => {
  res.json({ success: true, session: currentSession });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { role } = req.body;
  if (role === 'Farmer' || role === 'OrgExpert') {
    currentSession.role = role;
    if (role === 'Farmer') {
      currentSession.name = "Ramesh Patel";
      currentSession.farmer_id = "farmer-1";
    } else {
      currentSession.name = "Dr. Anita Deshmukh (KVK Baramati Expert)";
      currentSession.farmer_id = null;
    }
  }
  res.json({ success: true, session: currentSession });
});

// =================== HARDWARE & TELEMETRY MODE ROUTES ===================
app.post('/api/sensor-readings', (req, res) => {
  try {
    const {
      device_id,
      farm_id,
      zone_id,
      soil_moisture,
      moisture,
      temperature,
      temp,
      humidity,
      timestamp,
      device_status,
      battery_pct,
      is_physical,
      source
    } = req.body;

    const result = ingestSensorReading({
      device_id,
      farm_id,
      zone_id,
      soil_moisture,
      moisture,
      temperature,
      temp,
      humidity,
      timestamp,
      device_status,
      battery_pct,
      is_physical: is_physical !== undefined ? is_physical : true,
      source: source || 'PHYSICAL_ESP32'
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Filtered readings respecting active mode (Demo vs Live Hardware)
app.get('/api/sensor-readings/filtered', (req, res) => {
  try {
    const { zone_id } = req.query;
    const readings = getZoneReadings(zone_id);
    const hwStatus = getHardwareStatus();
    res.json({
      success: true,
      mode: hwStatus.mode,
      data: readings,
      isPhysicalLive: hwStatus.isPhysicalLive,
      provenance: hwStatus.mode === 'LIVE_HARDWARE' ? 'REAL SENSOR (ESP32 Node)' : 'SIMULATED / DEMO'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/irrigation/trigger', (req, res) => {
  try {
    const { zone_id, duration_minutes, trigger_source } = req.body;
    const result = triggerIrrigation({ zone_id, duration_minutes, trigger_source });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/irrigation/status', (req, res) => {
  res.json({ success: true, relay_state: getRelayState() });
});

app.post('/api/irrigation/ack', (req, res) => {
  try {
    const { device_id, cycle_id, relay_status } = req.body;
    const result = handleHardwareAck({ device_id, cycle_id, relay_status });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/hardware/status', (req, res) => {
  res.json({ success: true, status: getHardwareStatus() });
});

// Switch Operating Mode: 'DEMO' | 'LIVE_HARDWARE'
app.post('/api/hardware/set-mode', (req, res) => {
  const { mode } = req.body;
  const status = setTelemetryMode(mode);
  res.json({ success: true, status });
});

// Allows triggering a test physical packet to verify "ESP32 Live" indicator transition
app.post('/api/hardware/simulate-physical-pulse', (req, res) => {
  const result = ingestSensorReading({
    device_id: 'SMP-9021',
    zone_id: 'zone-a',
    moisture: 33.2,
    temp: 27.5,
    humidity: 64.0,
    is_physical: true,
    source: 'PHYSICAL_ESP32'
  });
  res.json({ success: true, hardware_status: getHardwareStatus(), reading: result });
});

app.post('/api/simulator/toggle', (req, res) => {
  const { active } = req.body;
  const result = setSimulatorState(active);
  res.json({ success: true, ...result });
});

// =================== WEATHER & MICROCLIMATE ===================
app.get('/api/weather/current', (req, res) => {
  const weather = getLatestWeather();
  res.json({ success: true, weather });
});

app.post('/api/weather/sync', async (req, res) => {
  try {
    const updated = await updateWeatherData();
    res.json({ success: true, weather: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== VISION AI SCANNING ===================
app.post('/api/vision/scan', upload.single('image'), async (req, res) => {
  try {
    const { zone_id, farmer_id, image_url, crop } = req.body;
    let imageBuffer = null;
    let mimeType = null;
    let filename = null;

    if (req.file) {
      const fs = require('fs');
      imageBuffer = fs.readFileSync(req.file.path);
      mimeType = req.file.mimetype;
      filename = req.file.filename;
    }

    const prediction = await analyzeCropImage({
      imageBuffer,
      mimeType,
      filename,
      zone_id: zone_id || 'zone-a',
      farmer_id: farmer_id || currentSession.farmer_id || 'farmer-1',
      image_url
    });

    res.status(201).json({ success: true, prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== RISK & DECISION ENGINE ===================
app.get('/api/risk-scores/latest', (req, res) => {
  try {
    const list = evaluateAllZones();
    const map = {};
    list.forEach(item => {
      if (item && item.zone_id) {
        map[item.zone_id] = item;
      }
    });
    res.json({ success: true, risk_scores: map, list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/risk-scores/zone/:id', (req, res) => {
  try {
    const score = evaluateZoneRisk(req.params.id);
    res.json({ success: true, risk_score: score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== EXPERT VALIDATION & ACTIONS ===================
app.post('/api/expert-validations/action', (req, res) => {
  const { prediction_id, status, notes } = req.body;
  
  if (currentSession.role !== 'OrgExpert') {
    return res.status(403).json({ error: "Unauthorized. Action restricted to Agronomist / OrgExpert role." });
  }

  if (!prediction_id || !status) {
    return res.status(400).json({ error: "Missing required fields: prediction_id, status" });
  }

  // Update vision_predictions table
  const updatedPrediction = db.update('vision_predictions', prediction_id, {
    status,
    expert_notes: notes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: currentSession.name
  });

  if (!updatedPrediction) {
    return res.status(404).json({ error: "Prediction case not found" });
  }

  // Log in expert_validations table
  const validation = db.insert('expert_validations', {
    prediction_id,
    status,
    expert_id: currentSession.user_id,
    notes: notes || `Diagnostic marked as ${status}`,
    provenance: "EXPERT VALIDATION (Human-in-the-loop)"
  });

  res.json({ success: true, validation, prediction: updatedPrediction });
});

// =================== ORGANIZATION / FPO WORKFLOW ROUTES ===================
app.post('/api/alerts/:id/assign-officer', (req, res) => {
  try {
    const { id } = req.params;
    const { officer_id } = req.body;
    const officer = db.getById('experts', officer_id) || { name: 'Sanjay Kulkarni' };

    const updated = db.update('alerts', id, {
      status: 'INSPECTION_ASSIGNED',
      assigned_officer_id: officer_id,
      assigned_officer_name: officer.name,
      assigned_at: new Date().toISOString()
    });

    if (!updated) return res.status(404).json({ error: "Alert not found" });
    res.json({ success: true, alert: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance_tickets/:id/assign-technician', (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;
    const tech = db.getById('technicians', technician_id) || { name: 'Kavita Jagtap' };

    const updated = db.update('maintenance_tickets', id, {
      status: 'IN_PROGRESS',
      assigned_technician_id: technician_id,
      assigned_technician_name: tech.name,
      assigned_at: new Date().toISOString()
    });

    if (!updated) return res.status(404).json({ error: "Ticket not found" });
    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance_tickets/:id/update-status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = db.update('maintenance_tickets', id, {
      status: status || 'RESOLVED',
      resolved_at: status === 'RESOLVED' ? new Date().toISOString() : null,
      notes: notes || undefined
    });

    if (!updated) return res.status(404).json({ error: "Ticket not found" });
    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/organization/analytics', (req, res) => {
  try {
    const farmers = db.getAll('farmers');
    const farms = db.getAll('farms');
    const zones = db.getAll('zones');
    const devices = db.getAll('devices');
    const alerts = db.getAll('alerts');
    const tickets = db.getAll('maintenance_tickets');
    const predictions = db.getAll('vision_predictions');
    const events = db.getAll('irrigation_events');

    const totalHectares = zones.reduce((acc, z) => acc + (Number(z.area_ha) || 0), 0);
    const totalWaterLiters = events.reduce((acc, e) => acc + (Number(e.water_used_liters) || 0), 0);
    const openAlerts = alerts.filter(a => a.status !== 'RESOLVED');
    const openTickets = tickets.filter(t => t.status !== 'RESOLVED');

    res.json({
      success: true,
      analytics: {
        total_farmers: farmers.length,
        total_farms: farms.length,
        total_zones: zones.length,
        total_devices: devices.length,
        total_hectares: Number(totalHectares.toFixed(1)),
        total_water_used_liters: totalWaterLiters,
        active_alerts_count: openAlerts.length,
        open_tickets_count: openTickets.length,
        total_vision_scans: predictions.length,
        provenance: "CALCULATED FROM DATABASE RELATIONS"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== GEOSPATIAL HOTSPOTS & CLUSTERING ===================
app.get('/api/hotspots', (req, res) => {
  try {
    const result = generateHotspots(2.5); // 2.5 km clustering radius
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== GENERIC CRUD ROUTES FOR ALL 16 TABLES ===================
const allowedTables = [
  'organizations',
  'farmers',
  'farms',
  'zones',
  'devices',
  'experts',
  'technicians',
  'alerts',
  'sensor_readings',
  'vision_predictions',
  'weather_data',
  'risk_scores',
  'irrigation_events',
  'advisory_messages',
  'expert_validations',
  'maintenance_tickets'
];

app.get('/api/:table', (req, res) => {
  const { table } = req.params;
  if (!allowedTables.includes(table)) {
    return res.status(404).json({ error: `Table '${table}' not found` });
  }
  let data = db.getAll(table);
  data = [...data].sort((a, b) => {
    const tA = new Date(a.timestamp || a.created_at || 0).getTime();
    const tB = new Date(b.timestamp || b.created_at || 0).getTime();
    return tB - tA;
  });
  res.json({ success: true, data });
});

app.get('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  if (!allowedTables.includes(table)) {
    return res.status(404).json({ error: `Table '${table}' not found` });
  }
  const record = db.getById(table, id);
  if (!record) return res.status(404).json({ error: "Record not found" });
  res.json({ success: true, data: record });
});

app.post('/api/:table', (req, res) => {
  const { table } = req.params;
  if (!allowedTables.includes(table)) return res.status(404).json({ error: "Not found" });
  const created = db.insert(table, req.body);
  res.status(201).json({ success: true, data: created });
});

app.put('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  if (!allowedTables.includes(table)) return res.status(404).json({ error: "Not found" });
  const updated = db.update(table, id, req.body);
  if (!updated) return res.status(404).json({ error: "Record not found" });
  res.json({ success: true, data: updated });
});

app.delete('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  if (!allowedTables.includes(table)) return res.status(404).json({ error: "Not found" });
  const deleted = db.delete(table, id);
  res.json({ success: deleted });
});

// Single Page Application Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server & Background Services
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🌱 Krishi Vikas AI Server running at http://localhost:${PORT}`);
  console.log(`📍 Region: Baramati Taluka, Pune District (18.15° N, 74.58° E)`);
  console.log(`📡 ESP32 Sensor Telemetry: POST http://localhost:${PORT}/api/sensor-readings`);
  console.log(`💧 ESP32 Pump Trigger: POST http://localhost:${PORT}/api/irrigation/trigger`);
  console.log(`👁️ Vision AI Inference: POST http://localhost:${PORT}/api/vision/scan`);
  console.log(`=======================================================`);

  // Initialize weather and risk calculations
  await updateWeatherData();
  evaluateAllZones();

  // Start background sensor simulation (15s interval) for Demo mode
  startSensorSimulator(15000);
});
