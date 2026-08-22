const db = require('./db');
const { evaluateZoneRisk } = require('./riskEngine');

// Mode: 'DEMO' | 'LIVE_HARDWARE'
let currentMode = 'DEMO';

// State of physical ESP32 hardware
let lastPhysicalEsp32Timestamp = 0;
let lastPhysicalReading = null;
let registeredDevices = {
  'ESP32-KV-01': { name: 'Baramati Sector A Node', farm_id: 'farm-baramati-1', zone_id: 'zone-a', status: 'ACTIVE' },
  'SMP-9021': { name: 'Baramati Sector A Node (Legacy ID)', farm_id: 'farm-baramati-1', zone_id: 'zone-a', status: 'ACTIVE' },
  'SMP-9022': { name: 'Central Basin Probe', farm_id: 'farm-baramati-1', zone_id: 'zone-b', status: 'ACTIVE' }
};

// Active relay commands queued for physical ESP32
let activeRelayState = {
  pumpActive: false,
  targetZone: null,
  durationMinutes: 0,
  cycleId: null,
  startedAt: null,
  endsAt: null,
  acknowledgedByHardware: false,
  verifiedBySensor: false
};

// Pending irrigation events awaiting post-irrigation sensor verification
let pendingVerificationEventId = null;

// Simulator control
let simulatorTimer = null;
let simulatorActive = true;

/**
 * Ingest sensor reading from either physical ESP32 or simulated source
 */
