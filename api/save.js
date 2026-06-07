export default function handler(req, res) {
  // CORS pour éviter les erreurs
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Pour l’instant on renvoie vide, pas de DB
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    // On simule OK mais on save rien, Vercel a pas de disque
    console.log('Data reçue:', req.body);
    return res.status(200).json({ok: true, message: "Recu mais pas sauvé sur Vercel"});
  }

  return res.status(405).json({error: 'Method not allowed'});
}
