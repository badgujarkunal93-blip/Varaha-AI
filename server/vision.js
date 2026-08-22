const https = require('https');
const http = require('http');
const db = require('./db');
const { evaluateZoneRisk } = require('./riskEngine');

function downloadBuffer(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Image download timed out'));
    });
  });
}

/**
 * Executes a call to Google Gemini Vision API (gemini-1.5-flash)
 * with timeout, structured response parsing, and validation.
 */
function callGeminiVisionApi(apiKey, base64Data, mimeType = "image/jpeg", timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const prompt = `You are Krishi Vikas AI, an agricultural pathologist for Pune District, Maharashtra.
Analyze this crop leaf photo.
Return ONLY valid JSON with these exact keys:
{
  "crop": "Crop name, e.g. Wheat, Sweet Corn, Soybeans, Sugarcane",
  "disease": "Pathogen/Disease name, or 'None (Healthy)'",
  "pest": "Pest name, or 'None'",
  "confidence": integer 50 to 99,
  "severity": "Low", "Moderate", or "High",
  "observations": "Concise 1-2 sentence pathology observation.",
  "leaf_wetness_hrs": number 1.0 to 12.0
}`;

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const req = https.request(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!text) {
                return reject(new Error('Gemini returned an empty candidate text'));
              }
              const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse Gemini structured JSON: ${e.message}`));
            }
          } else {
            let errorMsg = `HTTP ${res.statusCode}`;
            try {
              const errObj = JSON.parse(data);
              if (errObj.error && errObj.error.message) {
                errorMsg = errObj.error.message;
              }
            } catch (_) {
              errorMsg = data.substring(0, 200);
            }
            reject(new Error(errorMsg));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Gemini Vision request timed out after ${timeoutMs}ms`));
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Main Crop Leaf Analysis Pipeline:
 * CAMERA / IMAGE -> REAL AI MODEL -> STRUCTURED PREDICTION -> DATABASE -> RISK -> DECISION -> ADVISORY
 */
async function analyzeCropImage({ imageBuffer, mimeType, filename, zone_id, farmer_id, image_url }) {
  const apiKey = process.env.GEMINI_API_KEY;
  let rawPrediction = null;
  let aiError = null;

  // 1. Fetch bytes if image_url provided
  if (!imageBuffer && image_url) {
    try {
      imageBuffer = await downloadBuffer(image_url);
      mimeType = image_url.endsWith('.png') ? 'image/png' : 'image/jpeg';
    } catch (e) {
      console.warn('Image download warning:', e.message);
    }
  }

  // 2. Call real AI model if API key and buffer are present
  if (apiKey && imageBuffer) {
    try {
      const base64Data = imageBuffer.toString('base64');
      rawPrediction = await callGeminiVisionApi(apiKey, base64Data, mimeType || "image/jpeg", 12000);
    } catch (err) {
      aiError = err.message;
      console.warn('Gemini Vision AI call failed:', aiError);
    }
  } else if (!apiKey) {
    aiError = "GEMINI_API_KEY not configured in environment";
  } else if (!imageBuffer) {
    aiError = "No image data or accessible image URL provided";
  }

  // 3. Structure the output honestly (NO fabricated diagnosis or fake confidence numbers on failure)
  let recordData;

  if (rawPrediction && rawPrediction.disease) {
    // Genuine model prediction
    const conf = Number(rawPrediction.confidence);
    const validConf = (!isNaN(conf) && conf >= 1 && conf <= 100) ? conf : 85;
    const isHealthy = rawPrediction.disease.toLowerCase().includes('healthy') || rawPrediction.disease.toLowerCase().includes('none');

    recordData = {
      image_url: image_url || (filename ? `/uploads/${filename}` : '/images/leaf_sample.jpg'),
      crop: rawPrediction.crop || "Crop Specimen",
      disease: rawPrediction.disease,
      pest: rawPrediction.pest || "None",
      confidence: validConf,
      severity: rawPrediction.severity || "Moderate",
      zone_id: zone_id || "zone-a",
      farmer_id: farmer_id || "farmer-1",
      status: (validConf >= 90 && isHealthy) ? "CONFIRMED" : "PENDING_REVIEW",
      leaf_wetness_hrs: Number(rawPrediction.leaf_wetness_hrs) || 4.5,
      notes: rawPrediction.observations || rawPrediction.notes || "Analyzed by Google Gemini Vision.",
      model_provider: "Google Gemini 1.5 Flash",
      ai_status: "SUCCESS",
      provenance: "AI MODEL (Google Gemini 1.5 Flash)"
    };
  } else {
    // Model failure: Report honestly without fabricating fake pathology
    recordData = {
      image_url: image_url || (filename ? `/uploads/${filename}` : '/images/leaf_sample.jpg'),
      crop: "Crop Specimen",
      disease: "AI Analysis Unavailable",
      pest: "None",
      confidence: null,
      severity: "Unavailable",
      zone_id: zone_id || "zone-a",
      farmer_id: farmer_id || "farmer-1",
      status: "AI_UNAVAILABLE",
      leaf_wetness_hrs: null,
      notes: `AI analysis unavailable: ${aiError || 'Vision model unreachable.'} No diagnosis fabricated.`,
      model_provider: "Google Gemini 1.5 Flash (Unavailable)",
      ai_status: "UNAVAILABLE",
      provenance: "UNAVAILABLE (AI Service Error)"
    };
  }

  // 4. Save to database
  const record = db.insert('vision_predictions', recordData);

  // 5. Trigger Risk Engine & Multimodal Decision Engine
  try {
    evaluateZoneRisk(record.zone_id);
  } catch (e) {
    console.error('Error updating zone risk after scan:', e.message);
  }

  return record;
}

module.exports = {
  analyzeCropImage,
  callGeminiVisionApi
};
