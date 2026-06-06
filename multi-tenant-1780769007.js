// V4.4.16 NUCLEAR
console.log('V4.4.16 NUCLEAR', Date.now());

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';
window.pdvData = [];

// Tue TOUT : SW + Cache + Storage
if('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
}
if(window.caches) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
}
localStorage.clear();
sessionStorage.clear();

async function loadPDV() {
  const res = await fetch(BIN + '/latest?t=' + Date.now(), {cache: 'no-store'});
  const json = await res.json();
  window.pdvData = json.record || [];
  console.log('NUCLEAR LOAD:', window.pdvData);
  refreshMap();
  updateCounters();
}

window.savePDV = async function() {
  await fetch(BIN + '?t=' + Date.now(), {
    method: 'PUT',
    headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-cache'},
    body: JSON.stringify(window.pdvData)
  });
  alert('NUCLEAR SAVE: ' + window.pdvData.length + ' PDV');
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
    L.marker([pdv.lat, pdv.lng], {icon: icon}).addTo(window.map);
  });
}

window.updateCounters = function() {
  const totalPDV = window.pdvData.length;
  const totalStock = window.pdvData.reduce((s,p) => s + (parseInt(p.stock)||0), 0);
  document.querySelectorAll('[data-count="pdv"]').forEach(e => e.textContent = totalPDV);
  document.querySelectorAll('[data-count="stock"]').forEach(e => e.textContent = totalStock);
}

setTimeout(loadPDV, 100);
