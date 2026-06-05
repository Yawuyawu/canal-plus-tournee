const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.static('public'));

let points = 0;
let pdvList = [];
let historiqueVisites = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/points', (req, res) => {
  res.json({ points, pdvList, historiqueVisites });
});

app.post('/api/points', (req, res) => {
  points = req.body.points;
  if (req.body.pdv) {
    pdvList.unshift(req.body.pdv);
  }
  res.json({ success: true, points });
});

app.post('/api/visite', (req, res) => {
  const { pdvIndex, visiteData } = req.body;
  if (pdvList[pdvIndex]) {
    pdvList[pdvIndex].visited = true;
    pdvList[pdvIndex].lastVisit = new Date().toLocaleString('fr-FR');
    pdvList[pdvIndex].lastStock = visiteData.stock;
    pdvList[pdvIndex].lastCredit = visiteData.credit;
    pdvList[pdvIndex].lastRecrut = visiteData.recrut;
    pdvList[pdvIndex].lastReab = visiteData.reab;

    historiqueVisites.unshift({
      pdvNom: pdvList[pdvIndex].nom,
      date: pdvList[pdvIndex].lastVisit,
     ...visiteData
    });
  }
  res.json({ success: true });
});

app.get('/api/export-excel', (req, res) => {
  const ws = XLSX.utils.json_to_sheet(pdvList.map(p => ({
    'Nom PDV': p.nom,
    'Contact': p.contact,
    'Téléphone': p.phone,
    'Catégorie': p.category,
    'Distributeur': p.distributeur,
    'Stock Actuel': p.stock,
    'Crédit Actuel': p.credit,
    'Visité': p.visited? 'OUI' : 'NON',
    'Dernière Visite': p.lastVisit || 'Jamais',
    'Stock Dernière Visite': p.lastStock || '',
    'Recrut Dernière Visite': p.lastRecrut || '',
    'Réab Dernière Visite': p.lastReab || ''
  })));

  const ws2 = XLSX.utils.json_to_sheet(historiqueVisites);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PDV');
  XLSX.utils.book_append_sheet(wb, ws2, 'Historique Visites');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=tournee-canal.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
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
    if (!bossEmail ||!senderPass ||!senderEmail ||!agent) return res.json({ok: false, mail: 'Champs obligatoires manquants'});

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
        <b>Stock Total PDV:</b> ${stockPdv || '0'}<br>
        <b>Crédit Total PDV:</b> ${creditPdv || '0'} FCFA<br>
        <b>Total Recrutement:</b> ${nbRecrutement || '0'}<br>
        <b>Total Réabonnement:</b> ${nbReabo || '0'}<br><br>
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
  console.log(`Serveur V2 Chef de Zone démarré sur le port ${PORT}`);
});
