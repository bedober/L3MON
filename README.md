# L3MON Vulnerability Scanner

A comprehensive mobile security monitoring platform that performs read-only, local configuration reviews of installed apps and reports findings to a centralized dashboard in real time.

## Platform

L3MON consists of three tiers described in [ARCHITECTURE.md](./ARCHITECTURE.md):

### 1. Android Frontend (Java)

A local scanner that inventories installed apps and flags indicators:

- Debuggable release configuration
- Enabled Android data backup
- Permitted cleartext network traffic
- Legacy target SDK level (< 26)
- Large sets of dangerous runtime permissions (>= 6)

Scan results are sent to the backend via WebSocket (Socket.IO) in real time. Results are heuristic indicators, not proof that an app is vulnerable. Use only on devices and apps you own or are explicitly authorized to assess.

### 2. Node.js/Express Backend

- REST API for querying devices, scans, locations, and alerts
- WebSocket (Socket.IO) server for real-time telemetry from mobile devices
- `lowdb` JSON database for persistent storage
- `geoip-lite` for IP-based geolocation of reporting devices

### 3. Web Dashboard

- Leaflet/OpenStreetMap real-time threat map with device markers
- Device inventory and status panel
- Alert management (view, dismiss)
- Recent scan history
- Served directly from the backend on port 3001

## Build & Run

### Prerequisites
- JDK 17 (for Android app)
- Node.js 22+ (for backend)
- Android Studio (to compile and install the mobile app)

### Backend

```bash
cd server
npm install
npm start
```

The server starts on `http://0.0.0.0:3001` and serves the web dashboard at the same URL.

### Web Dashboard

Open `http://localhost:3001` in a browser. The dashboard connects to the backend via Socket.IO and updates in real time as devices report.

### Android App

Open the `app/` directory in Android Studio and run the `app` configuration, or execute:

```bash
./gradlew assembleDebug
```

The app uses `minifyEnabled false` and connects to `http://10.0.2.2:3001` by default (Android emulator loopback). For physical devices, update the server URL in `SocketClient.java`.

## Android 11+ Note

The manifest requests `QUERY_ALL_PACKAGES`. Apps distributed through Google Play must meet that permission's policy requirements.

## Interpreting Results

Findings should initiate verification: inspect the app manifest, current release configuration, and threat model. For example, backup may be correct for a consumer app with encrypted backups, and a dangerous permission may be necessary for its core feature.
