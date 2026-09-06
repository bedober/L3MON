L3MON.Map = function(containerId) {
  this.containerId = containerId;
  this.map = null;
  this.markers = {};
  this.init();
};

L3MON.Map.prototype.init = function() {
  this.map = L.map(this.containerId).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(this.map);

  this.map.on('click', function() {
    document.querySelectorAll('.device-item').forEach(function(el) {
      el.classList.remove('selected');
    });
  });
};

L3MON.Map.prototype.updateDevice = function(device) {
  if (!device.lat || !device.lon) return;

  var key = device.id;
  var online = device.lastSeen && (Date.now() - new Date(device.lastSeen).getTime()) < 60000;
  var color = online ? '#4caf50' : '#9e9e9e';

  var icon = L.divIcon({
    className: 'device-marker',
    html: '<div class="marker-pn" style="background:' + color + '"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 20]
  });

  var popupHtml = '<div style="min-width:180px"><strong>' + device.name + '</strong><br>';
  popupHtml += 'Model: ' + (device.model || 'N/A') + '<br>';
  popupHtml += 'OS: ' + (device.osVersion || 'N/A') + '<br>';
  popupHtml += 'Apps: ' + (device.installedApps || 0) + '<br>';
  popupHtml += 'Last seen: ' + (device.lastSeen || 'N/A') + '<br>';
  if (device.country) popupHtml += 'Location: ' + device.country;
  if (device.highestRiskScore >= 5) popupHtml += '<br><span style="color:#bd261e;font-weight:600">High risk findings</span>';
  popupHtml += '</div>';

  var latlng = [device.lat, device.lon];
  var marker = this.markers[key];

  if (marker) {
    marker.setLatLng(latlng);
    marker.setIcon(icon);
    marker.setPopupContent(popupHtml);
  } else {
    marker = L.marker(latlng, { icon: icon }).bindPopup(popupHtml).addTo(this.map);
    this.markers[key] = marker;
  }

  var alertKey = key + '_alert';
  if (device.highestRiskScore >= 5) {
    var alertIcon = L.divIcon({
      className: 'risk-badge',
      html: '<span class="risk-badge-inner">' + device.highestRiskScore + '</span>',
      iconSize: [24, 24],
      iconAnchor: [12, 0],
      className: 'alert-marker'
    });
    var alertMarker = L.marker(latlng, { icon: alertIcon, clickable: false, interactive: false }).addTo(this.map);
    if (this.markers[alertKey]) this.map.removeLayer(this.markers[alertKey]);
    this.markers[alertKey] = alertMarker;
  } else {
    if (this.markers[alertKey]) {
      this.map.removeLayer(this.markers[alertKey]);
      delete this.markers[alertKey];
    }
  }
};

L3MON.Map.prototype.fitToDevices = function() {
  var layers = [];
  for (var key in this.markers) {
    if (key.indexOf('_alert') === -1 && this.markers[key] instanceof L.Marker) {
      layers.push(this.markers[key]);
    }
  }
  if (layers.length > 0) {
    var group = new L.featureGroup(layers);
    this.map.fitBounds(group.getBounds().pad(0.5));
  }
};

L3MON.Map.prototype.focusDevice = function(deviceId) {
  var marker = this.markers[deviceId];
  if (marker && marker instanceof L.Marker) {
    this.map.setView([marker.getLatLng().lat, marker.getLatLng().lng], 8);
    marker.openPopup();
    return;
  }
};
