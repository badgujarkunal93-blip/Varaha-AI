// Seed Dataset for Krishi Vikas AI
// Region: Baramati Taluka, Pune District, Maharashtra (18.15° N, 74.58° E)
// Complete Relational Hierarchy: Organization -> Farmers -> Farms -> Zones -> Devices

const now = Date.now();
const hourMs = 3600000;

function createSeedData() {
  return {
    organizations: [
      {
        id: "org-pune-baramati",
        name: "Baramati Taluka Kisan Vikas FPO",
        district: "Pune",
        state: "Maharashtra",
        taluka: "Baramati",
        headquarters: "KVK Agricultural Extension Hub, Baramati",
        contact: "+91 02112-255227",
        registered_farmers_count: 4,
        total_hectares: 14.6,
        is_demo: true,
        provenance: "FPO REGISTRY"
      }
    ],
    farmers: [
      {
        id: "farmer-1",
        org_id: "org-pune-baramati",
        name: "Ramesh Patel",
        contact: "+91 98230 45123",
        location: "Malegaon Khurd, Baramati, Pune",
        crop: "Wheat (HD 2967)",
        acres: 12.5,
        created_at: new Date(now - hourMs * 48).toISOString()
      },
      {
        id: "farmer-2",
        org_id: "org-pune-baramati",
        name: "Rajesh Patil",
        contact: "+91 94222 18901",
        location: "Rui Village, Baramati, Pune",
        crop: "Wheat (Lok-1)",
        acres: 8.0,
        created_at: new Date(now - hourMs * 40).toISOString()
      },
      {
        id: "farmer-3",
        org_id: "org-pune-baramati",
        name: "Sunita Pawar",
        contact: "+91 97654 32109",
        location: "Jalochi, Baramati, Pune",
        crop: "Sweet Corn & Wheat",
        acres: 6.5,
        created_at: new Date(now - hourMs * 30).toISOString()
      },
      {
        id: "farmer-4",
        org_id: "org-pune-baramati",
        name: "Vikram Shinde",
        contact: "+91 98811 76543",
        location: "Kattebhel, Baramati, Pune",
        crop: "Soybeans & Sugarcane",
        acres: 10.0,
        created_at: new Date(now - hourMs * 20).toISOString()
      }
    ],
    farms: [
      {
        id: "farm-1",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-1",
        name: "Ramesh Patel Main Farm",
        survey_number: "74/2A",
        village: "Malegaon Khurd",
        taluka: "Baramati",
        total_ha: 5.0,
        created_at: new Date(now - hourMs * 48).toISOString()
      },
      {
        id: "farm-2",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-2",
        name: "Rajesh Patil Rui Holdings",
        survey_number: "112/1B",
        village: "Rui Village",
        taluka: "Baramati",
        total_ha: 3.2,
        created_at: new Date(now - hourMs * 40).toISOString()
      },
      {
        id: "farm-3",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-3",
        name: "Sunita Pawar Jalochi Plot",
        survey_number: "45/3",
        village: "Jalochi",
        taluka: "Baramati",
        total_ha: 2.6,
        created_at: new Date(now - hourMs * 30).toISOString()
      },
      {
        id: "farm-4",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-4",
        name: "Vikram Shinde Kattebhel Agro",
        survey_number: "88/4C",
        village: "Kattebhel",
        taluka: "Baramati",
        total_ha: 3.8,
        created_at: new Date(now - hourMs * 20).toISOString()
      }
    ],
    zones: [
      { id: "zone-a", org_id: "org-pune-baramati", farm_id: "farm-1", farmer_id: "farmer-1", name: "Zone A (North Plot)", crop: "Wheat", growth_stage: "Tillering", lat: 18.162, lng: 74.575, area_ha: 2.4, device_id: "ESP32-KV-01" },
      { id: "zone-b", org_id: "org-pune-baramati", farm_id: "farm-1", farmer_id: "farmer-1", name: "Zone B (Central Basin)", crop: "Wheat", growth_stage: "Tillering", lat: 18.155, lng: 74.582, area_ha: 1.8, device_id: "SMP-9022" },
      { id: "zone-c", org_id: "org-pune-baramati", farm_id: "farm-1", farmer_id: "farmer-1", name: "Zone C (East Ridge)", crop: "Wheat", growth_stage: "Crown Root", lat: 18.158, lng: 74.591, area_ha: 3.1, device_id: "SMP-9023" },
      { id: "zone-d", org_id: "org-pune-baramati", farm_id: "farm-1", farmer_id: "farmer-1", name: "Zone D (South Field)", crop: "Wheat", growth_stage: "Tillering", lat: 18.145, lng: 74.572, area_ha: 1.2, device_id: "SMP-9024" },
      { id: "zone-north-1", org_id: "org-pune-baramati", farm_id: "farm-2", farmer_id: "farmer-2", name: "Plot R1 (Rui)", crop: "Wheat", growth_stage: "Tillering", lat: 18.168, lng: 74.579, area_ha: 2.2, device_id: "SMP-9025" },
      { id: "zone-south-1", org_id: "org-pune-baramati", farm_id: "farm-3", farmer_id: "farmer-3", name: "Plot J2 (Jalochi)", crop: "Sweet Corn", growth_stage: "Vegetative", lat: 18.140, lng: 74.585, area_ha: 1.9, device_id: "SMP-9026" },
      { id: "zone-east-1", org_id: "org-pune-baramati", farm_id: "farm-4", farmer_id: "farmer-4", name: "Plot K3 (Kattebhel)", crop: "Soybeans", growth_stage: "Flowering", lat: 18.152, lng: 74.598, area_ha: 3.0, device_id: "SMP-9027" }
    ],
    devices: [
      { id: "ESP32-KV-01", org_id: "org-pune-baramati", farm_id: "farm-1", zone_id: "zone-a", farmer_id: "farmer-1", type: "ESP32_SOIL_CANOPY_NODE", status: "ONLINE", battery_pct: 88, firmware: "v2.2.0", installed_at: "2026-01-10T00:00:00.000Z" },
      { id: "SMP-9022", org_id: "org-pune-baramati", farm_id: "farm-1", zone_id: "zone-b", farmer_id: "farmer-1", type: "CAPACITIVE_PROBE_SOLAR", status: "ONLINE", battery_pct: 78, firmware: "v2.1.4", installed_at: "2026-01-12T00:00:00.000Z" },
      { id: "SMP-9023", org_id: "org-pune-baramati", farm_id: "farm-1", zone_id: "zone-c", farmer_id: "farmer-1", type: "CAPACITIVE_PROBE_SOLAR", status: "ONLINE", battery_pct: 85, firmware: "v2.1.4", installed_at: "2026-01-12T00:00:00.000Z" },
      { id: "SMP-9024", org_id: "org-pune-baramati", farm_id: "farm-1", zone_id: "zone-d", farmer_id: "farmer-1", type: "CAPACITIVE_PROBE_SOLAR", status: "ONLINE", battery_pct: 92, firmware: "v2.1.4", installed_at: "2026-01-15T00:00:00.000Z" },
      { id: "SMP-9025", org_id: "org-pune-baramati", farm_id: "farm-2", zone_id: "zone-north-1", farmer_id: "farmer-2", type: "CAPACITIVE_PROBE_SOLAR", status: "ONLINE", battery_pct: 82, firmware: "v2.1.4", installed_at: "2026-01-18T00:00:00.000Z" },
      { id: "SMP-9026", org_id: "org-pune-baramati", farm_id: "farm-3", zone_id: "zone-south-1", farmer_id: "farmer-3", type: "CAPACITIVE_PROBE_SOLAR", status: "ONLINE", battery_pct: 89, firmware: "v2.1.4", installed_at: "2026-01-20T00:00:00.000Z" },
      { id: "SMP-9027", org_id: "org-pune-baramati", farm_id: "farm-4", zone_id: "zone-east-1", farmer_id: "farmer-4", type: "CAPACITIVE_PROBE_SOLAR", status: "ONLINE", battery_pct: 79, firmware: "v2.1.4", installed_at: "2026-01-22T00:00:00.000Z" }
    ],
    experts: [
      {
        id: "exp-1",
        org_id: "org-pune-baramati",
        name: "Dr. Anita Deshmukh",
        role: "Senior Extension Agronomist",
        specialty: "Cereal Rusts & Pathology",
        contact: "+91 94220 11223",
        station: "KVK Baramati Agronomy Desk",
        assigned_zones: ["zone-north-1", "zone-b"]
      },
      {
        id: "exp-2",
        org_id: "org-pune-baramati",
        name: "Sanjay Kulkarni",
        role: "KVK Extension Field Officer",
        specialty: "On-Site Diagnostics & Soil Health",
        contact: "+91 98221 55667",
        station: "KVK Baramati Agricultural Center",
        assigned_zones: ["zone-north-1", "zone-east-1"]
      }
    ],
    technicians: [
      {
        id: "tech-1",
        org_id: "org-pune-baramati",
        name: "Kavita Jagtap",
        role: "IoT Field Technician",
        specialty: "ESP32 & Solar Probe Maintenance",
        contact: "+91 98900 44556",
        station: "Baramati Rural Service Depot"
      },
      {
        id: "tech-2",
        org_id: "org-pune-baramati",
        name: "Nitin Shirole",
        role: "Pump Relay & Drip Actuation Specialist",
        specialty: "Relay Modules & Solenoids",
        contact: "+91 97633 88990",
        station: "Baramati Rural Service Depot"
      }
    ],
    alerts: [
      {
        id: "alt-1",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-2",
        farm_id: "farm-2",
        zone_id: "zone-north-1",
        problem: "Puccinia triticina (Wheat Leaf Rust)",
        problem_type: "DISEASE",
        severity: "CRITICAL",
        status: "INSPECTION_ASSIGNED",
        assigned_officer_id: "exp-2",
        assigned_officer_name: "Sanjay Kulkarni",
        timestamp: new Date(now - hourMs * 3).toISOString()
      },
      {
        id: "alt-2",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-1",
        farm_id: "farm-1",
        zone_id: "zone-b",
        problem: "Severe Soil Water Depletion (16.2% Moisture)",
        problem_type: "WATER_STRESS",
        severity: "HIGH",
        status: "OPEN",
        assigned_officer_id: null,
        assigned_officer_name: null,
        timestamp: new Date(now - hourMs * 1).toISOString()
      }
    ],
    sensor_readings: [
      { id: "sr-01", timestamp: new Date(now - hourMs * 11).toISOString(), moisture: 35.8, soil_moisture: 35.8, temp: 23.2, temperature: 23.2, humidity: 76.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-02", timestamp: new Date(now - hourMs * 10).toISOString(), moisture: 35.2, soil_moisture: 35.2, temp: 24.5, temperature: 24.5, humidity: 73.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-03", timestamp: new Date(now - hourMs * 9).toISOString(), moisture: 34.6, soil_moisture: 34.6, temp: 26.0, temperature: 26.0, humidity: 68.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-04", timestamp: new Date(now - hourMs * 8).toISOString(), moisture: 34.0, soil_moisture: 34.0, temp: 27.5, temperature: 27.5, humidity: 65.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-05", timestamp: new Date(now - hourMs * 7).toISOString(), moisture: 33.5, soil_moisture: 33.5, temp: 29.0, temperature: 29.0, humidity: 61.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-06", timestamp: new Date(now - hourMs * 6).toISOString(), moisture: 33.1, soil_moisture: 33.1, temp: 30.2, temperature: 30.2, humidity: 58.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-07", timestamp: new Date(now - hourMs * 5).toISOString(), moisture: 32.8, soil_moisture: 32.8, temp: 31.0, temperature: 31.0, humidity: 55.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-08", timestamp: new Date(now - hourMs * 4).toISOString(), moisture: 32.5, soil_moisture: 32.5, temp: 30.8, temperature: 30.8, humidity: 56.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-09", timestamp: new Date(now - hourMs * 3).toISOString(), moisture: 32.3, soil_moisture: 32.3, temp: 29.5, temperature: 29.5, humidity: 60.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-10", timestamp: new Date(now - hourMs * 2).toISOString(), moisture: 32.1, soil_moisture: 32.1, temp: 28.5, temperature: 28.5, humidity: 63.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-11", timestamp: new Date(now - hourMs * 1).toISOString(), moisture: 32.0, soil_moisture: 32.0, temp: 27.8, temperature: 27.8, humidity: 65.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-12", timestamp: new Date(now).toISOString(), moisture: 31.8, soil_moisture: 31.8, temp: 27.2, temperature: 27.2, humidity: 66.0, device_id: "ESP32-KV-01", zone_id: "zone-a", farm_id: "farm-1", source: "PHYSICAL_ESP32", provenance: "REAL SENSOR (ESP32 Physical Node)" },
      { id: "sr-13", timestamp: new Date(now).toISOString(), moisture: 16.2, soil_moisture: 16.2, temp: 32.5, temperature: 32.5, humidity: 48.0, device_id: "SMP-9022", zone_id: "zone-b", farm_id: "farm-1", source: "SIMULATED", provenance: "SIMULATED / DEMO" },
      { id: "sr-14", timestamp: new Date(now).toISOString(), moisture: 30.5, soil_moisture: 30.5, temp: 28.4, temperature: 28.4, humidity: 62.0, device_id: "SMP-9023", zone_id: "zone-c", farm_id: "farm-1", source: "SIMULATED", provenance: "SIMULATED / DEMO" },
      { id: "sr-15", timestamp: new Date(now).toISOString(), moisture: 34.5, soil_moisture: 34.5, temp: 27.0, temperature: 27.0, humidity: 67.0, device_id: "SMP-9024", zone_id: "zone-d", farm_id: "farm-1", source: "SIMULATED", provenance: "SIMULATED / DEMO" }
    ],
    weather_data: [
      {
        id: "w-1",
        timestamp: new Date(now).toISOString(),
        temp: 27.8,
        humidity: 65,
        rain_probability: 12,
        condition: "Sunny",
        location: "Baramati, Pune District, Maharashtra",
        status: "LIVE_WEATHER",
        provenance: "DATABASE (Cached Pune Weather)",
        is_live: true
      }
    ],
    risk_scores: [
      {
        id: "rs-1",
        timestamp: new Date(now).toISOString(),
        zone_id: "zone-a",
        disease_risk: 0.18,
        pest_risk: 0.12,
        water_stress_risk: 0.15,
        computed_action: "OPTIMAL",
        reasons: ["Soil moisture is balanced at 31.8% for Wheat (Tillering).", "Canopy microclimate is optimal."],
        provenance: "CALCULATED (Multimodal Decision Engine)"
      }
    ],
    vision_predictions: [
      {
        id: "vp-1",
        timestamp: new Date(now - hourMs * 4).toISOString(),
        zone_id: "zone-north-1",
        farmer_id: "farmer-2",
        crop: "Wheat (Lok-1)",
        disease: "Puccinia triticina (Wheat Leaf Rust)",
        pest: "None",
        confidence: 94,
        severity: "High",
        status: "CONFIRMED",
        leaf_wetness_hrs: 6.8,
        notes: "Uredinial pustules observed on upper leaf epidermis. Verified by extension agronomist.",
        model_provider: "Google Gemini 1.5 Flash",
        image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeyOaFll6LFKwfiYxeM3M96KH2r0MlnLCU2IsqMrupXSgtralAW8VUoL_TTAAN9NsBfQ_I_1ovSl6O_v48Y53OwuNwrsRpLmesCNYIdgFiBveNLgh8y7-1JicEkJXhXI7CHoe-3jDjR5ePnAbTSma1KGeOtOPTuAA7CTEbQhttWWIC2HC8w4NE3E3qB055Zo7Xm9VisPqAezTYneYvDBQxxq7O5eXXzzWLWWnrcWheYZOHrc9g-Joz"
      },
      {
        id: "vp-2",
        timestamp: new Date(now - hourMs * 6).toISOString(),
        zone_id: "zone-east-1",
        farmer_id: "farmer-4",
        crop: "Soybeans",
        disease: "None (Healthy)",
        pest: "Aphis glycines (Soybean Aphid)",
        confidence: 88,
        severity: "Moderate",
        status: "CONFIRMED",
        leaf_wetness_hrs: 4.2,
        notes: "Aphid colonies identified under leaf margin.",
        model_provider: "Google Gemini 1.5 Flash",
        image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlTnnOlC4-pBkdJmjAuMPFY9trrkX6nN-krrVjiUtDwuKW2SnGLnQN1fy3mPA1Y3b6plNJ_5BXldpuZCumtRhYA9n4RSznYZC_sLk_ZVNDwMnmvIw4o4DhSaMFMzxtVi1h748-q5_FwtJ5IlCcCBzpa7zdbaL_HWX2kVREocT1u-J6zbDv0SRi6ptAoRUdzQUc6fwTGumoR-RE6OtmzJ7QOMTeQO6lK0TCTaZvYKUMpD232LPlJT14"
      },
      {
        id: "vp-3",
        timestamp: new Date(now - hourMs * 1).toISOString(),
        zone_id: "zone-b",
        farmer_id: "farmer-1",
        crop: "Wheat (HD 2967)",
        disease: "Powdery Mildew (Blumeria graminis)",
        pest: "None",
        confidence: 86,
        severity: "Moderate",
        status: "PENDING_REVIEW",
        leaf_wetness_hrs: 7.1,
        notes: "Initial powdery white patches detected on lower canopy.",
        model_provider: "Google Gemini 1.5 Flash",
        image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTqf34E2sE4f66t0T6d3aK3k8M8L7aFqL6lY_2V3uP8zM4W5E2b7aN4c3A1dE2g3H4j5K6"
      }
    ],
    irrigation_events: [
      {
        id: "irr-01",
        timestamp: new Date(now - hourMs * 48).toISOString(),
        zone_id: "zone-a",
        trigger_source: "AUTOMATIC",
        duration_minutes: 8,
        moisture_before: 18.2,
        moisture_after: 35.8,
        delta_moisture: 17.6,
        water_used_liters: 11600,
        outcome: "SUCCESS",
        hardware_ack: true,
        verified: true,
        verification_status: "CONFIRMED_HYDRATION",
        provenance: "CALCULATED & ACTUATED"
      },
      {
        id: "irr-02",
        timestamp: new Date(now - hourMs * 24).toISOString(),
        zone_id: "zone-c",
        trigger_source: "MANUAL_OVERRIDE",
        duration_minutes: 5,
        moisture_before: 19.0,
        moisture_after: 30.5,
        delta_moisture: 11.5,
        water_used_liters: 7250,
        outcome: "SUCCESS",
        hardware_ack: true,
        verified: true,
        verification_status: "CONFIRMED_HYDRATION",
        provenance: "CALCULATED & ACTUATED"
      },
      {
        id: "irr-03",
        timestamp: new Date(now - hourMs * 12).toISOString(),
        zone_id: "zone-d",
        trigger_source: "AUTOMATIC",
        duration_minutes: 6.5,
        moisture_before: 20.1,
        moisture_after: 34.5,
        delta_moisture: 14.4,
        water_used_liters: 9550,
        outcome: "SUCCESS",
        hardware_ack: true,
        verified: true,
        verification_status: "CONFIRMED_HYDRATION",
        provenance: "CALCULATED & ACTUATED"
      }
    ],
    advisory_messages: [
      {
        id: "adv-01",
        timestamp: new Date(now - hourMs * 2).toISOString(),
        zone_id: "zone-north-1",
        category: "disease",
        message_en: "Rui Sector: High fungal spore risk (Wheat Leaf Rust). Relative humidity is 82%. Field inspection recommended.",
        message_mr: "रुई विभाग: गव्हावरील तांबेरा रोगाचा तीव्र धोका. आर्द्रता ८२% आहे. शेताची प्रत्यक्ष पाहणी करा.",
        message_hi: "रुई क्षेत्र: गेहूं में रतुआ (लीफ रस्ट) रोग का उच्च जोखिम। नमी ८२% है। खेत का निरीक्षण करें।",
        read_status: false,
        provenance: "MULTIMODAL DECISION ENGINE"
      },
      {
        id: "adv-02",
        timestamp: new Date(now - hourMs * 4).toISOString(),
        zone_id: "zone-b",
        category: "water",
        message_en: "Zone B (Central Basin): Soil moisture depleted (16.2%). Critical tillering phase requires immediate 8-minute drip cycle.",
        message_mr: "झोन बी (मध्य बेसिन): जमिनीतील ओलावा १६.२% वर आला आहे. फुटवे फुटण्याच्या अवस्थेत ८ मिनिटे ठिबक सिंचन सुरू करा.",
        message_hi: "ज़ोन बी: मिट्टी में नमी १६.२% तक कम हो गई है। कल्ले निकलने की अवस्था में ८ मिनट ड्रिप सिंचाई चलाएं।",
        read_status: false,
        provenance: "MULTIMODAL DECISION ENGINE"
      },
      {
        id: "adv-03",
        timestamp: new Date(now - hourMs * 8).toISOString(),
        zone_id: "zone-east-1",
        category: "pest",
        message_en: "Kattebhel Plot: Aphid activity detected (88% confidence). Monitor perimeter rows for canopy colonization.",
        message_mr: "काटेभेल प्लॉट: मावा (अॅफिड्स) कीड आढळली (८८% खात्री). पिकाच्या कडेच्या ओळींची पाहणी करा.",
        message_hi: "काटेभेल प्लॉट: माहू कीट की गतिविधि देखी गई (८८% सटीकता)। खेत की सीमाओं की निगरानी करें।",
        read_status: true,
        provenance: "MULTIMODAL DECISION ENGINE"
      },
      {
        id: "adv-04",
        timestamp: new Date(now - hourMs * 12).toISOString(),
        zone_id: "zone-a",
        category: "optimal",
        message_en: "Malegaon Khurd Plot (Zone A): Soil hydration and canopy microclimate are in peak growth equilibrium.",
        message_mr: "माळेगाव खुर्द प्लॉट (झोन ए): जमिनीतील ओलावा आणि तापमान पिकाच्या वाढीसाठी अनुकूल आहे.",
        message_hi: "मालेगांव खुर्द प्लॉट (ज़ोन ए): मिट्टी की नमी और सूक्ष्म जलवायु फसल वृद्धि के लिए उत्कृष्ट हैं।",
        read_status: true,
        provenance: "MULTIMODAL DECISION ENGINE"
      }
    ],
    expert_validations: [
      {
        id: "ev-01",
        prediction_id: "vp-1",
        expert_id: "exp-1",
        expert_name: "Dr. Anita Deshmukh",
        status: "CONFIRMED",
        notes: "Symptoms consistent with Puccinia triticina (Pucciniaceae). Recommended Propiconazole 25% EC at 1ml/L.",
        created_at: new Date(now - hourMs * 3).toISOString(),
        provenance: "EXPERT VALIDATION (Human-in-the-loop)"
      }
    ],
    maintenance_tickets: [
      {
        id: "tkt-01",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-1",
        farm_id: "farm-1",
        zone_id: "zone-b",
        device_id: "SMP-9022",
        issue: "Solar battery recalibration required",
        priority: "HIGH",
        status: "OPEN",
        assigned_technician_id: "tech-1",
        assigned_technician_name: "Kavita Jagtap",
        created_at: new Date(now - hourMs * 14).toISOString(),
        resolved_at: null,
        notes: "Device reporting intermittent telemetry dropouts during overcast morning hours."
      },
      {
        id: "tkt-02",
        org_id: "org-pune-baramati",
        farmer_id: "farmer-4",
        farm_id: "farm-4",
        zone_id: "zone-east-1",
        device_id: "SMP-9027",
        issue: "Capacitive probe repositioning",
        priority: "MEDIUM",
        status: "RESOLVED",
        assigned_technician_id: "tech-2",
        assigned_technician_name: "Nitin Shirole",
        created_at: new Date(now - hourMs * 36).toISOString(),
        resolved_at: new Date(now - hourMs * 12).toISOString(),
        notes: "Probe re-inserted to 15cm active root zone depth following tillage."
      }
    ]
  };
}

module.exports = {
  createSeedData
};
