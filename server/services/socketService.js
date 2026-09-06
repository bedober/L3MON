const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const db = require('../db');
const { enrichLocation } = require('./geoService');
const { processScanResults } = require('./alertService');

function updateDevice(deviceInfo, locationIp) {
  return new Promise(async (resolve) => {
    await db.getDb().read();
    const data = db.getDb().data;
    const devices = data[config.collections.devices];
    const now = new Date().toISOString();

    const geo = enrichLocation(locationIp);

    let device = devices.find(d => d.id === deviceInfo.id);
    if (!device) {
      device = {
        id: deviceInfo.id,
        name: deviceInfo.name || deviceInfo.id,
        model: deviceInfo.model,
        manufacturer: deviceInfo.manufacturer,
        osVersion: deviceInfo.osVersion,
        installedApps: deviceInfo.installedApps || 0,
        lastSeen: now,
        firstSeen: now,
        lat: geo.lat,
        lon: geo.lon,
        country: geo.country
      };
      devices.unshift(device);
    } else {
      device.lastSeen = now;
      device.installedApps = deviceInfo.installedApps || device.installedApps;
      if (geo.lat && geo.lon) {
        device.lat = geo.lat;
        device.lon = geo.lon;
        device.country = geo.country;
      }
    }

    const location = {
      id: uuidv4(),
      deviceId: device.id,
      lat: geo.lat,
      lon: geo.lon,
      country: geo.country,
      timestamp: now
    };
    data[config.collections.locations].unshift(location);

    if (data[config.collections.locations].length > 1000) {
      data[config.collections.locations] = data[config.collections.locations].slice(0, 1000);
    }

    await db.getDb().write();
    resolve(device);
  });
}

function saveScan(deviceId, results) {
  return new Promise(async (resolve) => {
    await db.getDb().read();
    const data = db.getDb().data;
    const scan = {
      id: uuidv4(),
      deviceId,
      timestamp: new Date().toISOString(),
      findings: results.findings || [],
      totalApps: results.totalApps || 0,
      flaggedApps: results.findings ? results.findings.length : 0
    };
    data[config.collections.scans].unshift(scan);
    if (data[config.collections.scans].length > 5000) {
      data[config.collections.scans] = data[config.collections.scans].slice(0, 5000);
    }
    await db.getDb().write();

    const device = data[config.collections.devices].find(d => d.id === deviceId);
    let newAlerts = [];
    if (device && results.findings && results.findings.length > 0) {
      newAlerts = await processScanResults(device, results);
    }

    resolve({ scan, newAlerts });
  });
}

function handleSocketConnection(socket, io) {
  console.log(`Device connected: ${socket.id}`);

  socket.on('register', async (payload) => {
    const locationIp = payload.locationIp || socket.handshake.address || null;
    const device = await updateDevice(payload.deviceInfo, locationIp);
    socket.data.deviceId = device.id;
    io.emit('device-connected', device);
  });

  socket.on('scan-results', async (payload) => {
    if (!socket.data.deviceId) {
      socket.emit('error-msg', { error: 'Not registered' });
      return;
    }
    const result = await saveScan(socket.data.deviceId, payload);
    io.emit('new-scan', result);
  });

  socket.on('telemetry', async (payload) => {
    if (!socket.data.deviceId) return;
    await db.getDb().read();
    const data = db.getDb().data;
    const devices = data[config.collections.devices];
    const device = devices.find(d => d.id === socket.data.deviceId);
    if (device) {
      device.batteryLevel = payload.batteryLevel;
      device.lastSeen = new Date().toISOString();
      await db.getDb().write();
    }
    io.emit('device-update', { deviceId: socket.data.deviceId, ...payload });
  });

  socket.on('disconnect', () => {
    console.log(`Device disconnected: ${socket.id}`);
    io.emit('device-disconnected', socket.id);
  });
}

module.exports = { handleSocketConnection, updateDevice, saveScan };
