const db = require('./db');

/**
 * Multimodal Risk & Decision Engine
 * Integrates: SENSORS + WEATHER + VISION AI + CROP STAGE + HISTORICAL LEDGER
 * -> COMPUTED DECISION + AUDIT TRACE + DYNAMIC MULTILINGUAL ADVISORY
 */
function evaluateZoneRisk(zoneId) {
  // 1. Get Zone Metadata (Crop, Growth Stage, Area)
  const zone = db.getById('zones', zoneId) || { id: zoneId, name: 'Zone', crop: 'Wheat (HD 2967)', growth_stage: 'Tillering', area_ha: 2.5 };

  // 2. Get latest sensor reading for zone
  const readings = db.find('sensor_readings', r => r.zone_id === zoneId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestSensor = readings[0] || { moisture: 30, temp: 28, humidity: 60, provenance: 'SIMULATED / DEMO' };

  // 3. Get latest weather data
  const weatherList = db.getAll('weather_data')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestWeather = weatherList[0] || { temp: 28, humidity: 60, rain_probability: 10, is_live: false, status: 'UNAVAILABLE' };

  // 4. Get latest vision prediction for zone
  const predictions = db.find('vision_predictions', p => p.zone_id === zoneId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestVision = predictions[0] || null;

  // 5. Get recent irrigation history for this zone
  const irrigationEvents = db.find('irrigation_events', e => e.zone_id === zoneId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const lastIrrigation = irrigationEvents[0] || null;

  // ==========================================
  // STEP 1: Compute Water Stress Risk (0.0 - 1.0)
  // ==========================================
  let water_stress_risk = 0.1;
  const moisture = Number(latestSensor.moisture) || 30;
  
  // Crop stage sensitivity: Tillering and Flowering have higher drought vulnerability
  const isCriticalStage = zone.growth_stage && (zone.growth_stage.includes('Tillering') || zone.growth_stage.includes('Flowering') || zone.growth_stage.includes('Grain Filling'));
  const criticalThreshold = isCriticalStage ? 22 : 18;

  if (moisture < 14) {
    water_stress_risk = 0.95;
  } else if (moisture < criticalThreshold) {
    water_stress_risk = 0.85;
  } else if (moisture < 25) {
    water_stress_risk = 0.50;
  } else if (moisture > 55) {
    water_stress_risk = 0.40; // Waterlogged risk
  } else {
    water_stress_risk = 0.15;
  }

  // ==========================================
  // STEP 2: Compute Pathogen / Disease Risk (0.0 - 1.0)
  // ==========================================
  let disease_risk = 0.1;
  const humidity = Number(latestSensor.humidity) || (latestWeather.humidity !== null ? Number(latestWeather.humidity) : 60);
  const temp = Number(latestSensor.temp) || (latestWeather.temp !== null ? Number(latestWeather.temp) : 28);

  // Microclimate fungal baseline
  if (humidity > 80 && temp >= 20 && temp <= 30) {
    disease_risk += 0.45;
  } else if (humidity > 70) {
    disease_risk += 0.25;
  }

  let aiDiagnosedDisease = null;
  let aiConfidence = null;

  // Integrate genuine AI vision outputs if available
  if (latestVision && latestVision.ai_status === 'SUCCESS' && latestVision.confidence !== null) {
    const hasDisease = latestVision.disease && !latestVision.disease.toLowerCase().includes('healthy') && !latestVision.disease.toLowerCase().includes('none');
    if (hasDisease) {
      aiDiagnosedDisease = latestVision.disease;
      aiConfidence = latestVision.confidence;
      const modelFactor = aiConfidence / 100;
      disease_risk = Math.max(disease_risk, modelFactor);
    }
  }
  disease_risk = Math.min(Math.max(disease_risk, 0.05), 0.99);

  // ==========================================
  // STEP 3: Compute Pest Risk (0.0 - 1.0)
  // ==========================================
  let pest_risk = 0.1;
  if (temp > 30 && humidity < 55) {
    pest_risk += 0.35; // Aphids & mites flourish in dry warm microclimates
  }
  let aiDiagnosedPest = null;
  if (latestVision && latestVision.ai_status === 'SUCCESS' && latestVision.pest && !latestVision.pest.toLowerCase().includes('none')) {
    aiDiagnosedPest = latestVision.pest;
    const modelFactor = (latestVision.confidence || 75) / 100;
    pest_risk = Math.max(pest_risk, modelFactor);
  }
  pest_risk = Math.min(Math.max(pest_risk, 0.05), 0.99);

  // ==========================================
  // STEP 4: Multimodal Decision Engine Rule Tree
  // ==========================================
  let computed_action = "OPTIMAL";
  const reasons = [];
  const rainProb = latestWeather.rain_probability !== null ? Number(latestWeather.rain_probability) : 10;

  if (water_stress_risk >= 0.7) {
    if (rainProb >= 60) {
      computed_action = "WAIT";
      reasons.push(`Soil moisture is depleted (${moisture}%), but Pune weather forecast indicates ${rainProb}% rain probability. Delaying irrigation to conserve reservoir water.`);
    } else {
      computed_action = "IRRIGATE";
      reasons.push(`Soil moisture is critically low at ${moisture}% (Threshold for ${zone.growth_stage || 'Active'} stage: ${criticalThreshold}%).`);
      reasons.push(`Canopy temperature is ${temp}°C in Baramati sector with low rain chance (${rainProb}%).`);
      reasons.push(`Recommended action: Actuate drip line for 8-12 minutes.`);
    }
  } else if (disease_risk >= 0.75) {
    computed_action = "PROTECT";
    reasons.push(`Elevated disease risk (${Math.round(disease_risk * 100)}%) detected in ${zone.name}.`);
    if (aiDiagnosedDisease) {
      reasons.push(`Vision AI diagnosed: ${aiDiagnosedDisease} (${aiConfidence}% confidence).`);
    } else if (latestVision && latestVision.ai_status === 'UNAVAILABLE') {
      reasons.push(`Microclimate humidity (${humidity}%) exceeds pathogen propagation threshold (AI vision service was unavailable).`);
    } else {
      reasons.push(`Sustained relative humidity (${humidity}%) at ${temp}°C creates high fungal sporulation risk.`);
    }
    reasons.push(`Recommended action: Apply protective bio-fungicide spray and isolate sector.`);
  } else if (pest_risk >= 0.75) {
    computed_action = "INSPECT";
    reasons.push(`Elevated pest risk (${Math.round(pest_risk * 100)}%) detected.`);
    if (aiDiagnosedPest) {
      reasons.push(`Vision AI identified: ${aiDiagnosedPest}.`);
    } else {
      reasons.push(`Dry ambient conditions (Temp: ${temp}°C, Humidity: ${humidity}%) favor aphid canopy colonisation.`);
    }
    reasons.push(`Recommended action: Visual inspection of underside leaves in perimeter rows.`);
  } else if (disease_risk >= 0.45 || pest_risk >= 0.45) {
    computed_action = "INSPECT";
    reasons.push(`Moderate risk detected (Disease: ${Math.round(disease_risk * 100)}%, Pest: ${Math.round(pest_risk * 100)}%).`);
    reasons.push(`Routine leaf inspection and continuous telemetry monitoring recommended.`);
  } else {
    computed_action = "OPTIMAL";
    reasons.push(`Soil moisture is balanced at ${moisture}% for ${zone.crop} (${zone.growth_stage}).`);
    reasons.push(`Canopy microclimate (Temp: ${temp}°C, Humidity: ${humidity}%) is within optimal agronomic parameters.`);
  }

  // ==========================================
  // STEP 5: Record into risk_scores Table
  // ==========================================
  const newRiskRecord = db.insert('risk_scores', {
    zone_id: zoneId,
    disease_risk: Number(disease_risk.toFixed(2)),
    pest_risk: Number(pest_risk.toFixed(2)),
    water_stress_risk: Number(water_stress_risk.toFixed(2)),
    computed_action,
    reasons,
    provenance: "CALCULATED (Multimodal Decision Engine)",
    inputs: {
      moisture,
      temp,
      humidity,
      rain_probability: rainProb,
      crop: zone.crop,
      growth_stage: zone.growth_stage,
      critical_threshold: criticalThreshold,
      ai_disease: aiDiagnosedDisease || (latestVision ? latestVision.disease : null),
      ai_confidence: aiConfidence,
      ai_status: latestVision ? latestVision.ai_status : "NO_SCANS",
      last_irrigation_date: lastIrrigation ? lastIrrigation.timestamp : null
    }
  });

  // ==========================================
  // STEP 6: End-to-End Dynamic Advisory Generation
  // Automatically generate multilingual advisory message when an action is required
  // ==========================================
  if (computed_action !== 'OPTIMAL') {
    generateDynamicAdvisory(zone, computed_action, reasons, aiDiagnosedDisease || aiDiagnosedPest);
  }

  return newRiskRecord;
}

/**
 * Generates and saves dynamic multilingual advisory notices
 */
function generateDynamicAdvisory(zone, action, reasons, pathologyName) {
  const existingRecent = db.find('advisory_messages', a => a.zone_id === zone.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  // Avoid spamming identical advisories within 1 hour
  if (existingRecent) {
    const elapsedMs = Date.now() - new Date(existingRecent.timestamp).getTime();
    if (elapsedMs < 60 * 60 * 1000 && existingRecent.category === action.toLowerCase()) {
      return;
    }
  }

  let category = 'water';
  let enMsg = '';
  let mrMsg = '';
  let hiMsg = '';

  if (action === 'IRRIGATE') {
    category = 'water';
    enMsg = `${zone.name}: Soil moisture critically low. Recommended to execute drip irrigation cycle for 8-12 minutes.`;
    mrMsg = `${zone.name}: जमिनीतील ओलावा अत्यंत कमी झाला आहे. 8 ते 12 मिनिटे ठिबक सिंचन सुरू करण्याचा सल्ला दिला जात आहे.`;
    hiMsg = `${zone.name}: मिट्टी में नमी का स्तर कम है। 8 से 12 मिनट के लिए ड्रिप सिंचाई चक्र चलाने की सलाह दी जाती है।`;
  } else if (action === 'PROTECT') {
    category = 'disease';
    const dName = pathologyName || 'Pathogen Infection';
    enMsg = `${zone.name}: Pathogen Alert — ${dName} risk elevated. Apply recommended fungicide and isolate zone perimeter.`;
    mrMsg = `${zone.name}: रोग चेतावणी — ${dName} चा धोका वाढला आहे. शिफारस केलेले बुरशीनाशक फवारा आणि क्षेत्राचे निरीक्षण करा.`;
    hiMsg = `${zone.name}: रोग चेतावनी — ${dName} का जोखिम बढ़ गया है। अनुशंसित कवकनाशी का छिड़काव करें।`;
  } else if (action === 'INSPECT') {
    category = 'pest';
    enMsg = `${zone.name}: Inspection Advisory — Environmental conditions indicate potential pest or disease stress. Visual leaf check recommended.`;
    mrMsg = `${zone.name}: पाहणी सल्ला — हवामानातील बदलांमुळे कीड किंवा रोगाचा धोका संभवतो. पानांची प्रत्यक्ष पाहणी करा.`;
    hiMsg = `${zone.name}: निरीक्षण सलाह — मौसम की स्थिति कीट या रोग के तनाव का संकेत देती है। पत्तियों की भौतिक जांच करें।`;
  } else if (action === 'WAIT') {
    category = 'water';
    enMsg = `${zone.name}: Rain Expected — High probability of precipitation. Irrigation postponed to conserve reservoir water.`;
    mrMsg = `${zone.name}: पावसाची शक्यता — पाऊस पडण्याची शक्यता जास्त आहे. पाणी बचतीसाठी सिंचन पुढे ढकलले आहे.`;
    hiMsg = `${zone.name}: बारिश की संभावना — वर्षा की उच्च संभावना है। पानी बचाने के लिए सिंचाई स्थगित की गई है।`;
  }

  db.insert('advisory_messages', {
    zone_id: zone.id,
    category,
    message_en: enMsg,
    message_mr: mrMsg,
    message_hi: hiMsg,
    read_status: false,
    provenance: "MULTIMODAL DECISION ENGINE"
  });
}

/**
 * Re-evaluates risk scores for all registered zones
 */
function evaluateAllZones() {
  const zones = db.getAll('zones');
  const results = [];
  for (const zone of zones) {
    results.push(evaluateZoneRisk(zone.id));
  }
  return results;
}

module.exports = {
  evaluateZoneRisk,
  evaluateAllZones
};
