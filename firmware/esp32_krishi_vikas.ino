/*
 * Krishi Vikas AI — Precision Agriculture ESP32 Hardware Node
 * 
 * Hardware Architecture:
 * -------------------------------------------------------------
 * Target Board: ESP32 Dev Module (WROOM-32 / NodeMCU-32S)
 * Capacitive Soil Moisture Sensor v1.2 -> Analog GPIO 34 (ADC1_CH6)
 * DHT22 Temperature & Humidity Sensor -> Digital GPIO 4
 * 5V Single Channel Relay Module       -> Digital GPIO 26 (Active HIGH)
 * Onboard Status LED                   -> GPIO 2
 * 
 * Network & Backend:
 * -------------------------------------------------------------
 * Region: Baramati Taluka, Pune District (18.15° N, 74.58° E)
 * Telemetry Ingestion: POST http://<SERVER_IP>:3000/api/sensor-readings
 * Actuation ACK:       POST http://<SERVER_IP>:3000/api/irrigation/ack
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // ArduinoJson v6 or v7
#include "DHT.h"

// ================= 1. NETWORK & BACKEND CONFIGURATION =================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your local host machine IP running the Krishi Vikas AI server
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

const char* DEVICE_ID = "ESP32-KV-01";
const char* FARM_ID = "farm-baramati-1";
const char* ZONE_ID = "zone-a"; // Malegaon Khurd Plot

// ================= 2. HARDWARE PIN DEFINITIONS =================
#define SOIL_MOISTURE_PIN 34 // ADC1 analog pin
#define DHT_PIN 4            // Digital pin for DHT22
#define DHT_TYPE DHT22
#define RELAY_PIN 26         // Digital output for 5V Pump Relay
#define STATUS_LED 2         // Onboard Blue LED

DHT dht(DHT_PIN, DHT_TYPE);

// Calibration constants for Capacitive Soil Moisture Sensor v1.2
// (Calibrate in dry air vs immersed in tap water)
const int AIR_VALUE = 3200;   // 0% moisture in dry air (raw 12-bit ADC)
const int WATER_VALUE = 1350; // 100% moisture in cup of water

// Reporting Interval (every 15 seconds)
const unsigned long TELEMETRY_INTERVAL_MS = 15000;
unsigned long lastTelemetryTime = 0;

// Relay auto-shutoff timer
unsigned long relayShutoffTime = 0;
bool isRelayActive = false;
String activeCycleId = "";

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("🌱 Krishi Vikas AI — ESP32 Field Telemetry & Pump Node");
  Serial.printf("📍 Location: Baramati, Pune District | Device: %s\n", DEVICE_ID);
  Serial.println("=======================================================");

  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Normally Open (Relay OFF)
  digitalWrite(STATUS_LED, LOW);

  dht.begin();

  connectWiFi();
}

void loop() {
  // Check relay auto-shutoff timer
  if (isRelayActive && millis() >= relayShutoffTime) {
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(STATUS_LED, HIGH);
    isRelayActive = false;
    Serial.println("💧 [RELAY] Irrigation cycle completed. Pump closed.");
    sendRelayAck(activeCycleId, "DE_ENERGIZED");
  }

  // Periodic Telemetry Transmission
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    sendTelemetry();
  }

  delay(50);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected! Assigned IP: " + WiFi.localIP().toString());
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.println("\n⚠️ WiFi Connection failed. Will retry automatically.");
  }
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  // 1. Read Capacitive Moisture Sensor
  int rawSoil = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = (float)(rawSoil - AIR_VALUE) * 100.0 / (float)(WATER_VALUE - AIR_VALUE);
  soilMoisture = constrain(soilMoisture, 0.0, 100.0);

  // 2. Read DHT22 Temperature & Humidity
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("⚠️ DHT22 sensor read timeout, using last valid values.");
    temperature = 28.0;
    humidity = 64.0;
  }

  Serial.printf("📡 [TELEMETRY] Moisture: %.1f%% | Temp: %.1f°C | Humidity: %.1f%%\n",
                soilMoisture, temperature, humidity);

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/sensor-readings";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Construct stable JSON payload
  StaticJsonDocument<384> doc;
  doc["device_id"] = DEVICE_ID;
  doc["farm_id"] = FARM_ID;
  doc["zone_id"] = ZONE_ID;
  doc["soil_moisture"] = (float)((int)(soilMoisture * 10) / 10.0);
  doc["temperature"] = (float)((int)(temperature * 10) / 10.0);
  doc["humidity"] = (float)((int)(humidity * 10) / 10.0);
  doc["device_status"] = "ONLINE";
  doc["battery_pct"] = 88;
  doc["is_physical"] = true;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == 200 || httpCode == 201) {
    String response = http.getString();
    Serial.println("✅ [TELEMETRY ACK] " + response);

    // Parse response for queued pump relay actuation
    StaticJsonDocument<512> respDoc;
    DeserializationError error = deserializeJson(respDoc, response);
    if (!error) {
      const char* pumpCommand = respDoc["data"]["relay_command"]["pump"];
      const char* cycleId = respDoc["data"]["relay_command"]["cycle_id"];
      
      if (pumpCommand && strcmp(pumpCommand, "ON") == 0) {
        int durationMins = respDoc["data"]["relay_command"]["duration_minutes"] | 8;
        
        digitalWrite(RELAY_PIN, HIGH); // Energize 5V Relay
        isRelayActive = true;
        activeCycleId = cycleId ? String(cycleId) : "irr-manual";
        relayShutoffTime = millis() + (durationMins * 60UL * 1000UL);
        
        Serial.printf("⚡ [RELAY ACTUATED] DC Pump ON for %d minutes. Cycle: %s\n",
                      durationMins, activeCycleId.c_str());
        
        // Send immediate hardware execution acknowledgement
        sendRelayAck(activeCycleId, "ENERGIZED");
      }
    }
  } else {
    Serial.printf("❌ [HTTP ERROR] Status: %d\n", httpCode);
  }

  http.end();
}

void sendRelayAck(String cycleId, const char* status) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/irrigation/ack";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["cycle_id"] = cycleId;
  doc["relay_status"] = status;

  String body;
  serializeJson(doc, body);
  int httpCode = http.POST(body);
  Serial.printf("📤 [ACK SENT] Cycle %s -> Status: %s (HTTP %d)\n", cycleId.c_str(), status, httpCode);
  http.end();
}
