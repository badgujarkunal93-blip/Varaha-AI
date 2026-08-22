const https = require('https');
const db = require('./db');
const { evaluateAllZones } = require('./riskEngine');

const DEFAULT_LOCATION = "Baramati, Pune District, Maharashtra, India";
const LAT = 18.15;
const LON = 74.58;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetches live weather for Pune (Baramati).
 * If OpenWeatherMap key is missing or invalid, returns status UNAVAILABLE
 * instead of silently generating fabricated weather numbers.
 */
async function updateWeatherData() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  let weatherRecord = null;

  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${apiKey}&units=metric`;
      const data = await fetchJson(url);
      if (data && data.main) {
        weatherRecord = {
          temp: Math.round(data.main.temp * 10) / 10,
          humidity: data.main.humidity,
          rain_probability: data.clouds ? data.clouds.all : 0,
          condition: data.weather && data.weather[0] ? data.weather[0].main : "Clear",
          location: DEFAULT_LOCATION,
          lat: LAT,
          lon: LON,
          status: "LIVE_WEATHER",
          provenance: "LIVE WEATHER (OpenWeatherMap API)",
          is_live: true,
          error: null
        };
        const saved = db.insert('weather_data', weatherRecord);
        try {
          evaluateAllZones();
        } catch (e) {
          console.error('Error re-evaluating risk on live weather update:', e.message);
        }
        return saved;
      }
    } catch (err) {
      console.warn('Live OpenWeatherMap fetch failed for Pune:', err.message);
    }
  }

  // If live weather cannot be retrieved, report status honestly
  weatherRecord = {
    temp: null,
    humidity: null,
    rain_probability: null,
    condition: "Weather Unavailable",
    location: DEFAULT_LOCATION,
    lat: LAT,
    lon: LON,
    status: "UNAVAILABLE",
    provenance: "UNAVAILABLE (OPENWEATHER_API_KEY not configured or offline)",
    is_live: false,
    error: "Live weather for Pune district could not be fetched. Configure OPENWEATHER_API_KEY in .env to enable live sync."
  };

  return weatherRecord;
}

function getLatestWeather() {
  const weatherList = db.getAll('weather_data')
    .filter(w => w.status === 'LIVE_WEATHER')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (weatherList.length > 0) {
    return {
      ...weatherList[0],
      provenance: "DATABASE (Cached Pune Weather)"
    };
  }

  return {
    temp: null,
    humidity: null,
    rain_probability: null,
    condition: "Weather Unavailable",
    location: DEFAULT_LOCATION,
    lat: LAT,
    lon: LON,
    status: "UNAVAILABLE",
    provenance: "UNAVAILABLE",
    is_live: false,
    error: "Live weather unavailable. Configure OPENWEATHER_API_KEY in .env."
  };
}

module.exports = {
  updateWeatherData,
  getLatestWeather,
  DEFAULT_LOCATION,
  LAT,
  LON
};
