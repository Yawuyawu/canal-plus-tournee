const MASTER_KEY = '$2a$10$...'; // garde ta vraie clé
const BIN_MASTER_ID = '6a245702f5f4af5e29c32b19';

const IS_BOSS = localStorage.getItem('role') === 'boss';
const PSEUDO = localStorage.getItem('pseudo');
let USER_BIN_ID = localStorage.getItem('userBin');

// 1. Sauvegarde locale de sécurité
function backupLocal() {
  if(window.pdvData && window.pdvData.length > 0) {
    localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
  }
}

// 2. Restaure si vide
function restoreLocal() {
  const backup = localStorage.getItem('pdv_backup');
  if(backup && (!window.pdvData || window.pdvData.length === 0)) {
    window.pdvData = JSON.parse(backup);
    console.log('Backup restauré:', window.pdvData.length, 'PDV');
  }
}

// 3. Load PDV : ne vide JAMAIS avant d'avoir récupéré le cloud
window.loadPDV = async function() {
  backupLocal(); // sauve avant tout

  try {
    if(IS_BOSS) {
      // Mode Boss : agrège tout
      const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_MASTER_ID}/latest`, {
        headers: {'X-Master-Key': MASTER_KEY}
      });
      const master = (await res.json()).record || {};
      window.pdvData = [];
      Object.keys(master).forEach(user => {
        if(user!== '_init' && Array.isArray(master[user])) {
          master[user].forEach(pdv => pdv.owner = user);
          window.pdvData.push(...master[user]);
        }
      });
    } else {
      // Mode User : son bin
      if(!USER_BIN_ID) return createUserBin();
      const res = await fetch(`https://api.jsonbin.io/v3/b/${USER_BIN_ID}/latest`, {
        headers: {'X-Master-Key': MASTER_KEY}
      });
      const cloudData = (await res.json()).record || [];
      // Si cloud vide mais on a du local, on garde le local
      window.pdvData = cloudData.length > 0? cloudData : window.pdvData || [];
    }

    backupLocal(); // re-sauve après load
    if(window.initMap) window.initMap();
    if(window.updateCounters) updateCounters();

  } catch(e) {
    console.error('Erreur load:', e);
    restoreLocal(); // récupère le backup si crash
    if(window.initMap) window.initMap();
  }
}

// 4. Save : backup à chaque save
window.savePDV = async function() {
  if (IS_BOSS) return alert("Mode Boss = lecture seule");
  if(!USER_BIN_ID ||!PSEUDO) return alert('Erreur user');

  backupLocal(); // sécurité

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

    backupLocal();
    alert('Sauvé + sync boss OK');
  } catch(e) {
    alert('Erreur save: ' + e);
    restoreLocal();
  }
}

window.setBossMode = () => {
  localStorage.setItem('role','boss');
  localStorage.removeItem('userBin');
  location.reload();
}

window.resetUser = () => {
  if(confirm('Effacer toutes les données locales?')) {
    localStorage.clear();
    location.reload();
  }
}

// Démarrage : restaure backup si dispo
document.addEventListener('DOMContentLoaded', () => {
  restoreLocal();
  loadPDV();
});