function ingestSensorReading({
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
  is_physical = false,
  source
}) {
  const isPhysical = Boolean(is_physical || source === 'PHYSICAL_ESP32');
  const resolvedDeviceId = device_id || 'ESP32-KV-01';

  // 1. Device Validation
  if (isPhysical && !registeredDevices[resolvedDeviceId]) {
    // Auto-register discovered physical device
    registeredDevices[resolvedDeviceId] = {
      name: `Discovered Node (${resolvedDeviceId})`,
      farm_id: farm_id || 'farm-baramati-1',
      zone_id: zone_id || 'zone-a',
      status: 'ACTIVE'
    };
  }

  // 2. Numerical extraction & Validation
  const rawMoisture = soil_moisture !== undefined ? soil_moisture : moisture;
  const rawTemp = temperature !== undefined ? temperature : temp;
  const rawHumidity = humidity;

  if (rawMoisture === undefined || rawMoisture === null || isNaN(parseFloat(rawMoisture))) {
    throw new Error("Invalid payload: 'soil_moisture' (or 'moisture') must be a valid number between 0 and 100");
  }

  const numMoisture = parseFloat(rawMoisture);
  if (numMoisture < 0 || numMoisture > 100) {
    throw new Error(`Out of range: soil_moisture must be between 0% and 100% (received ${numMoisture}%)`);
  }

  const numTemp = rawTemp !== undefined && !isNaN(parseFloat(rawTemp)) ? parseFloat(rawTemp) : 28.0;
  if (numTemp < -15 || numTemp > 65) {
    throw new Error(`Out of range: temperature must be between -15°C and 65°C (received ${numTemp}°C)`);
  }

  const numHumidity = rawHumidity !== undefined && !isNaN(parseFloat(rawHumidity)) ? parseFloat(rawHumidity) : 60.0;
  if (numHumidity < 0 || numHumidity > 100) {
    throw new Error(`Out of range: humidity must be between 0% and 100% (received ${numHumidity}%)`);
  }

  const resolvedZoneId = zone_id || (registeredDevices[resolvedDeviceId] ? registeredDevices[resolvedDeviceId].zone_id : 'zone-a');
  const resolvedFarmId = farm_id || (registeredDevices[resolvedDeviceId] ? registeredDevices[resolvedDeviceId].farm_id : 'farm-baramati-1');

  if (isPhysical) {
    lastPhysicalEsp32Timestamp = Date.now();
  }

  // 3. Construct Record
  const readingRecord = {
    device_id: resolvedDeviceId,
    farm_id: resolvedFarmId,
    zone_id: resolvedZoneId,
    moisture: Number(numMoisture.toFixed(1)),
    soil_moisture: Number(numMoisture.toFixed(1)),
    temp: Number(numTemp.toFixed(1)),
    temperature: Number(numTemp.toFixed(1)),
    humidity: Number(numHumidity.toFixed(1)),
    battery_pct: battery_pct ? Number(battery_pct) : 85,
    device_status: isPhysical ? 'ONLINE' : (device_status || 'SIMULATED'),
    source: isPhysical ? 'PHYSICAL_ESP32' : 'SIMULATED',
    is_demo: !isPhysical,
    provenance: isPhysical ? 'REAL SENSOR (ESP32 Physical Node)' : 'SIMULATED / DEMO',
    device_timestamp: timestamp || new Date().toISOString()
  };

  const reading = db.insert('sensor_readings', readingRecord);

  if (isPhysical) {
    lastPhysicalReading = reading;
  }

  // 4. Verification Check: If an irrigation cycle was executed and acknowledged by hardware, verify actual hydration
  if (pendingVerificationEventId && isPhysical && activeRelayState.acknowledgedByHardware) {
    const event = db.getById('irrigation_events', pendingVerificationEventId);
    if (event && event.zone_id === resolvedZoneId) {
      const delta = Number((reading.moisture - event.moisture_before).toFixed(1));
      db.update('irrigation_events', pendingVerificationEventId, {
        moisture_after: reading.moisture,
        delta_moisture: delta,
        verified: true,
        verified_at: new Date().toISOString(),
        verification_status: delta > 0 ? "CONFIRMED_HYDRATION" : "NO_MOISTURE_INCREASE_DETECTED"
      });
      activeRelayState.verifiedBySensor = true;
      pendingVerificationEventId = null;
      activeRelayState.pumpActive = false;
      console.log(`💧 [IRRIGATION VERIFIED] Zone ${resolvedZoneId} moisture changed: ${event.moisture_before}% -> ${reading.moisture}% (Delta: +${delta}%)`);
    }
  }

  // 5. Re-run Risk & Decision calculation
  const riskResult = evaluateZoneRisk(reading.zone_id);

  // 6. Return response with pending relay actuation command if active
  return {
    reading,
    risk: riskResult,
    relay_command: activeRelayState.pumpActive && activeRelayState.targetZone === resolvedZoneId ? {
      pump: "ON",
      duration_minutes: activeRelayState.durationMinutes,
      cycle_id: activeRelayState.cycleId
    } : {
      pump: "OFF",
      cycle_id: null
    }
  };
}

/**
 * Handle Hardware Execution Acknowledgement from ESP32
 */
function handleHardwareAck({ device_id, cycle_id, relay_status }) {
  if (activeRelayState.cycleId === cycle_id || (cycle_id && !activeRelayState.cycleId)) {
    activeRelayState.acknowledgedByHardware = true;
    console.log(`✅ [ESP32 ACK] Device ${device_id} acknowledged pump relay status: ${relay_status} (Cycle: ${cycle_id})`);
    
    // Update irrigation event with acknowledgement
    if (cycle_id) {
      db.update('irrigation_events', cycle_id, {
        hardware_ack: true,
        acknowledged_at: new Date().toISOString()
      });
    }
    return { success: true, acknowledged: true };
  }
  return { success: true, acknowledged: false, message: "Cycle ID mismatch or expired." };
}

/**
 * Trigger irrigation cycle (Farmer Approval -> Backend Command Queue)
 */
