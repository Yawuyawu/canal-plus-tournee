// V4.4.18 - No auto wipe + Safe load
console.log('V4.4.18 SAFE');

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';
window.pdvData = [];
let firstLoad = true;

if('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()));
}

async function loadPDV() {
  try {
    const res = await fetch(BIN + '/latest?t=' + Date.now(), {cache: 'no-store'});
    const json = await res.json();
    window.pdvData = json.record || [];
    console.log('CLOUD DATA:', window.pdvData);
  } catch(e) { 
    console.log('CLOUD FAIL:', e);
    window.pdvData = [];
  }
  firstLoad = false;
  refreshMap();
  updateCounters();
}

window.savePDV = async function() {
  if(firstLoad && window.pdvData.length === 0) {
    console.log('BLOCK: refuse save array vide au load');
    return;
  }
  const res = await fetch(BIN, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(window.pdvData)
  });
  alert('SAVE OK: ' + window.pdvData.length + ' PDV');
  refreshMap();
  updateCounters();
}

window.refreshMap = function() {
  if(!window.map) return;
  window.map.eachLayer(layer => {
    if(layer instanceof L.Marker || layer instanceof L.MarkerClusterGroup) {
      window.map.removeLayer(layer);
    }
  });
  window.pdvData.forEach(pdv => {
    if(!pdv.lat || !pdv.lng) return;
    const initials = pdv.nom ? pdv.nom.substring(0,2).toUpperCase() : '??';
    const icon = L.divIcon({
      className: 'pdv-initiales',
      html: `<div style="background:#dc2626;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;font-size:12px">${initials}</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    });
    L.marker([pdv.lat, pdv.lng], {icon: icon})
      .addTo(window.map)
      .bindPopup(`<b>${pdv.nom}</b><br>Stock: ${pdv.stock || 0}`);
  });
}

window.updateCounters = function() {
  const totalPDV = window.pdvData.length;
  const totalStock = window.pdvData.reduce((s,p) => s + (parseInt(p.stock)||0), 0);
  document.querySelectorAll('[data-count="pdv"]').forEach(e => e.textContent = totalPDV);
  document.querySelectorAll('[data-count="stock"]').forEach(e => e.textContent = totalStock);
}

setTimeout(loadPDV, 100);
