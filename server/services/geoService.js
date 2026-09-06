const geoip = require('geoip-lite');

function lookupLocation(ip) {
  if (!ip) return null;
  const cleanIp = ip.replace('::ffff:', '');
  const geo = geoip.lookup(cleanIp);
  if (!geo) return null;
  return {
    lat: geo.ll[0],
    lon: geo.ll[1],
    country: geo.country,
    region: geo.region,
    city: geo.city,
    ll: geo.ll,
    timezone: geo.timezone,
    asn: geo.asn,
    isp: geo.isp
  };
}

function enrichLocation(ip) {
  const location = lookupLocation(ip);
  if (!location) return { lat: null, lon: null, country: null };
  return location;
}

module.exports = { lookupLocation, enrichLocation };
