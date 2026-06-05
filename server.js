const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.static('public'));

let points = 0;
let pdvList = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/points', (req, res) => {
  res.json({ points, pdvList });
});

app.post('/api/points', (req, res) => {
  points = req.body.points;
  if (req.body.pdv) pdvList.unshift(req.body.pdv);
  res.json({ success: true, points });
});

function getTransporter(senderEmail, senderPass) {
  const isOutlook = senderEmail.includes('@outlook.') || senderEmail.includes('@hotmail.') || senderEmail.includes('@live.') || senderEmail.includes('canal-plus');
  if (isOutlook) {
    return nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: { user: senderEmail, pass: senderPass },
      tls: { rejectUnauthorized: false }
    });
  } else {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: senderEmail, pass: senderPass }
    });
  }
}

app.post('/api/tournee-mail', async (req, res) => {
  try {
    const { agent, visited, total, listHtml, crTexte, stockPdv, creditPdv, nbRecrutement, nbReabo, bossEmail, senderEmail, senderPass } = req.body;
    if (!bossEmail || !senderPass || !senderEmail || !agent) return res.json({ok: false, mail: 'Champs obligatoires manquants'});

    const transporter = getTransporter(senderEmail, senderPass);
    await transporter.sendMail({
      from: `"${agent} - CANAL+" <${senderEmail}>`,
      to: bossEmail,
      cc: senderEmail,
      subject: `Compte Rendu Tournée CANAL+ - ${visited}/${total} PDV`,
      html: `
        <h2>Compte Rendu Tournée Commerciale CANAL+</h2>
        <b>Agent:</b> ${agent}<br>
        <b>Avancement:</b> ${visited}/${total} PDV visités<br>
        <b>Date:</b> ${new Date().toLocaleString('fr-FR')}<br><br>
        <b>Stock PDV:</b> ${stockPdv || '0'}<br>
        <b>Crédit PDV:</b> ${creditPdv || '0'} FCFA<br>
        <b>Nombre de recrutement:</b> ${nbRecrutement || '0'}<br>
        <b>Nombre de réabonnement:</b> ${nbReabo || '0'}<br><br>
        <b>Commentaire général:</b><br>${crTexte || 'Aucun'}<br><br>
        <b>Détail de la tournée:</b><br>
        ${listHtml}
      `
    });
    res.json({ok: true, mail: 'envoyé + copie'});
  } catch (e) {
    res.json({ok: false, mail: 'erreur: ' + e.message});
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
