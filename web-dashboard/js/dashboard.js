L3MON.Dashboard = function() {
  this.devices = {};
  this.alerts = {};
  this.scans = {};
  this.socket = null;
  this.map = null;

  this.$connectionStatus = document.getElementById('connection-status');
  this.$deviceCount = document.getElementById('device-count');
  this.$alertCount = document.getElementById('alert-count');
  this.$deviceList = document.getElementById('device-list');
  this.$alertList = document.getElementById('alert-list');
  this.$scanList = document.getElementById('scan-list');
};

L3MON.Dashboard.prototype.init = function() {
  this.socket = new L3MON.SocketClient();
  this.setupSocketHandlers();

  this.map = new L3MON.Map('map');

  this.fetchInitialData();
};

L3MON.Dashboard.prototype.fetchInitialData = function() {
  var self = this;

  fetch('/api/devices').then(function(r) { return r.json(); }).then(function(devices) {
    devices.forEach(function(d) { self.updateDevice(d); });
  }).catch(function(e) { console.error('Failed to load devices:', e); });

  fetch('/api/alerts').then(function(r) { return r.json(); }).then(function(alerts) {
    alerts.forEach(function(a) { self.updateAlert(a); });
    self.updateAlertCount();
  }).catch(function(e) { console.error('Failed to load alerts:', e); });
};

L3MON.Dashboard.prototype.setupSocketHandlers = function() {
  var self = this;

  this.socket.on('connection-status', function(status) {
    self.updateConnectionStatus(status);
  });

  this.socket.on('device-connected', function(device) {
    self.updateDevice(device);
  });

  this.socket.on('device-update', function(data) {
    self.updateDevice(data);
  });

  this.socket.on('device-disconnected', function(socketId) {
    var found = false;
    Object.keys(self.devices).forEach(function(id) {
      if (self.devices[id].lastSocketId === socketId) {
        self.devices[id].online = false;
        self.devices[id].lastSeen = null;
        self.updateDevice(self.devices[id]);
        found = true;
      }
    });
  });

  this.socket.on('new-scan', function(data) {
    self.updateScan(data);
  });
};

L3MON.Dashboard.prototype.updateConnectionStatus = function(status) {
  if (status === 'connected') {
    this.$connectionStatus.textContent = 'Connected';
    this.$connectionStatus.className = 'status-connected';
  } else {
    this.$connectionStatus.textContent = 'Disconnected';
    this.$connectionStatus.className = 'status-disconnected';
  }
};

L3MON.Dashboard.prototype.updateDevice = function(data) {
  if (!data || !data.id) return;

  var existing = this.devices[data.id] || {};
  this.devices[data.id] = Object.assign(existing, data);
  this.devices[data.id].online = true;

  this.renderDeviceList();
  this.renderDeviceCount();

  if (this.map) {
    this.map.updateDevice(this.devices[data.id]);
  }
};

L3MON.Dashboard.prototype.renderDeviceList = function() {
  this.$deviceList.innerHTML = '';

  var self = this;
  var sorted = Object.values(this.devices).sort(function(a, b) {
    return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
  });

  sorted.forEach(function(device) {
    var li = document.createElement('li');
    li.className = 'device-item ' + (device.online ? 'device-online' : 'device-offline');
    li.dataset.deviceId = device.id;

    var riskScore = device.highestRiskScore || 0;
    var riskClass = riskScore >= 5 ? 'alert-high' : riskScore > 0 ? 'alert-review' : '';

    li.innerHTML = '<strong>' + device.name + '</strong> (' + device.model + ')';
    if (riskClass) {
      li.innerHTML += ' <span class="' + riskClass + '">[' + riskScore + ']</span>';
    }
    li.innerHTML += '<br><span class="location-coords">' + (device.country || 'Unknown') + '</span>';
    li.addEventListener('click', function() {
      if (self.map) self.map.focusDevice(device.id);
    });

    self.$deviceList.appendChild(li);
  });
};

L3MON.Dashboard.prototype.renderDeviceCount = function() {
  var online = Object.values(this.devices).filter(function(d) { return d.online; }).length;
  this.$deviceCount.textContent = online + ' device(s) online';
};

L3MON.Dashboard.prototype.updateScan = function(data) {
  if (!data || !data.scan) return;
  var scan = data.scan;
  this.scans[scan.id] = scan;
  this.renderScanList();

  var device = this.devices[scan.deviceId];
  if (device && scan.findings && scan.findings.length > 0) {
    var maxScore = Math.max.apply(null, scan.findings.map(function(f) { return f.score || 0; }));
    device.highestRiskScore = maxScore;
    this.updateDevice(device);
  }

  if (data.newAlerts) {
    var self = this;
    data.newAlerts.forEach(function(alert) {
      self.updateAlert(alert);
    });
    this.updateAlertCount();
  }
};

L3MON.Dashboard.prototype.renderScanList = function() {
  this.$scanList.innerHTML = '';

  var self = this;
  var sorted = Object.values(this.scans).sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  }).slice(0, 20);

  sorted.forEach(function(scan) {
    var li = document.createElement('li');
    li.className = 'scan-item';

    var device = self.devices[scan.deviceId];
    var deviceName = device ? device.name : scan.deviceId;

    li.innerHTML = '<strong>' + deviceName + '</strong><br>';
    li.innerHTML += '<span class="location-coords">' + new Date(scan.timestamp).toLocaleTimeString() + '</span><br>';
    li.innerHTML += scan.flaggedApps + '/' + scan.totalApps + ' apps flagged';

    self.$scanList.appendChild(li);
  });
};

L3MON.Dashboard.prototype.updateAlert = function(alert) {
  this.alerts[alert.id] = alert;
  this.renderAlertList();
};

L3MON.Dashboard.prototype.renderAlertList = function() {
  this.$alertList.innerHTML = '';

  var self = this;
  var sorted = Object.values(this.alerts).sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  sorted.slice(0, 30).forEach(function(alert) {
    var li = document.createElement('li');
    li.className = 'alert-item';
    if (alert.dismissed) li.classList.add('alert-dismissed');

    var levelClass = alert.level === 'HIGH' ? 'alert-high' : 'alert-review';
    li.innerHTML = '<span class="' + levelClass + '">' + alert.level + '</span> ' + alert.label;
    li.innerHTML += '<br><span class="location-coords">' + alert.packageName + '</span>';
    li.innerHTML += '<br><span class="location-coords">' + alert.messages.join(', ') + '</span>';

    li.addEventListener('click', function() {
      var device = self.devices[alert.deviceId];
      if (device && self.map) self.map.focusDevice(alert.deviceId);
    });

    self.$alertList.appendChild(li);
  });
};

L3MON.Dashboard.prototype.updateAlertCount = function() {
  var active = Object.values(this.alerts).filter(function(a) { return !a.dismissed; }).length;
  this.$alertCount.textContent = active + ' active alerts';
};

L3MON.init = function() {
  L3MON.dashboard = new L3MON.Dashboard();
  L3MON.dashboard.init();
};
