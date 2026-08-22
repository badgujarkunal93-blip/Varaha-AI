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

async function runTests() {
  console.log('🚀 Starting Krishi Vikas AI Automated Endpoints Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // 1. Test Session & Auth
  await test('GET /api/auth/session', async () => {
    const res = await request('GET', '/api/auth/session');
    if (res.status !== 200 || !res.data.session) throw new Error('Invalid session response');
  });

  await test('POST /api/auth/switch-role (Switch to OrgExpert)', async () => {
    const res = await request('POST', '/api/auth/switch-role', { role: 'OrgExpert' });
    if (res.status !== 200 || res.data.session.role !== 'OrgExpert') throw new Error('Role switch failed');
  });

  // 2. Test ESP32 Sensor Telemetry Ingestion
  await test('POST /api/sensor-readings (ESP32 Ingestion)', async () => {
    const res = await request('POST', '/api/sensor-readings', {
      device_id: 'SMP-9021',
      zone_id: 'zone-a',
      moisture: 31.5,
      temp: 28.2,
      humidity: 64.0
    });
    if (res.status !== 201 || !res.data.data.reading) throw new Error('Telemetry ingestion failed');
  });

  // 3. Test Weather Current & Sync
  await test('GET /api/weather/current', async () => {
    const res = await request('GET', '/api/weather/current');
    if (res.status !== 200 || !res.data.weather) throw new Error('Failed to fetch weather');
  });

  // 4. Test Irrigation Pump Trigger
  await test('POST /api/irrigation/trigger', async () => {
    const res = await request('POST', '/api/irrigation/trigger', {
      zone_id: 'zone-b',
      duration_minutes: 8,
      trigger_source: 'MANUAL_OVERRIDE'
    });
    if (res.status !== 200 || !res.data.data.event) throw new Error('Irrigation trigger failed');
  });

  // 5. Test Risk & Decision Engine Calculation
  await test('GET /api/risk-scores/latest', async () => {
    const res = await request('GET', '/api/risk-scores/latest');
    if (res.status !== 200 || !res.data.risk_scores['zone-a']) throw new Error('Risk scores unavailable');
  });

  // 6. Test Vision Scan Creation
  await test('POST /api/vision/scan', async () => {
    const res = await request('POST', '/api/vision/scan', {
      zone_id: 'zone-a',
      crop: 'Winter Wheat',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeyOaFll6LFKwfiYxeM3M96KH2r0MlnLCU2IsqMrupXSgtralAW8VUoL_TTAAN9NsBfQ_I_1ovSl6O_v48Y53OwuNwrsRpLmesCNYIdgFiBveNLgh8y7-1JicEkJXhXI7CHoe-3jDjR5ePnAbTSma1KGeOtOPTuAA7CTEbQhttWWIC2HC8w4NE3E3qB055Zo7Xm9VisPqAezTYneYvDBQxxq7O5eXXzzWLWWnrcWheYZOHrc9g-Joz'
    });
    if (res.status !== 201 || !res.data.prediction) throw new Error('Vision scan creation failed');
  });

  // 7. Test Expert Validation Action (Confirm Diagnosis)
  await test('POST /api/expert-validations/action', async () => {
    const res = await request('POST', '/api/expert-validations/action', {
      prediction_id: 'vp-1',
      status: 'CONFIRMED',
      notes: 'Diagnostic confirmed by Senior Extension Agronomist.'
    });
    if (res.status !== 200 || !res.data.validation) throw new Error('Expert action failed');
  });

  // 8. Test Multilingual Advisory Messages Table
  await test('GET /api/advisory_messages', async () => {
    const res = await request('GET', '/api/advisory_messages');
    if (res.status !== 200 || !res.data.data.length) throw new Error('Advisories not retrieved');
    const first = res.data.data[0];
    if (!first.message_en || !first.message_mr || !first.message_hi) {
      throw new Error('Advisory missing multilingual fields');
    }
  });

  // 9. Test Maintenance Ticket Creation
  await test('POST /api/maintenance_tickets', async () => {
    const res = await request('POST', '/api/maintenance_tickets', {
      device_id: 'SMP-9022',
      issue: 'Battery recalibration request',
      status: 'OPEN',
      assigned_to: 'Field Tech (Kavita)'
    });
    if (res.status !== 201 || !res.data.data.id) throw new Error('Ticket creation failed');
  });

  // 10. Test Hardware Mode Switcher (Demo vs Live Hardware)
  await test('POST /api/hardware/set-mode (Switch to LIVE_HARDWARE)', async () => {
    const res = await request('POST', '/api/hardware/set-mode', { mode: 'LIVE_HARDWARE' });
    if (res.status !== 200 || res.data.status.mode !== 'LIVE_HARDWARE') throw new Error('Failed to switch mode to LIVE_HARDWARE');
  });

  await test('GET /api/sensor-readings/filtered (Live mode filters simulated readings)', async () => {
    const res = await request('GET', '/api/sensor-readings/filtered');
    if (res.status !== 200 || res.data.mode !== 'LIVE_HARDWARE') throw new Error('Filtered endpoint did not report LIVE_HARDWARE mode');
  });

  // Switch back to DEMO mode
  await test('POST /api/hardware/set-mode (Switch back to DEMO)', async () => {
    const res = await request('POST', '/api/hardware/set-mode', { mode: 'DEMO' });
    if (res.status !== 200 || res.data.status.mode !== 'DEMO') throw new Error('Failed to switch mode to DEMO');
  });

  // Switch back to Farmer role
  await request('POST', '/api/auth/switch-role', { role: 'Farmer' });

  console.log(`\n=======================================================`);
  console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`=======================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Allow time for server to start if running directly
runTests();
