const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const config = require('../config');

const defaultData = {
  devices: [],
  scans: [],
  locations: [],
  alerts: []
};

const file = path.join(__dirname, '..', config.database.file);
const adapter = new JSONFile(file);
const db = new Low(adapter, { defaultData });

async function initialize() {
  await db.read();
  db.data = db.data || { ...defaultData };
  db.data.devices = db.data.devices || [];
  db.data.scans = db.data.scans || [];
  db.data.locations = db.data.locations || [];
  db.data.alerts = db.data.alerts || [];
  await db.write();
}

function getDb() {
  return db;
}

module.exports = { initialize, getDb };
