const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let points = 1;
let pdvList = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/points', (req, res) => {
  res.json({ points, pdvList });
});

app.post('/api/points', (req, res) => {
  points = req.body.points;
  if(req.body.pdv) pdvList.unshift(req.body.pdv);
  res.json({ success: true, points });
});

// ROUTE MAIL COMPLÈTE - COMME AVANT
app.post('/api/tournee-mail', async (req, res) => {
  try {
    const { nom, emailFrom, password, emailTo, stock, credit, recrut, reab, commentaire, lat, lon } = req.body;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailFrom, pass: password }
    });

    const mailOptions = {
      from: emailFrom,
      to: emailTo,
      subject: `CR Tournée Canal+ - ${nom}`,
      html: `
        <h2>Compte Rendu Tournée</h2>
        <p><b>Commercial:</b> ${nom}</p>
        <p><b>Position GPS:</b> ${lat}, ${lon}</p>
        <p><b>Stock PDV:</b> ${stock}</p>
        <p><b>Crédit FCFA:</b> ${credit}</p>
        <p><b>Recrutement:</b> ${recrut}</p>
        <p><b>Réabonnement:</b> ${reab}</p>
        <p><b>Commentaire:</b> ${commentaire}</p>
        <p><b>Date:</b> ${new Date().toLocaleString('fr-FR')}</p>
        <p><a href="https://maps.google.com/?q=${lat},${lon}">Voir sur Google Maps</a></p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
