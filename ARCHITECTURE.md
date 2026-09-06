# L3MON Full-Stack Architecture

## Overview
L3MON evolves from a standalone Android vulnerability scanner to a **comprehensive mobile security monitoring platform** with real-time threat detection, geolocation tracking, and centralized dashboard analytics.

## Architecture Components

### 1. **Android Frontend (Java/Kotlin)**
- Local app vulnerability scanning
- Real-time device telemetry collection
- Geolocation permissions & tracking
- WebSocket communication with backend
- Offline-first capability with local storage

### 2. **Node.js/Express Backend**
- REST API for app metadata queries
- WebSocket server (Socket.IO) for real-time updates
- Geolocation processing (node-geoip)
- Data persistence layer
- Authentication & authorization

### 3. **Data Layer**
- **lowdb** - Local JSON database for caching & lightweight deployments
- **OpenStreetMap integration** - Map tile serving
- Device location history tracking

### 4. **Web Dashboard (Leaflet + Frontend)**
- Real-time threat map visualization
- Device inventory & status dashboard
- Historical analytics & trends
- Geolocation heatmaps
- Alert management

## Data Flow

```
Android Device → WebSocket (Socket.IO) → Express Backend
                                              ↓
                                         lowdb Database
                                              ↓
                                    node-geoip Processing
                                              ↓
                                Web Dashboard (Leaflet Maps)
```

## Key Features

1. **Distributed Scanning** - Multiple devices report vulnerabilities
2. **Real-Time Monitoring** - Live device status & threat alerts via WebSocket
3. **Geolocation Tracking** - Map devices by location using node-geoip
4. **Centralized Dashboard** - OpenStreetMap/Leaflet visualization
5. **Historical Analysis** - Trend analysis & vulnerability progression
6. **Multi-Device Management** - Manage & monitor multiple Android devices

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | Android (Java/Kotlin) |
| Backend API | Express.js + Node.js |
| Real-Time Communication | Socket.IO |
| Geolocation | node-geoip |
| Data Storage | lowdb |
| Web Frontend | Leaflet + HTML/CSS/JS |
| Mapping | OpenStreetMap |

## File Structure

```
L3MON/
├── app/                          # Android Studio project
│   ├── src/
│   │   ├── main/java/           # Java source code
│   │   └── main/res/            # Resources
│   └── build.gradle
├── server/                       # Node.js Express backend
│   ├── index.js                 # Server entry point
│   ├── routes/                  # API endpoints
│   ├── services/                # Business logic
│   ├── db/                      # lowdb configuration
│   ├── package.json
│   └── config.js
├── web-dashboard/               # Leaflet web UI
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── map.js              # OpenStreetMap/Leaflet
│   │   ├── socket-client.js    # WebSocket client
│   │   └── dashboard.js        # Dashboard logic
│   └── assets/
└── ARCHITECTURE.md

```

## Integration Points

### Android ↔ Backend
- **Protocol**: WebSocket (Socket.IO)
- **Auth**: Token-based (JWT or session)
- **Data**: JSON payloads with scan results, device info, location

### Backend ↔ Database
- **ORM/Query**: lowdb adapters
- **Collections**: devices, scans, locations, alerts

### Backend ↔ Web Dashboard
- **Protocol**: REST API + WebSocket
- **Updates**: Real-time via Socket.IO
- **Map Data**: GeoJSON from OpenStreetMap

## Status

All next steps have been implemented:

1. ✅ `server/` initialized with Express + Socket.IO scaffold
2. ✅ lowdb schemas for devices, scans, locations, and alerts
3. ✅ WebSocket handlers in Android app (`SocketClient.java`, `DeviceManager.java`)
4. ✅ Leaflet-based web dashboard with real-time map, device list, alerts, and scan history
5. ✅ Geolocation processing pipeline (`geoService.js` using geoip-lite)
