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

async function testCompletePipeline() {
  console.log('🧪 Testing Full AI & Multimodal Decision Chain:');
  console.log('CAMERA / IMAGE -> AI MODEL -> PREDICTION -> DB -> RISK -> DECISION -> ADVISORY\n');

  // Step 1: Scan a crop leaf image
  console.log('1️⃣ Step 1: Uploading leaf image for vision inference...');
  const scanRes = await request('POST', '/api/vision/scan', {
    zone_id: 'zone-a',
    farmer_id: 'farmer-1',
    crop: 'Wheat (HD 2967)',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeyOaFll6LFKwfiYxeM3M96KH2r0MlnLCU2IsqMrupXSgtralAW8VUoL_TTAAN9NsBfQ_I_1ovSl6O_v48Y53OwuNwrsRpLmesCNYIdgFiBveNLgh8y7-1JicEkJXhXI7CHoe-3jDjR5ePnAbTSma1KGeOtOPTuAA7CTEbQhttWWIC2HC8w4NE3E3qB055Zo7Xm9VisPqAezTYneYvDBQxxq7O5eXXzzWLWWnrcWheYZOHrc9g-Joz'
  });

  console.log('   Response Status:', scanRes.status);
  const pred = scanRes.data.prediction;
  console.log('   Prediction Record:', {
    id: pred.id,
    crop: pred.crop,
    disease: pred.disease,
    confidence: pred.confidence,
    status: pred.status,
    ai_status: pred.ai_status,
    model_provider: pred.model_provider
  });

  if (!pred || !pred.id) {
    throw new Error('Step 1 Failed: No prediction record returned');
  }

  // Step 2: Query Database to verify persistence
  console.log('\n2️⃣ Step 2: Verifying database persistence in vision_predictions...');
  const dbRes = await request('GET', `/api/vision_predictions/${pred.id}`);
  if (dbRes.status !== 200 || !dbRes.data.data) {
    throw new Error('Step 2 Failed: Record not found in database');
  }
  console.log('   Confirmed record in database:', dbRes.data.data.id, 'with disease:', dbRes.data.data.disease);

  // Step 3: Query Risk & Decision Engine for this zone
  console.log('\n3️⃣ Step 3: Evaluating Multimodal Risk & Decision Engine for Zone A...');
  const riskRes = await request('GET', '/api/risk-scores/zone/zone-a');
  if (riskRes.status !== 200 || !riskRes.data.risk_score) {
    throw new Error('Step 3 Failed: Risk score unavailable');
  }
  const score = riskRes.data.risk_score;
  console.log('   Risk Results:', {
    zone_id: score.zone_id,
    computed_action: score.computed_action,
    water_stress_risk: score.water_stress_risk,
    disease_risk: score.disease_risk,
    pest_risk: score.pest_risk,
    reasons: score.reasons
  });

  // Step 4: Verify Dynamic Multilingual Advisory Generation
  console.log('\n4️⃣ Step 4: Verifying auto-generated Advisory Notice in database...');
  const advRes = await request('GET', '/api/advisory_messages');
  const advisories = advRes.data.data || [];
  const latestAdv = advisories.find(a => a.zone_id === 'zone-a');
  if (!latestAdv) {
    throw new Error('Step 4 Failed: No advisory generated for Zone A');
  }
  console.log('   Generated Advisory Notice:');
  console.log('   - English (ENG):', latestAdv.message_en);
  console.log('   - Marathi (मराठी):', latestAdv.message_mr);
  console.log('   - Hindi   (हिंदी):', latestAdv.message_hi);
  console.log('   - Category:', latestAdv.category);
  console.log('   - Provenance:', latestAdv.provenance);

  console.log('\n=======================================================');
  console.log('🎉 FULL MULTIMODAL AI & ADVISORY PIPELINE VERIFIED 100%');
  console.log('=======================================================');
}

testCompletePipeline().catch((err) => {
  console.error('❌ Pipeline Test Failed:', err.message);
  process.exit(1);
});
