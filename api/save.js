import { writeFile, readFile } from 'fs/promises';

const DB_FILE = '/tmp/codes.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const data = await readFile(DB_FILE, 'utf8');
      return res.status(200).json(JSON.parse(data));
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { code, type } = req.body;
    if (!code || !type) return res.status(400).json({ error: 'code et type requis' });
    
    let codes = [];
    try {
      codes = JSON.parse(await readFile(DB_FILE, 'utf8'));
    } catch {}
    
    codes.push({ code, type, date: new Date().toISOString() });
    await writeFile(DB_FILE, JSON.stringify(codes, null, 2));
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
