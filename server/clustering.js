const db = require('./db');

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes data-driven geographic clusters of agricultural problems across farmers/farms.
 * Algorithm:
 * 1. Enriches every zone/farm with its latest sensor, risk, and vision diagnosis.
 * 2. Filters for active problem categories (Disease, Pest, Water Stress, Environmental).
 * 3. Clusters points of the SAME problem category within a spatial radius (default 2.5 km).
 * 4. Yields reproducible Hotspot entities with centroid, affected farmers, and severity breakdown.
 */
function generateHotspots(maxDistanceKm = 2.5) {
  const zones = db.getAll('zones');
  const farmers = db.getAll('farmers');
  const farms = db.getAll('farms');
  const predictions = db.getAll('vision_predictions');
  const sensorReadings = db.getAll('sensor_readings');
  const riskScores = db.getAll('risk_scores');

  // 1. Enrich every plot with current condition
  const enrichedPlots = zones.map(zone => {
    const farmer = farmers.find(f => f.id === zone.farmer_id) || { name: 'Unknown Farmer', location: 'Baramati' };
    const farm = farms.find(fm => fm.id === zone.farm_id) || { name: 'Main Farm', survey_number: 'N/A' };
    
    // Latest Vision Prediction
    const zonePreds = predictions.filter(p => p.zone_id === zone.id)
      .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
    const latestPred = zonePreds[0] || null;

    // Latest Sensor Reading
    const zoneReadings = sensorReadings.filter(r => r.zone_id === zone.id)
      .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
    const latestSensor = zoneReadings[0] || { moisture: 32, temp: 28, humidity: 60 };

    // Latest Risk Score
    const zoneRisks = riskScores.filter(r => r.zone_id === zone.id)
      .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime());
    const latestRisk = zoneRisks[0] || null;

    let category = "Healthy";
    let problem = "Optimal Growth Equilibrium";
    let severity = "Low";
    let confidence = 95;
    let markerColor = "green"; // green | red | orange | blue | yellow

    if (latestPred && latestPred.disease && !latestPred.disease.toLowerCase().includes('healthy') && !latestPred.disease.toLowerCase().includes('none') && !latestPred.disease.toLowerCase().includes('unavailable')) {
      category = "Disease";
      problem = latestPred.disease;
      severity = latestPred.severity || "High";
      confidence = latestPred.confidence || 90;
      markerColor = "red";
    } else if (latestPred && latestPred.pest && !latestPred.pest.toLowerCase().includes('none')) {
      category = "Pest";
      problem = latestPred.pest;
      severity = latestPred.severity || "Moderate";
      confidence = latestPred.confidence || 85;
      markerColor = "orange";
    } else if ((latestRisk && latestRisk.computed_action === 'IRRIGATE') || latestSensor.moisture < 20) {
      category = "Water Stress";
      problem = `Critical Soil Moisture Depletion (${latestSensor.moisture}%)`;
      severity = latestSensor.moisture < 15 ? "High" : "Moderate";
      confidence = 92;
      markerColor = "blue";
    } else if (latestSensor.temp > 35) {
      category = "Environmental Risk";
      problem = `Canopy Heat Stress (${latestSensor.temp}°C)`;
      severity = "Moderate";
      confidence = 88;
      markerColor = "yellow";
    }

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      farm_id: farm.id,
      farm_name: farm.name,
      survey_number: farm.survey_number,
      farmer_id: farmer.id,
      farmer_name: farmer.name,
      farmer_location: farmer.location,
      contact: farmer.contact,
      crop: zone.crop,
      growth_stage: zone.growth_stage,
      lat: Number(zone.lat) || 18.155,
      lng: Number(zone.lng) || 74.580,
      area_ha: zone.area_ha || 2.0,
      category,
      problem,
      severity,
      confidence,
      markerColor,
      timestamp: latestPred ? latestPred.timestamp : (latestSensor.timestamp || new Date().toISOString())
    };
  });

  // 2. Cluster non-healthy plots by Problem Category and Spatial Distance
  const problemPlots = enrichedPlots.filter(p => p.category !== "Healthy");
  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < problemPlots.length; i++) {
    const plotA = problemPlots[i];
    if (visited.has(plotA.zone_id)) continue;

    const currentCluster = [plotA];
    visited.add(plotA.zone_id);

    for (let j = i + 1; j < problemPlots.length; j++) {
      const plotB = problemPlots[j];
      if (visited.has(plotB.zone_id)) continue;

      // Must be same problem category
      if (plotA.category === plotB.category) {
        const dist = calculateDistanceKm(plotA.lat, plotA.lng, plotB.lat, plotB.lng);
        if (dist <= maxDistanceKm) {
          currentCluster.push(plotB);
          visited.add(plotB.zone_id);
        }
      }
    }

    clusters.push(currentCluster);
  }

  // 3. Format Hotspots (Single or Multi-point clusters with problems)
  const hotspots = clusters.map((cluster, idx) => {
    const category = cluster[0].category;
    const problem = cluster[0].problem;
    const centerLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
    const centerLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;
    
    // Unique farmers and farms
    const uniqueFarmers = Array.from(new Set(cluster.map(p => p.farmer_id)));
    const uniqueFarms = Array.from(new Set(cluster.map(p => p.farm_id)));
    const crops = Array.from(new Set(cluster.map(p => p.crop))).join(', ');

    // Avg confidence & Severity Breakdown
    const avgConfidence = Math.round(cluster.reduce((sum, p) => sum + p.confidence, 0) / cluster.length);
    const severityBreakdown = { High: 0, Moderate: 0, Low: 0 };
    cluster.forEach(p => {
      if (p.severity === 'High') severityBreakdown.High++;
      else if (p.severity === 'Moderate') severityBreakdown.Moderate++;
      else severityBreakdown.Low++;
    });

    let radiusKm = 0.8;
    cluster.forEach(p => {
      const d = calculateDistanceKm(centerLat, centerLng, p.lat, p.lng);
      if (d > radiusKm) radiusKm = Number((d * 1.2).toFixed(2));
    });

    const locationName = cluster[0].farmer_location ? cluster[0].farmer_location.split(',')[0] : 'Baramati Sector';

    return {
      id: `hotspot-${category.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}`,
      name: `${locationName} ${category} Hotspot`,
      category,
      problem,
      center_lat: Number(centerLat.toFixed(4)),
      center_lng: Number(centerLng.toFixed(4)),
      radius_km: radiusKm,
      farmer_count: uniqueFarmers.length,
      farm_count: uniqueFarms.length,
      zone_count: cluster.length,
      crop: crops,
      avg_confidence: avgConfidence,
      severity_breakdown: severityBreakdown,
      affected_farmers: cluster.map(p => ({
        farmer_id: p.farmer_id,
        farmer_name: p.farmer_name,
        farmer_location: p.farmer_location,
        contact: p.contact,
        farm_name: p.farm_name,
        zone_id: p.zone_id,
        zone_name: p.zone_name,
        crop: p.crop,
        problem: p.problem,
        severity: p.severity,
        confidence: p.confidence
      })),
      provenance: "CALCULATED VIA GEOSPATIAL CLUSTERING"
    };
  });

  return {
    hotspots,
    all_plots: enrichedPlots,
    hotspot_count: hotspots.length,
    monitored_plots_count: enrichedPlots.length,
    provenance: "CALCULATED VIA GEOSPATIAL CLUSTERING"
  };
}

module.exports = {
  calculateDistanceKm,
  generateHotspots
};
