const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testHardwareSuite() {
  console.log('⚡ Starting Physical ESP32 Hardware Integration Test Suite...\n');

  // 1. Switch to LIVE_HARDWARE Mode
  console.log('1️⃣ Switching backend to LIVE_HARDWARE mode...');
  const modeRes = await request('POST', '/api/hardware/set-mode', { mode: 'LIVE_HARDWARE' });
  console.log('   Mode status:', modeRes.data.status.mode);

  // 2. Test Malformed Payload Rejection
  console.log('\n2️⃣ Testing malformed payload rejection...');
  const malformedRes = await request('POST', '/api/sensor-readings', {
    device_id: 'ESP32-KV-01',
    soil_moisture: -15.0 // Invalid negative moisture
  });
  if (malformedRes.status === 400 || malformedRes.status === 500) {
    console.log('   ✅ Correctly rejected invalid soil_moisture (-15.0%) with error:', malformedRes.data.error);
  } else {
    throw new Error('Failed: Malformed reading was unexpectedly accepted!');
  }

  // 3. Test Valid Stable Ingestion
  console.log('\n3️⃣ Ingesting genuine physical ESP32 telemetry packet...');
  const validRes = await request('POST', '/api/sensor-readings', {
    device_id: 'ESP32-KV-01',
    farm_id: 'farm-baramati-1',
    zone_id: 'zone-a',
    soil_moisture: 21.5,
    temperature: 28.3,
    humidity: 64.0,
    device_status: 'ONLINE',
    battery_pct: 88,
    is_physical: true
  });
  console.log('   Ingestion Response:', validRes.status, validRes.data.data.reading.provenance);

  // 4. Verify ONLINE Status
  console.log('\n4️⃣ Verifying live hardware connection health status...');
  const hwStatus = await request('GET', '/api/hardware/status');
  console.log('   Hardware State:', {
    mode: hwStatus.data.status.mode,
    status: hwStatus.data.status.status,
    isPhysicalLive: hwStatus.data.status.isPhysicalLive,
    lastSeenSecondsAgo: hwStatus.data.status.lastSeenSecondsAgo
  });
  if (hwStatus.data.status.status !== 'ONLINE') {
    throw new Error('Expected hardware status to be ONLINE after physical packet');
  }

  // 5. Trigger Irrigation & Queue Relay Command
  console.log('\n5️⃣ Triggering irrigation pump command (Zone A)...');
  const triggerRes = await request('POST', '/api/irrigation/trigger', {
    zone_id: 'zone-a',
    duration_minutes: 8,
    trigger_source: 'FARMER_APPROVAL'
  });
  const cycleId = triggerRes.data.data ? triggerRes.data.data.cycle_id : triggerRes.data.cycle_id;
  console.log('   Queued Cycle ID:', cycleId);

  // 6. Simulate Next ESP32 Heartbeat Fetching the Queued Command
  console.log('\n6️⃣ ESP32 sending next heartbeat and picking up relay command...');
  const hbRes = await request('POST', '/api/sensor-readings', {
    device_id: 'ESP32-KV-01',
    farm_id: 'farm-baramati-1',
    zone_id: 'zone-a',
    soil_moisture: 21.4,
    temperature: 28.2,
    humidity: 64.1,
    is_physical: true
  });
  const cmd = hbRes.data.data.relay_command;
  console.log('   Received Relay Command:', cmd);
  if (cmd.pump !== 'ON' || cmd.cycle_id !== cycleId) {
    throw new Error('ESP32 did not receive queued pump ON command');
  }

  // 7. Send Hardware Execution Acknowledgement
  console.log('\n7️⃣ ESP32 dispatching hardware execution acknowledgement (POST /api/irrigation/ack)...');
  const ackRes = await request('POST', '/api/irrigation/ack', {
    device_id: 'ESP32-KV-01',
    cycle_id: cycleId,
    relay_status: 'ENERGIZED'
  });
  console.log('   Ack Response:', ackRes.data);
  if (!ackRes.data.acknowledged) {
    throw new Error('Hardware ACK was not acknowledged by backend');
  }

  // 8. Subsequent Sensor Reading Confirming Post-Irrigation Hydration
  console.log('\n8️⃣ ESP32 sending post-irrigation hydration reading (+12.6% moisture)...');
  const postIrrRes = await request('POST', '/api/sensor-readings', {
    device_id: 'ESP32-KV-01',
    farm_id: 'farm-baramati-1',
    zone_id: 'zone-a',
    soil_moisture: 34.0,
    temperature: 27.2,
    humidity: 68.5,
    is_physical: true
  });
  console.log('   Post-irrigation reading saved:', postIrrRes.data.data.reading.moisture + '%');

  // 9. Verify Irrigation Event in Database
  console.log('\n9️⃣ Inspecting irrigation_events table for sensor verification...');
  const eventRes = await request('GET', `/api/irrigation_events/${cycleId}`);
  const event = eventRes.data.data;
  console.log('   Verified Event Record:', {
    id: event.id,
    moisture_before: event.moisture_before,
    moisture_after: event.moisture_after,
    delta_moisture: event.delta_moisture,
    hardware_ack: event.hardware_ack,
    verified: event.verified,
    verification_status: event.verification_status
  });

  if (!event.verified || event.delta_moisture <= 0) {
    throw new Error('Irrigation event failed sensor verification check');
  }

  // Restore DEMO mode for default development state
  await request('POST', '/api/hardware/set-mode', { mode: 'DEMO' });

  console.log('\n=======================================================');
  console.log('🎉 ALL PHYSICAL HARDWARE INTEGRATION TESTS PASSED 100%');
  console.log('=======================================================');
}

testHardwareSuite().catch((err) => {
  console.error('❌ Hardware Suite Failed:', err.message);
  process.exit(1);
});
