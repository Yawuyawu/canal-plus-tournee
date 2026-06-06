// V4.4.22 - GEOLOC + CLOUD LOAD
console.log('V4.4.22 LIVE');

const BIN = 'https://api.jsonbin.io/v3/b/6a245702f5f4af5e29c32b19';
window.pdvData = [];

if(window.L && window.L.markerClusterGroup) {
  window.L.markerClusterGroup = function(){ return L.layerGroup(); };
}

navigator.geolocation.getCurrentPosition(pos => {
  window.userPos = [pos.coords.latitude, pos.coords.longitude];
  if(window.map) {
    window.map.setView(window.userPos, 13);
    L.marker(window.userPos, {
      icon: L.divIcon({
        html: `<div style="background:#2563eb;color:white;border-radius:50%;width:20px;height:20px;border:3px solid white"></div>`
      })
    }).addTo(window.map).bindPopup('TOI');
  }
});

async function loadPDV() {
  const res = await fetch(BIN + '/latest?t=' + Date.now(), {cache: 'no-store'});
  const json = await res.json();
  window.pdvData = json.record || [];
  console.log('CLOUD:', window.pdvData);
  refreshMap();
  updateCounters();
}

window.refreshMap = function() {
  if(!window.map) return;
  window.map.eachLayer(l => {
    if(l instanceof L.Marker && !l.getPopup()?.getContent()?.includes('TOI')) {
      window.map.removeLayer(l);
    }
  });
  window.pdvData.forEach(pdv => {
    const initials = pdv.nom ? pdv.nom.substring(0,2).toUpperCase() : 'XX';
    const icon = L.divIcon({
      html: `<div style="background:#dc2626;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:3px solid white;font-size:14px">${initials}</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18]
    });
    L.marker([pdv.lat, pdv.lng], {icon: icon}).addTo(window.map);
  });
}

window.updateCounters = function() {
  document.querySelectorAll('[data-count="pdv"]').forEach(e => e.textContent = window.pdvData.length);
  document.querySelectorAll('[data-count="stock"]').forEach(e => e.textContent = window.pdvData.reduce((s,p) => s + (parseInt(p.stock)||0), 0));
}

setTimeout(loadPDV, 300);