function triggerIrrigation({ zone_id, duration_minutes = 8, trigger_source = 'MANUAL_OVERRIDE' }) {
  const hw = getHardwareStatus();
  const zone = db.getById('zones', zone_id) || { id: zone_id, name: 'Zone B' };
  
  const readings = getZoneReadings(zone_id);
  const latest = readings[0] || { moisture: 18.0, temp: 28.0, humidity: 65.0 };
  const moistureBefore = latest.moisture;

  const cycleId = `irr-${Date.now()}`;
  const waterUsedLiters = duration_minutes * 1450;

  activeRelayState = {
    pumpActive: true,
    targetZone: zone_id,
    durationMinutes: duration_minutes,
    cycleId,
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + duration_minutes * 60 * 1000).toISOString(),
    acknowledgedByHardware: false,
    verifiedBySensor: false
  };

  const isLiveOffline = currentMode === 'LIVE_HARDWARE' && hw.status === 'OFFLINE';

  const event = db.insert('irrigation_events', {
    id: cycleId,
    zone_id,
    trigger_source,
    moisture_before: moistureBefore,
    moisture_after: isLiveOffline ? moistureBefore : Number((moistureBefore + (duration_minutes * 2.2)).toFixed(1)),
    water_used_liters: waterUsedLiters,
    duration_minutes,
    outcome: isLiveOffline ? "QUEUED_AWAITING_HARDWARE" : "SUCCESS",
    hardware_ack: false,
    verified: false,
    provenance: isLiveOffline ? "QUEUED (Physical ESP32 Offline)" : "CALCULATED & ACTUATED"
  });

  if (currentMode === 'LIVE_HARDWARE') {
    pendingVerificationEventId = cycleId;
  } else {
    // In demo mode, inject immediate post-hydration reading
    const expectedMoistureAfter = Math.min(moistureBefore + (duration_minutes * 2.2), 38.5);
    db.insert('sensor_readings', {
      device_id: zone.device_id || 'ESP32-KV-01',
      zone_id,
      moisture: Number(expectedMoistureAfter.toFixed(1)),
      soil_moisture: Number(expectedMoistureAfter.toFixed(1)),
      temp: latest.temp ? latest.temp - 1.2 : 27.5,
      humidity: latest.humidity ? latest.humidity + 4.5 : 68.0,
      source: 'SIMULATED',
      is_demo: true,
      provenance: 'SIMULATED / DEMO (Hydration Response)'
    });
  }

  evaluateZoneRisk(zone_id);

  return {
    status: isLiveOffline ? "COMMAND_QUEUED_HARDWARE_OFFLINE" : "IRRIGATION_TRIGGERED",
    event,
    cycle_id: cycleId,
    relay_state: activeRelayState,
    hardware_status: hw.status
  };
}

/**
 * Returns readings for a zone based on the active mode (Demo vs Live)
 */
function getZoneReadings(zoneId = null) {
  let list = db.getAll('sensor_readings');
  if (zoneId && zoneId !== 'all') {
    list = list.filter(r => r.zone_id === zoneId);
  }

  if (currentMode === 'LIVE_HARDWARE') {
    // Strictly isolate: return only genuine physical ESP32 telemetry
    return list.filter(r => r.source === 'PHYSICAL_ESP32')
      .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
  }

  // In DEMO mode, return full historical demo readings
  return list.sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
}

/**
 * Return live hardware connection health: ONLINE, STALE, or OFFLINE
 */
