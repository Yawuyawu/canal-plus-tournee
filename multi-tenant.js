// V4.4.16 - Save direct + kill cache
console.log('V4.4.16 LOADED');

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';

window.pdvData = [];

async function loadPDV() {
  try {
    const res = await fetch(BIN + '/latest');
    const json = await res.json();
    window.pdvData = json.record || [];
    console.log('LOAD OK:', window.pdvData);
  } catch(e) { 
    console.log('LOAD FAIL, use localStorage');
    window.pdvData = JSON.parse(localStorage.getItem('pdv_backup') || '[]');
  }
  refreshMap();
  updateCounters();
}

window.savePDV = async function() {
  console.log('SAVING:', window.pdvData);
  localStorage.setItem('pdv_backup', JSON.stringify(window.pdvData));
  
  const res = await fetch(BIN, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(window.pdvData)
  });
  const data = await res.json();
  console.log('JSONBIN SAVE:', data);
  alert('SAVE OK: ' + window.pdvData.length + ' PDV');
  
  refreshMap();
  updateCounters();
}

// Kill service worker
if('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
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
    L.marker([pdv.lat, pdv.lng], {icon: icon}).addTo(window.map);
  });
}

setTimeout(loadPDV, 500);
