// V4.4.21 - WAIT MAP + FORCE RELOAD
console.log('V4.4.21 LOADED');

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';
window.pdvData = [];

// Kill cluster si il existe
if(window.L && window.L.markerClusterGroup) {
  window.L.markerClusterGroup = function(){ return L.layerGroup(); };
}

function waitForMap(callback) {
  if(window.map && window.map._loaded) {
    callback();
  } else {
    setTimeout(() => waitForMap(callback), 100);
  }
}

async function loadPDV() {
  console.log('LOAD PDV START');
  try {
    const res = await fetch(BIN + '/latest?t=' + Date.now(), {cache: 'no-store'});
    console.log('FETCH STATUS:', res.status);
    const json = await res.json();
    window.pdvData = json.record || [];
    console.log('CLOUD DATA RECU:', window.pdvData);
  } catch(e) { 
    console.log('FETCH ERROR:', e);
    window.pdvData = [];
  }
  
  // Attend que la map soit prête avant d'afficher
  waitForMap(() => {
    console.log('MAP READY, AFFICHAGE:', window.pdvData.length, 'PDV');
    refreshMap();
    updateCounters();
  });
}

window.refreshMap = function() {
  if(!window.map) return console.log('NO MAP');
  
  // Supprime tous les markers existants
  window.map.eachLayer(l => {
    if(l instanceof L.Marker) window.map.removeLayer(l);
  });
  
  console.log('CREATION MARKERS POUR:', window.pdvData);
  
  window.pdvData.forEach(pdv => {
    const initials = pdv.nom ? pdv.nom.replace(/[^A-Za-z]/g, '').substring(0,2).toUpperCase() : 'XX';
    console.log('ADD MARKER:', initials, pdv.lat, pdv.lng);
    
    const icon = L.divIcon({
      html: `<div style="background:#dc2626;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid white;font-size:14px">${initials}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    
    L.marker([pdv.lat, pdv.lng], {icon: icon}).addTo(window.map);
  });
}

window.updateCounters = function() {
  const count = window.pdvData.length;
  document.querySelectorAll('[data-count="pdv"]').forEach(e => e.textContent = count);
  console.log('COUNTER UPDATE:', count);
}

setTimeout(loadPDV, 200);
