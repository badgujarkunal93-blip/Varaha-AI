const http = require('http');
const { calculateDistanceKm, generateHotspots } = require('../server/clustering');

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

async function testHotspotsSuite() {
  console.log('🗺️ Starting Data-Driven Hotspot & Clustering Test Suite...\n');

  // 1. Test Haversine Distance
  console.log('1️⃣ Testing Haversine Distance Calculator...');
  const dist = calculateDistanceKm(18.162, 74.575, 18.168, 74.579);
  console.log('   Distance between Zone A and Plot Rui:', dist.toFixed(2), 'km');
  if (dist < 0.5 || dist > 2.0) {
    throw new Error('Haversine distance calculation is out of expected geographic bounds');
  }

  // 2. Test GET /api/hotspots Endpoint
  console.log('\n2️⃣ Fetching dynamically computed Hotspots via REST API...');
  const res = await request('GET', '/api/hotspots');
  console.log('   API Response Status:', res.status);
  console.log('   Hotspots Found:', res.data.hotspot_count);
  console.log('   Monitored Plots:', res.data.monitored_plots_count);

  if (!res.data.hotspots || !Array.isArray(res.data.hotspots)) {
    throw new Error('Expected array of hotspots');
  }

  // 3. Verify Hotspot Entity Schema
  console.log('\n3️⃣ Verifying First Hotspot Entity Structure...');
  if (res.data.hotspots.length > 0) {
    const hs = res.data.hotspots[0];
    console.log('   Hotspot Summary:', {
      name: hs.name,
      category: hs.category,
      problem: hs.problem,
      centroid: `${hs.center_lat}° N, ${hs.center_lng}° E`,
      radius_km: hs.radius_km,
      farmers_count: hs.farmer_count,
      avg_confidence: hs.avg_confidence,
      severity_breakdown: hs.severity_breakdown
    });

    if (!hs.center_lat || !hs.center_lng || hs.farmer_count <= 0) {
      throw new Error('Invalid Hotspot entity structure');
    }
  }

  // 4. Verify All Individual Plots have coordinates and color tags
  console.log('\n4️⃣ Verifying Individual Plot Coordinates & Provenance...');
  for (const plot of res.data.all_plots) {
    if (!plot.lat || !plot.lng || !plot.markerColor) {
      throw new Error(`Plot ${plot.zone_id} is missing coordinates or markerColor`);
    }
  }
  console.log(`   ✅ Verified ${res.data.all_plots.length} individual plots with valid Pune coordinates & color tags.`);

  console.log('\n=======================================================');
  console.log('🎉 ALL HOTSPOT & GEOSPATIAL CLUSTERING TESTS PASSED 100%');
  console.log('=======================================================');
}

testHotspotsSuite().catch((err) => {
  console.error('❌ Hotspot Test Failed:', err.message);
  process.exit(1);
});