function getHardwareStatus() {
  const elapsedSec = lastPhysicalEsp32Timestamp > 0
    ? Math.round((Date.now() - lastPhysicalEsp32Timestamp) / 1000)
    : null;
  
  let status = 'OFFLINE';
  if (lastPhysicalEsp32Timestamp > 0 && elapsedSec !== null) {
    if (elapsedSec <= 45) {
      status = 'ONLINE';
    } else if (elapsedSec <= 180) {
      status = 'STALE';
    } else {
      status = 'OFFLINE';
    }
  }

  let modeLabel = '';
  if (currentMode === 'DEMO') {
    modeLabel = 'DEMO MODE (Simulated Pune Telemetry)';
  } else {
    if (status === 'ONLINE') {
      modeLabel = 'LIVE HARDWARE: ONLINE (ESP32 Connected - Baramati Grid)';
    } else if (status === 'STALE') {
      modeLabel = `LIVE HARDWARE: STALE (Last Packet ${elapsedSec}s ago)`;
    } else {
      modeLabel = 'LIVE HARDWARE: OFFLINE (Awaiting ESP32 Packet)';
    }
  }

  return {
    mode: currentMode,
    status, // 'ONLINE' | 'STALE' | 'OFFLINE'
    isPhysicalLive: status === 'ONLINE',
    lastSeenSecondsAgo: elapsedSec,
    lastSeenTimestamp: lastPhysicalEsp32Timestamp > 0 ? new Date(lastPhysicalEsp32Timestamp).toISOString() : null,
    simulatorActive: currentMode === 'DEMO' && simulatorActive,
    label: modeLabel,
    activeRelayState,
    deviceId: 'ESP32-KV-01',
    firmware: 'v2.2.0 (Arduino ESP32)'
  };
}

/**
 * Switch operating mode
 */
function setTelemetryMode(newMode) {
  if (newMode === 'DEMO' || newMode === 'LIVE_HARDWARE') {
    currentMode = newMode;
    if (newMode === 'LIVE_HARDWARE') {
      simulatorActive = false;
      if (simulatorTimer) clearInterval(simulatorTimer);
      console.log('⚡ Switched to LIVE HARDWARE MODE: Simulator stopped. Listening for physical ESP32 packets.');
    } else {
      simulatorActive = true;
      startSensorSimulator(15000);
      console.log('🔘 Switched to DEMO MODE: Simulator resumed with clearly labelled demo ticks.');
    }
  }
  return getHardwareStatus();
}

/**
 * Background simulator for Demo mode only
 */
function startSensorSimulator(intervalMs = 15000) {
  if (simulatorTimer) clearInterval(simulatorTimer);
  if (currentMode !== 'DEMO') return;

  simulatorTimer = setInterval(() => {
    if (!simulatorActive || currentMode !== 'DEMO') return;

    const zones = db.getAll('zones');
    for (const z of zones) {
      const lastReadings = db.find('sensor_readings', r => r.zone_id === z.id)
        .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
      const last = lastReadings[0] || { moisture: 32, temp: 27, humidity: 64 };

      const moistureJitter = (Math.random() * 0.4 - 0.2);
      const tempJitter = (Math.random() * 0.4 - 0.2);
      const humidityJitter = (Math.random() * 0.8 - 0.4);

      let newMoisture = Math.max(10, Math.min(50, last.moisture + moistureJitter));
      let newTemp = Math.max(18, Math.min(38, last.temp + tempJitter));
      let newHum = Math.max(30, Math.min(95, last.humidity + humidityJitter));

      if (z.id === 'zone-b' && newMoisture > 22) {
        newMoisture = 16.2;
      }

      db.insert('sensor_readings', {
        device_id: z.device_id || 'ESP32-KV-01',
        farm_id: 'farm-baramati-1',
        zone_id: z.id,
        moisture: Number(newMoisture.toFixed(1)),
        soil_moisture: Number(newMoisture.toFixed(1)),
        temp: Number(newTemp.toFixed(1)),
        temperature: Number(newTemp.toFixed(1)),
        humidity: Number(newHum.toFixed(1)),
        battery_pct: 86,
        device_status: 'SIMULATED',
        source: 'SIMULATED',
        is_demo: true,
        provenance: 'SIMULATED / DEMO'
      });

      evaluateZoneRisk(z.id);
    }
  }, intervalMs);
}

function setSimulatorState(active) {
  simulatorActive = Boolean(active);
  return { simulatorActive };
}

module.exports = {
  ingestSensorReading,
  handleHardwareAck,
  triggerIrrigation,
  startSensorSimulator,
  setSimulatorState,
  getZoneReadings,
  getRelayState: () => activeRelayState,
  getHardwareStatus,
  setTelemetryMode
};
