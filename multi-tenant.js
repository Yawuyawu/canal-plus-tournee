// CONFIG
const MASTER_KEY = '$2a$10$ucVCxh7kyGTmZPIH.6JHQOHdQGUTyWD6o7Am0byx6fDKCb2cTlO0y';
const BIN_MASTER_ID = '6a245702f5f4af5e29c32b19';
const IS_BOSS = localStorage.getItem('role') === 'boss';

// 1. Login + création bin auto
if (!localStorage.getItem('userBin') && !IS_BOSS) {
  let pseudo = '';
  while (!pseudo) {
    pseudo = prompt("Ton nom commercial, sans espace:");
    if (pseudo === null) throw 'Setup annulé';
    pseudo = pseudo.toLowerCase().replace(/\s/g,'').replace(/[^a-z0-9]/g,'');
    if (!pseudo) alert('Pseudo invalide. Lettres/chiffres uniquement');
  }
  fetch('https://api.jsonbin.io/v3/b', {
    method: 'POST',
    headers: {'Content-Type':'application/json','X-Master-Key':MASTER_KEY,'X-Bin-Name':pseudo},
    body: JSON.stringify([])
  }).then(r => r.json()).then(data => {
    localStorage.setItem('userBin', data.metadata.id);
    localStorage.setItem('pseudo', pseudo);
    location.reload();
  });
}

const USER_BIN_ID = localStorage.getItem('userBin');
const PSEUDO = localStorage.getItem('pseudo') || 'boss';

// 2. Load : Boss agrège, User lit son bin
window.loadPDV = async function() {
  try {
    if (IS_BOSS) {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_MASTER_ID}/latest`, {
        headers: {'X-Master-Key': MASTER_KEY}
      });
      const allData = (await res.json()).record || {};
      window.pdvData = [];
      Object.keys(allData).forEach(user => {
        if(user === '_init') return;
        if(Array.isArray(allData)) {
          allData.forEach(p => window.pdvData.push({...p, owner: user}));
        }
      });
    } else {
      if(!USER_BIN_ID) return;
      const res = await fetch(`https://api.jsonbin.io/v3/b/${USER_BIN_ID}/latest`, {
        headers: {'X-Master-Key': MASTER_KEY}
      });
      window.pdvData = (await res.json()).record || [];
    }
    if(typeof initMap === 'function') initMap();
  } catch(e) {
    console.log('Load error:', e);
    window.pdvData = [];
    if(typeof initMap === 'function') initMap();
  }
}

// 3. Save : User sauve chez lui + update master
window.savePDV = async function() {
  if (IS_BOSS) return alert("Mode Boss = lecture seule");
  if(!USER_BIN_ID || !PSEUDO) return alert('Erreur user');
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${USER_BIN_ID}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Master-Key':MASTER_KEY},
      body: JSON.stringify(window.pdvData || [])
    });
    const masterRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_MASTER_ID}/latest`, {
      headers: {'X-Master-Key': MASTER_KEY}
    });
    const masterData = (await masterRes.json()).record || {"_init": true};
    masterData[PSEUDO] = window.pdvData || [];
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_MASTER_ID}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Master-Key':MASTER_KEY},
      body: JSON.stringify(masterData)
    });
    alert('Sauvé + sync boss OK');
  } catch(e) {
    alert('Erreur save: ' + e);
  }
}

window.setBossMode = () => {
  localStorage.setItem('role','boss');
  localStorage.removeItem('userBin');
  location.reload();
}

window.resetUser = () => {
  localStorage.clear();
  location.reload();
}

document.addEventListener('DOMContentLoaded', loadPDV);
