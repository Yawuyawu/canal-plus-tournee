const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const dbPath = path.join(__dirname, 'db.json');

// GET tous les PDV
app.get('/api/pdvs', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  res.json(data.pdvs || []);
});

// POST ajouter PDV
app.post('/api/add', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const newPdv = { id: Date.now(), visite: false, ventes: 0, ...req.body };
  data.pdvs.push(newPdv);
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  res.json(newPdv);
});

// POST visite
app.post('/api/visit', (req, res) => {
  const { pointId, stock, ventes, problemes } = req.body;
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const pdv = data.pdvs.find(p => p.id == pointId);
  if (pdv) {
    pdv.stock = stock;
    pdv.ventes = ventes;
    pdv.problemes = problemes;
    pdv.visite = true;
    pdv.derniere_visite = new Date().toISOString();
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
