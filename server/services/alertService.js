const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const db = require('../db');

function generateAlert(device, finding) {
  const score = finding.score;
  let level = 'REVIEW';
  if (score >= config.thresholds.highRiskScore) level = 'HIGH';

  const signals = finding.signals || [];
  const highRiskSignals = signals.filter(s =>
    s.toLowerCase().includes('debuggable') ||
    s.toLowerCase().includes('cleartext')
  );
  if (highRiskSignals.length > 0) level = 'HIGH';

  return {
    id: uuidv4(),
    deviceId: device.id,
    packageName: finding.packageName,
    label: finding.label,
    level,
    messages: signals,
    score,
    dismissed: false,
    timestamp: new Date().toISOString()
  };
}

async function processScanResults(device, scanResults) {
  await db.getDb().read();
  const data = db.getDb().data;
  const alerts = data[config.collections.alerts];

  const newAlerts = [];
  for (const finding of scanResults.findings || []) {
    if (finding.score >= config.thresholds.highRiskScore * 0.6) {
      const alert = generateAlert(device, finding);
      alerts.unshift(alert);
      newAlerts.push(alert);
    }
  }
  await db.getDb().write();
  return newAlerts;
}

module.exports = { generateAlert, processScanResults };
