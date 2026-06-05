const express = require('express');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

app.use(express.json());
let jobsDB = [];
let requestsDB = [];
let jobId = 0;
const MEMORY_FILE = 'pont_memory.json';

if (fs.existsSync(MEMORY_FILE)) {
  const data = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  jobsDB = data.jobs || [];
  jobId = jobsDB.length > 0? Math.max(...jobsDB.map(j => j.id)) : 0;
}

function saveMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({jobs: jobsDB, requests: requestsDB}, null, 2));
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({type: 'connected'}));
});

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data));
  });
}

app.post('/api/job', (req, res) => {
  const { name, phone, lat, lon, category } = req.body;
  jobId++;
  const newJob = { id: jobId, name, phone, lat, lon, category, source: 'USER', date: Date.now() };
  jobsDB.push(newJob);
  saveMemory();
  broadcast({type: 'new_job', data: newJob});
  res.json({ success: true, job: newJob });
});

app.get('/api/jobs', (req, res) => {
  const { lat, lon } = req.query;
  let all = [...jobsDB];
  if (lat && lon) {
    all = all.filter(j => {
      const R = 6371; const dLat = (j.lat - lat) * Math.PI/180; const dLon = (j.lon - lon) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat * Math.PI/180) * Math.cos(j.lat * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) <= 50;
    });
  }
  res.json(all);
});

server.listen(port, () => console.log(`Backend on ${port}`));
