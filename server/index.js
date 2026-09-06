const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db');
const { handleSocketConnection } = require('./services/socketService');

const app = express();
app.use(cors());
app.use(express.json());

const dashboardPath = path.join(__dirname, '..', 'web-dashboard');
app.use(express.static(dashboardPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

db.initialize().then(() => {
  console.log('Database initialized');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

io.on('connection', socket => handleSocketConnection(socket, io));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const routes = require('./routes');
app.use('/api/devices', routes.devices);
app.use('/api/scans', routes.scans);
app.use('/api/locations', routes.locations);
app.use('/api/alerts', routes.alerts);

app.get('/', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

httpServer.listen(config.server.port, config.server.host, () => {
  console.log(`L3MON server listening on ${config.server.host}:${config.server.port}`);
});
