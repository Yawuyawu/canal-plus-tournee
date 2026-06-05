const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Pas de base de données, juste une variable
let points = 1;

app.get('/api/points', (req, res) => {
  res.json({ points });
});

app.post('/api/points', (req, res) => {
  points = req.body.points;
  res.json({ success: true, points });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
