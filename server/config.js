module.exports = {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
  },
  database: {
    file: process.env.DB_FILE || 'l3mon.json'
  },
  geoip: {
    citiesDb: process.env.GEOIP_CITIES_DB || 'GeoLite2-City.mmdb'
  },
  collections: {
    devices: 'devices',
    scans: 'scans',
    locations: 'locations',
    alerts: 'alerts'
  },
  thresholds: {
    highRiskScore: 5,
    dangerousPermissions: 6,
    legacySdkVersion: 26
  }
};
