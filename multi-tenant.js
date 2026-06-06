// V4.4.20 - BLOQUE CHIFFRES + INITIALES ONLY
console.log('V4.4.20 NO NUMBERS');

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';
window.pdvData = [];

// Anti-cluster : si un plugin existe on le tue
window.L = window.L || {};
if(window.L.markerClusterGroup) window.L.markerClusterGroup = function(){ return L.layerGroup(); };

async function loadPDV() {
  const res = await fetch(BIN + '/latest?t=' + Date.now(), {cache: 'no-store'});
  const json = await res.json();
  window.pdvData = json.record || [];
  console.log('DATA:', window.pdvData);
  refreshMap();
  updateCounters();
}

window.refreshMap = function() {
  if(!window.map) return;
  
  // Nuke TOUT : markers + clusters + layers
  window.map.eachLayer(l => {
    if(l._leaflet_id !== window.map._leaflet_id) window.map.removeLayer(l);
  });
  
  window.pdvData.forEach(pdv => {
    if(!pdv.lat || !pdv.lng) return;
    
    // INITIALES SEULEMENT, JAMAIS DE CHIFFRE
    const initials = pdv.nom ? pdv.nom.replace(/[^A-Za-z]/g, '').substring(0,2).toUpperCase() : 'XX';
    
    const icon = L.divIcon({
      className: 'pdv-no-number',
      html: `<div style="background:#dc2626;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid white;font-size:13px;box-shadow:0 2px 5px rgba(0,0,0,0.3)">${initials}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    
    L.marker([pdv.lat, pdv.lng], {icon: icon, title: pdv.nom}).addTo(window.map);
  });
}

window.updateCounters = function() {
  document.querySelectorAll('[data-count="pdv"]').forEach(e => e.textContent = window.pdvData.length);
  document.querySelectorAll('[data-count="stock"]').forEach(e => e.textContent = window.pdvData.reduce((s,p) => s + (parseInt(p.stock)||0), 0));
}

setTimeout(loadPDV, 100);
