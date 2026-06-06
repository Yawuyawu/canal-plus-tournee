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

// 5. Modifier un PDV existant
window.editPDV = function(index) {
  if (IS_BOSS) return alert("Mode Boss = lecture seule");

  const pdv = window.pdvData[index];
  if(!pdv) return;

  const newCredit = prompt(`Modifier CR pour ${pdv.nom || 'PDV'}:`, pdv.credit || pdv.stock_deco || 0);
  if(newCredit === null) return; // annulé

  const newStock = prompt(`Modifier Stock pour ${pdv.nom || 'PDV'}:`, pdv.stock || pdv.stock_deco || 0);
  if(newStock === null) return;

  const newVentes = prompt(`Modifier Ventes pour ${pdv.nom || 'PDV'}:`, pdv.ventes || 0);
  if(newVentes === null) return;

  // Update
  window.pdvData[index].credit = parseInt(newCredit) || 0;
  window.pdvData[index].stock = parseInt(newStock) || 0;
  window.pdvData[index].ventes = parseInt(newVentes) || 0;

  backupLocal();
  updateCounters();
  if(window.refreshMap) window.refreshMap();

  // Auto-save
  savePDV();
}

// 6. Ajoute les boutons Edit sur chaque marker PDV
const oldRenderMarkers = window.renderMarkers || function(){};
window.renderMarkers = function() {
  oldRenderMarkers();

  // Si t'utilises Leaflet/Google Maps, adapte ici
  // Exemple: ajoute un popup avec bouton Edit
  if(window.pdvMarkers) {
    window.pdvMarkers.forEach((marker, i) => {
      marker.bindPopup(`
        <b>${window.pdvData[i].nom || 'PDV'}</b><br>
        CR: ${window.pdvData[i].credit || 0}<br>
        Stock: ${window.pdvData[i].stock || 0}<br>
        Ventes: ${window.pdvData[i].ventes || 0}<br>
        <button onclick="editPDV(${i})" style="margin-top:5px;padding:5px 10px;background:#2196F3;color:white;border:none;border-radius:4px">✏️ Modifier</button>
      `);
    });
  }
}

// V4.4.7 - Edit PDV
window.editPDV = function(index) {
  if (IS_BOSS) return alert("Mode Boss = lecture seule");

  const pdv = window.pdvData[index];
  if(!pdv) return;

  const newCredit = prompt(`Modifier CR pour ${pdv.nom || 'PDV'}:`, pdv.credit || pdv.stock_deco || 0);
  if(newCredit === null) return;

  const newStock = prompt(`Modifier Stock pour ${pdv.nom || 'PDV'}:`, pdv.stock || pdv.stock_deco || 0);
  if(newStock === null) return;

  window.pdvData[index].credit = parseInt(newCredit) || 0;
  window.pdvData[index].stock = parseInt(newStock) || 0;

  backupLocal();
  updateCounters();
  savePDV();
  alert("PDV modifié + sauvé");
}

