// V4.4.22 - GEOLOC + AUTO CENTER
console.log('V4.4.22 GEOLOC ON');

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';
window.pdvData = [];
window.userPos = null;

if(window.L && window.L.markerClusterGroup) {
  window.L.markerClusterGroup = function(){ return L.layerGroup(); };
}

// 1. DEMANDE TA POSITION DIRECT
function getUserLocation() {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        window.userPos = [pos.coords.latitude, pos.coords.longitude];
        console.log('MA POSITION:', window.userPos);
        if(window.map) {
          window.map.setView(window.userPos, 13);
          // Marker bleu pour toi
          L.marker(window.userPos, {
            icon: L.divIcon({
              html: `<div style="background:#2563eb;color:white;border-radius:50%;width:20px;height:20px;border:3px solid white;box-shadow:0 0 10px rgba(37,99,235,0.5)"></div>`,
              iconSize: [20, 20]
            })
          }).addTo(window.map).bindPopup('<b>Vous êtes ici</b>');
        }
      },
      err => console.log('GEOLOC REFUSEE:', err),
      {enableHighAccuracy: true, timeout: 5000}
    );
  } else {
    console.log('GEOLOC PAS SUPPORTEE');
  }
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
    const json = await res.json();
    window.pdvData = json.record || [];
    console.log('CLOUD DATA RECU:', window.pdvData);
  } catch(e) { 
    console.log('FETCH ERROR:', e);
    window.pdvData = [];
  }
  
  waitForMap(() => {
    console.log('MAP READY, AFFICHAGE:', window.pdvData.length, 'PDV');
    getUserLocation(); // Demande position après map ready
    refreshMap();
    updateCounters();
  });
}

window.refreshMap = function() {
  if(!window.map) return console.log('NO MAP');
  
  // Garde ton marker bleu, supprime que les PDV
  window.map.eachLayer(l => {
    if(l instanceof L.Marker && l.options.title !== 'Vous êtes ici') {
      window.map.removeLayer(l);
    }
  });
  
  console.log('CREATION MARKERS POUR:', window.pdvData);
  
  window.pdvData.forEach(pdv => {
    if(!pdv.lat || !pdv.lng) return;
    const initials = pdv.nom ? pdv.nom.replace(/[^A-Za-z]/g, '').substring(0,2).toUpperCase() : 'XX';
    console.log('ADD MARKER:', initials, pdv.lat, pdv.lng);
    
    const icon = L.divIcon({
      html: `<div style="background:#dc2626;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid white;font-size:14px">${initials}</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18]
    });
    
    L.marker([pdv.lat, pdv.lng], {icon: icon, title: pdv.nom}).addTo(window.map);
  });
  
  // Si t'as des PDV mais pas de géoloc, centre sur le premier PDV
  if(!window.userPos && window.pdvData.length > 0) {
    window.map.setView([window.pdvData[0].lat, window.pdvData[0].lng], 13);
  }
}

window.updateCounters = function() {
  const count = window.pdvData.length;
  document.querySelectorAll('[data-count="pdv"]').forEach(e => e.textContent = count);
  document.querySelectorAll('[data-count="stock"]').forEach(e => e.textContent = window.pdvData.reduce((s,p) => s + (parseInt(p.stock)||0), 0));
  console.log('COUNTER UPDATE:', count);
}

setTimeout(loadPDV, 200);
