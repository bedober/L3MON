const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

router.get('/', async (req, res) => {
  await db.getDb().read();
  const alerts = db.getDb().data[config.collections.alerts]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(alerts);
});

router.get('/device/:deviceId', async (req, res) => {
  await db.getDb().read();
  const alerts = db.getDb().data[config.collections.alerts]
    .filter(a => a.deviceId === req.params.deviceId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(alerts);
});

router.post('/dismiss/:id', async (req, res) => {
  await db.getDb().read();
  const alerts = db.getDb().data[config.collections.alerts];
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.dismissed = true;
  await db.getDb().write();
  res.json(alert);
});

module.exports = router;