// V4.4.9 - Markers avec nom PDV + bouton Edit dans popup
window.createPDVMarker = function(pdv, index) {
  const nom = pdv.nom || 'PDV';
  const initiales = nom.substring(0, 2).toUpperCase();
  
  // Icon avec initiales au lieu du stock
  const icon = L.divIcon({
    html: `<div style="background:#c62828;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)">${initiales}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const marker = L.marker([pdv.lat, pdv.lng], { icon: icon }).addTo(map);
  
  // Popup avec bouton Modifier
  marker.bindPopup(`
    <div style="min-width:150px">
      <b>${pdv.nom || 'HOME'}</b><br>
      📞 ${pdv.tel || '-'}<br>
      📦 Stock: ${pdv.stock || pdv.stock_deco || 0}<br>
      💳 CR: ${pdv.credit || 0}<br>
      📍 ${pdv.ville || '-'}<br>
      👤 ${pdv.resp || '-'}<br>
      <div style="margin-top:8px;display:flex;gap:5px">
        <button onclick="editPDV(${index})" style="flex:1;padding:6px;background:#2196F3;color:white;border:none;border-radius:4px;font-size:12px">✏️ Modifier</button>
        <button onclick="deletePDV(${index})" style="padding:6px;background:#424242;color:white;border:none;border-radius:4px">🗑️</button>
      </div>
    </div>
  `);
  
  return marker;
}

// Remplace l'ancienne fonction de rendu des markers
const oldRefreshMap = window.refreshMap || function(){};
window.refreshMap = function() {
  if(!window.map) return;
  // Clear anciens markers
  if(window.pdvMarkers) window.pdvMarkers.forEach(m => map.removeLayer(m));
  window.pdvMarkers = [];
  
  // Crée nouveaux markers avec nom
  window.pdvData.forEach((pdv, i) => {
    if(pdv.lat && pdv.lng) {
      const marker = createPDVMarker(pdv, i);
      window.pdvMarkers.push(marker);
    }
  });
}

// V4.4.10 - Force load depuis JSONBin si vide
setTimeout(async () => {
  if(!window.pdvData || window.pdvData.length === 0) {
    const res = await fetch('https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19/latest');
    const data = await res.json();
    window.pdvData = Array.isArray(data.record) ? data.record : [];
    localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
    if(typeof refreshMap === 'function') refreshMap();
    if(typeof updateCounters === 'function') updateCounters();
  }
}, 1500);

// V4.4.11 - Debug + Save + Load
console.log('V4.4.11 loaded');

window.savePDV = async function() {
  localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
  try {
    await fetch('https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(window.pdvData)
    });
    console.log('Sync JSONBin OK:', window.pdvData);
  } catch(e) { console.log('Sync fail'); }
  if(typeof updateCounters === 'function') updateCounters();
  if(typeof refreshMap === 'function') refreshMap();
}

// Auto-load au start
setTimeout(async () => {
  const res = await fetch('https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19/latest');
  const data = await res.json();
  if(data.record && data.record.length > 0) {
    window.pdvData = data.record;
    localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
    refreshMap();
    updateCounters();
    console.log('Loaded from JSONBin:', window.pdvData.length, 'PDV');
  }
}, 1500);

// V4.4.13 - Anti-vidage + Marker HO + Save auto
console.log('V4.4.13 loaded');

async function loadPDV() {
  let dataFromCloud = null;
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19/latest');
    const json = await res.json();
    if(json.record && json.record.length > 0) dataFromCloud = json.record;
  } catch(e) {}
  
  if(dataFromCloud) {
    window.pdvData = dataFromCloud;
    localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
  } else {
    const backup = localStorage.getItem('pdv_backup');
    window.pdvData = backup ? JSON.parse(backup) : [];
  }
  refreshMap();
  updateCounters();
}

window.savePDV = async function() {
  localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
  try {
    await fetch('https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(window.pdvData)
    });
  } catch(e) {}
  refreshMap();
  updateCounters();
}

window.refreshMap = function() {
  if(!window.map) return;
  if(window.pdvMarkers) window.pdvMarkers.forEach(m => window.map.removeLayer(m));
  window.pdvMarkers = [];
  window.pdvData.forEach(pdv => {
    const initials = pdv.nom ? pdv.nom.substring(0,2).toUpperCase() : '??';
    const icon = L.divIcon({
      className: 'pdv-marker',
      html: `<div style="background:#dc2626;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white">${initials}</div>`,
      iconSize: [30, 30]
    });
    const marker = L.marker([pdv.lat, pdv.lng], {icon: icon}).addTo(window.map);
    marker.bindPopup(`<b>${pdv.nom}</b><br>Stock: ${pdv.stock}<br>Tel: ${pdv.tel}`);
    window.pdvMarkers.push(marker);
  });
}

setTimeout(loadPDV, 1000);
