import fs from 'fs';
const FILE = '/tmp/pdv.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(FILE, 'utf8');
      return res.status(200).json(JSON.parse(data));
    } catch {
      return res.status(200).json([]);
    }
  }
  
  if (req.method === 'POST') {
    fs.writeFileSync(FILE, JSON.stringify(req.body));
    return res.status(200).json({ok: true});
  }
}
