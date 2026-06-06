export const config = { api: { bodyParser: true } };
const CRUD = 'https://crudcrud.com/api/COLLE_TA_NOUVELLE_URL_ICI/points';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  try {
    if (req.method === 'GET') {
      const r = await fetch(CRUD);
      const data = await r.json();
      const clean = data.map(({_id, ...rest}) => rest);
      return res.status(200).json(clean);
    }
    
    if (req.method === 'POST') {
      await fetch(CRUD, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(req.body)
      });
      return res.status(200).json({success:true});
    }
    
    res.status(405).end();
  } catch (e) { 
    res.status(500).json({error:e.message}); 
  }
}
