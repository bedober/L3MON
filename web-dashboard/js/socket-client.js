window.L3MON = window.L3MON || {};

L3MON.SocketClient = function(onMessage) {
  this.io = io();
  this.handlers = {};
  this.connected = false;
  this.setup();

  if (typeof onMessage === 'function') {
    this.on('message', onMessage);
  }
};

L3MON.SocketClient.prototype.setup = function() {
  var self = this;

  this.io.on('connect', function() {
    self.connected = true;
    self.emit('connection-status', 'connected');
    console.log('[Socket] Connected to server as', self.io.id);
  });

  this.io.on('disconnect', function() {
    self.connected = false;
    self.emit('connection-status', 'disconnected');
    console.log('[Socket] Disconnected from server');
  });

  this.io.on('device-connected', function(device) {
    self.emit('device-connected', device);
  });

  this.io.on('device-update', function(data) {
    self.emit('device-update', data);
  });

  this.io.on('device-disconnected', function(socketId) {
    self.emit('device-disconnected', socketId);
  });

  this.io.on('new-scan', function(data) {
    self.emit('new-scan', data);
  });
};

L3MON.SocketClient.prototype.on = function(event, handler) {
  if (!this.handlers[event]) {
    this.handlers[event] = [];
  }
  this.handlers[event].push(handler);
};

L3MON.SocketClient.prototype.emit = function(event) {
  var handlers = this.handlers[event];
  if (!handlers) return;
  var args = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < handlers.length; i++) {
    handlers[i].apply(null, args);
  }
};

L3MON.SocketClient.prototype.disconnect = function() {
  this.io.disconnect();
};
