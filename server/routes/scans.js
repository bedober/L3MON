const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

router.get('/device/:deviceId', async (req, res) => {
  await db.getDb().read();
  const scans = db.getDb().data[config.collections.scans]
    .filter(s => s.deviceId === req.params.deviceId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(scans);
});

router.get('/:id', async (req, res) => {
  await db.getDb().read();
  const scans = db.getDb().data[config.collections.scans];
  const scan = scans.find(s => s.id === req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.json(scan);
});

module.exports = router;
