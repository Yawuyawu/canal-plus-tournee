import L from 'leaflet';

const map = L.map('map').setView([6.5, 2.6], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let myLoc = null;
let markers = [];

window.toast = function(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2000);
}

window.getGPS = function() {
  navigator.geolocation.getCurrentPosition(p => {
    myLoc = [p.coords.latitude, p.coords.longitude];
    map.setView(myLoc, 13);
    L.circleMarker(myLoc, {color:'#FF00FF',radius:15}).addTo(map).bindPopup('YOU').openPopup();
    loadPoints();
  }, () => toast('GPS refusé'));
}

async function loadPoints() {
  if (!myLoc) return toast('Clique GPS d abord');
  try {
    const res = await fetch(`/api/points?lat=${myLoc[0]}&lon=${myLoc[1]}`);
    const data = await res.json();
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    data.forEach(p => {
      const m = L.marker([p.lat, p.lon]).addTo(map).bindPopup(`<b>${p.name}</b><br><button onclick="window.open('tel:${p.phone}')" style="background:#00BFFF;border:none;color:#fff;padding:8px 12px;border-radius:8px;margin-top:5px">CALL ${p.phone}</button>`);
      markers.push(m);
    });
    document.getElementById('count').innerText = `${data.length} points`;
  } catch(e) { toast('Lance le backend: node server.cjs'); }
}

window.addPoint = async function() {
  if (!myLoc) return toast('Clique GPS d abord');
  const name = prompt('Nom du lieu?');
  const phone = prompt('Numéro?');
  if (!name ||!phone) return;
  try {
    await fetch('/api/add', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name, phone, lat: myLoc[0], lon: myLoc[1]})
    });
    toast('Ajouté 👑');
    loadPoints();
  } catch(e) { toast('Lance le backend: node server.cjs'); }
}

window.onload = getGPS;
