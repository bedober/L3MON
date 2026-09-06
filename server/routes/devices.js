const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

router.get('/', async (req, res) => {
  await db.getDb().read();
  const devices = db.getDb().data[config.collections.devices];
  res.json(devices);
});

router.get('/:id', async (req, res) => {
  await db.getDb().read();
  const devices = db.getDb().data[config.collections.devices];
  const device = devices.find(d => d.id === req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

module.exports = router;
