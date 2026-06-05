const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let points = 1;

app.get('/api/points', (req, res) => {
  res.json({ points });
});

app.post('/api/points', (req, res) => {
  const { points: newPoints } = req.body;
  if (typeof newPoints === 'number') {
    points = newPoints;
    res.json({ success: true, points });
  } else {
    res.status(400).json({ success: false, error: 'Invalid points value' });
  }
});

// ROUTE EXPLICITE POUR LA RACINE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
