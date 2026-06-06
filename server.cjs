const express = require('express');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors(), express.json({limit: '10mb'}));
const DB = './points.json';
if (!fs.existsSync(DB)) fs.writeFileSync(DB, '[]');

app.get('/api/points', (req, res) => {
  const points = JSON.parse(fs.readFileSync(DB));
  res.json(points);
});

app.post('/api/add', (req, res) => {
  const {name, category, phone, distributor, lat, lon} = req.body;
  if(!name ||!phone) return res.json({ok:false, error:'Nom + Téléphone obligatoires'});
  const points = JSON.parse(fs.readFileSync(DB));
  points.push({id: Date.now(), name, category, phone, distributor, lat, lon, visited: false});
  fs.writeFileSync(DB, JSON.stringify(points, null, 2));
  res.json({ok: true});
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

app.post('/api/visit', async (req, res) => {
  const {pointId, pointName, notes, photo, agent, sendmail, lat, lon, distance, bossEmail, senderEmail, senderPass} = req.body;
  const points = JSON.parse(fs.readFileSync(DB));
  const idx = points.findIndex(p => p.id == pointId);
  if (idx >= 0) points[idx].visited = true;
  fs.writeFileSync(DB, JSON.stringify(points, null, 2));

  if (!sendmail ||!bossEmail ||!senderEmail ||!senderPass) return res.json({ok: true, mail: 'non envoyé'});

  try {
    const transporter = getTransporter(senderEmail, senderPass);
    await transporter.sendMail({
      from: `"${agent} - CANAL+" <${senderEmail}>`,
      to: bossEmail,
      cc: senderEmail,
      subject: `Rapport Visite PDV: ${pointName}`,
      html: `
        <h2>Rapport de visite terrain CANAL+</h2>
        <b>PDV:</b> ${pointName}<br>
        <b>Agent:</b> ${agent}<br>
        <b>Distance depuis GPS:</b> ${distance} km<br>
        <b>Position GPS:</b> ${lat}, ${lon}<br>
        <b>Date:</b> ${new Date().toLocaleString()}<br>
        <b>Notes:</b><br>${notes}<br>
        ${photo? `<br><b>Photo:</b><br><img src="${photo}" width="300"/>` : ''}
      `
    });
    res.json({ok: true, mail: 'envoyé + copie'});
  } catch (e) {
    res.json({ok: false, mail: 'erreur: ' + e.message});
  }
});

app.post('/api/tournee-mail', async (req, res) => {
  const {agent, visited, total, listHtml, crTexte, stockPdv, creditPdv, nbRecrutement, nbReabo, bossEmail, senderEmail, senderPass} = req.body;
  if (!bossEmail ||!senderPass ||!senderEmail ||!agent) return res.json({ok: false, mail: 'Champs obligatoires manquants'});

  try {
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
        <b>Date:</b> ${new Date().toLocaleString()}<br><br>
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

app.listen(3000, () => console.log('CANAL+ BACKEND READY on http://localhost:3000'));
