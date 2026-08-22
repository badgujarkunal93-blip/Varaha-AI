# Krishi Vikas AI — Physical Hardware & ESP32 Integration Guide

**Deployment Target**: Baramati Taluka, Pune District, Maharashtra (`18.15° N, 74.58° E`)  
**Firmware Sketch**: [`firmware/esp32_krishi_vikas.ino`](file:///c:/Users/kunal%20badgujar/Desktop/Projects/Varaha%20AI/firmware/esp32_krishi_vikas.ino)  

---

## 1. Hardware Architecture & Pinout

```
+-----------------------------------------------------------------------+
|                           ESP32 Dev Module                            |
|                                                                       |
|   [GPIO 34] (ADC1_CH6) <----- Analog Signal Pin <--- Capacitive Soil |
|                                                      Moisture v1.2    |
|   [GPIO 4]  (Digital)  <----- Data Pin (10k Pullup) <--- DHT22 Temp / |
|                                                      Humidity Sensor  |
|   [GPIO 26] (Digital)  -----> IN Pin (Active HIGH) ---> 5V DC Relay   |
|                                                      Module (Pump)    |
|   [GPIO 2]  (Onboard)  -----> Status / Heartbeat LED                  |
|                                                                       |
|   [3V3 / 5V] -----------> VCC Rail (Sensors & Relay Logic)            |
|   [GND]     -----------> Common Ground Rail                           |
+-----------------------------------------------------------------------+
```

### Complete Pin Connections

| ESP32 Pin | Connected Component | Signal Type | Description |
| :--- | :--- | :--- | :--- |
| **GPIO 34** | Capacitive Soil Moisture v1.2 | Analog Input (ADC1) | 12-bit ADC voltage reading mapped to 0–100% moisture. |
| **GPIO 4** | DHT22 / AM2302 Sensor | Digital Bidirectional | Digital 1-wire protocol reading temperature (°C) and humidity (%). |
| **GPIO 26** | 5V Single-Channel Relay | Digital Output | Active HIGH logic energizing solenoid valve or 12V DC water pump. |
| **GPIO 2** | Onboard Blue LED | Output | Heartbeat indicator & Wi-Fi pairing indicator. |
| **VIN / 5V** | Relay VCC & Solar LiFePO4 Step-up | Power | 5V DC power rail. |
| **3V3** | DHT22 VCC & Soil Moisture VCC | Power | 3.3V regulated power rail. |
| **GND** | Sensor Grounds & Relay GND | Ground | Common system ground. |

---

## 2. Stable Telemetry JSON Schema

Every 15 seconds, the ESP32 performs readings, maps analog voltages to calibrated percentages, and dispatches an HTTP POST request:

### Ingestion Request (`POST /api/sensor-readings`)

```http
POST /api/sensor-readings HTTP/1.1
Host: 192.168.1.100:3000
Content-Type: application/json

{
  "device_id": "ESP32-KV-01",
  "farm_id": "farm-baramati-1",
  "zone_id": "zone-a",
  "soil_moisture": 32.4,
  "temperature": 28.1,
  "humidity": 64.5,
  "device_status": "ONLINE",
  "battery_pct": 88,
  "is_physical": true
}
```

### Backend Ingestion Response with Actuation Command

The backend validates the payload, updates database tables, executes the multimodal risk engine, and returns queued actuator instructions:

```json
{
  "success": true,
  "data": {
    "reading": {
      "id": "sr-1787397120000-101",
      "device_id": "ESP32-KV-01",
      "farm_id": "farm-baramati-1",
      "zone_id": "zone-a",
      "soil_moisture": 32.4,
      "temperature": 28.1,
      "humidity": 64.5,
      "source": "PHYSICAL_ESP32",
      "provenance": "REAL SENSOR (ESP32 Physical Node)",
      "device_status": "ONLINE"
    },
    "risk": {
      "computed_action": "OPTIMAL",
      "disease_risk": 0.1,
      "water_stress_risk": 0.15
    },
    "relay_command": {
      "pump": "ON",
      "duration_minutes": 8,
      "cycle_id": "irr-1787397125000"
    }
  }
}
```

---

## 3. Real Actuation & Hardware Acknowledgement Flow

```
[Farmer Approves / Triggers Irrigation in UI]
                    ↓
[Backend Queues Relay Command with Unique cycle_id]
                    ↓
[ESP32 sends routine telemetry heartbeat & receives relay_command: { pump: "ON" }]
                    ↓
[ESP32 pulls GPIO 26 HIGH -> Relay Energized -> DC Pump Starts]
                    ↓
[ESP32 immediately POSTs /api/irrigation/ack to confirm execution]
                    ↓
[Backend marks irrigation_events.hardware_ack = true]
                    ↓
[Auto-Shutoff Timer on ESP32 expires -> GPIO 26 pulled LOW -> Pump Stops]
                    ↓
[Subsequent sensor readings show real hydration -> Backend verifies delta_moisture]
```

### Hardware Execution Acknowledgement (`POST /api/irrigation/ack`)

```http
POST /api/irrigation/ack HTTP/1.1
Host: 192.168.1.100:3000
Content-Type: application/json

{
  "device_id": "ESP32-KV-01",
  "cycle_id": "irr-1787397125000",
  "relay_status": "ENERGIZED"
}
```

---

## 4. Connection State Machine

| State | Condition | UI Indication |
| :--- | :--- | :--- |
| **ONLINE** | Physical packet received within the last 45 seconds | 🟢 Green Pulsing Badge (`ESP32 Live (Baramati Grid)`) |
| **STALE** | Physical packet between 45 and 180 seconds old | 🟡 Amber Badge (`STALE: Last Packet Xs ago`) |
| **OFFLINE** | No physical packet for > 180 seconds or unstarted | 🔴 Red Badge (`Awaiting ESP32 Packet / Disconnected`) |

---

## 5. Flashing Instructions

1. **Install Arduino IDE** with ESP32 board support (`esp32 by Espressif Systems v2.0.14+`).
2. **Install Required Libraries** via Library Manager:
   - `DHT sensor library` by Adafruit
   - `ArduinoJson` (v6 or v7) by Benoît Blanchon
3. **Open Sketch**: [`firmware/esp32_krishi_vikas.ino`](file:///c:/Users/kunal%20badgujar/Desktop/Projects/Varaha%20AI/firmware/esp32_krishi_vikas.ino)
4. **Configure Wi-Fi & Server IP**:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* SERVER_BASE_URL = "http://192.168.1.X:3000"; // Local IP of server
   ```
5. **Calibrate Analog Sensor**:
   - Submerge sensor tip in water -> record `WATER_VALUE` (typically ~1350).
   - Hold sensor dry in air -> record `AIR_VALUE` (typically ~3200).
6. **Select Board**: `ESP32 Dev Module`, Flash Frequency `80MHz`, Upload Speed `921600`.
7. **Upload** and open Serial Monitor at **115200 baud**.
