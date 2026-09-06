const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

router.get('/device/:deviceId', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  await db.getDb().read();
  const locations = db.getDb().data[config.collections.locations]
    .filter(l => l.deviceId === req.params.deviceId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
  res.json(locations);
});

module.exports = router;
