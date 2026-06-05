const map = L.map('map').setView([6.5, 2.6], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let myLoc = null, markers = [], allPoints = [], routeControl = null, currentVisit = null, selectedDest = null;

window.toast = msg => {
  const t = document.getElementById('toast');
  t.innerText = msg; t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 4000);
}

window.getGPS = () => {
  navigator.geolocation.getCurrentPosition(p => {
    myLoc = [p.coords.latitude, p.coords.longitude];
    map.setView(myLoc, 13);
    L.circleMarker(myLoc, {color:'#FFF',radius:15}).addTo(map).bindPopup('YOU').openPopup();
    loadPoints();
  }, () => toast('GPS refusé'));
}

function calcDist(lat1, lon1, lat2, lon2) {
  return (map.distance([lat1,lon1], [lat2,lon2])/1000).toFixed(2);
}

async function loadPoints() {
  if (!myLoc) return;
  try {
    const res = await fetch('/api/points');
    allPoints = await res.json();
    markers.forEach(m => map.removeLayer(m)); markers = [];
    allPoints.forEach(p => {
      const isSelected = selectedDest && selectedDest.id == p.id;
      const color = p.visited? '#FFF' : '#888';
      const dist = calcDist(myLoc[0], myLoc[1], p.lat, p.lon);
      const html = `<b>${p.name}</b><br>Cat: ${p.category || '-'}<br>Dist: ${p.distributor || '-'}<br>Distance: ${dist} km<br>
        <button class="popup-btn" onclick="window.open('tel:${p.phone}')">CALL ${p.phone}</button>
        <button class="popup-btn route-btn" onclick="selectDest(${p.id})">🎯 DESTINATION</button>
        <button class="popup-btn visit-btn" onclick="startVisit(${p.id}, '${p.name}', ${dist})">✅ VISITE</button>`;
      const m = L.circleMarker([p.lat, p.lon], {
        color, radius:10, fillOpacity:0.8,
        className: isSelected? 'selected' : ''
      }).addTo(map).bindPopup(html);
      markers.push(m);
    });
    document.getElementById('count').innerText = `${allPoints.length} PDV`;
    document.getElementById('cr-btn').style.display = allPoints.length > 0? 'block' : 'none';
  } catch (e) {
    toast('Erreur chargement');
  }
}

window.selectDest = id => {
  selectedDest = allPoints.find(p => p.id == id);
  toast('Destination: ' + selectedDest.name);
  loadPoints();
  map.closePopup();
}

window.closePanel = () => document.getElementById('tournee-panel').style.display = 'none';
window.showForm = type => { document.getElementById('form-'+type).style.display = 'block'; }
window.hideForm = type => {
  document.getElementById('form-'+type).style.display = 'none';
  if(type=='add') ['name','category','phone','distributor'].forEach(id => document.getElementById(id).value = '');
  if(type=='visit') ['agent','notes','photo','sendmail'].forEach(id => {
    const el = document.getElementById(id);
    if(el.type=='checkbox') el.checked = true; else el.value = '';
  });
}

window.savePoint = async () => {
  const name = document.getElementById('name').value;
  const category = document.getElementById('category').value;
  const phone = document.getElementById('phone').value;
  const distributor = document.getElementById('distributor').value;
  if (!name ||!phone) return toast('Nom + Téléphone obligatoires');

  await fetch('/api/add', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name, category, phone, distributor, lat: myLoc[0], lon: myLoc[1] })
  });

  hideForm('add'); toast('PDV ajouté 👑'); loadPoints();
}

window.startVisit = (id, name, dist) => {
  currentVisit = {id, name, dist};
  document.getElementById('visit-name').innerText = name;
  document.getElementById('visit-dist').innerText = `Distance depuis GPS: ${dist} km`;
  showForm('visit');
}

window.sendVisit = async () => {
  const agent = document.getElementById('agent').value;
  if (!agent) return toast('Nom agent obligatoire');

  await fetch('/api/visit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: currentVisit.id })
  });

  hideForm('visit'); toast('Visite validée 👑'); loadPoints();
}

window.calcRoute = () => {
  if (!myLoc) return toast('Clique GPS d abord');
  if (routeControl) map.removeControl(routeControl);
  let waypoints = [L.latLng(myLoc[0], myLoc[1])];
  if (selectedDest) {
    waypoints.push(L.latLng(selectedDest.lat, selectedDest.lon));
  } else {
    const nonVisites = allPoints.filter(p =>!p.visited).map(p => ({
   ...p, dist: parseFloat(calcDist(myLoc[0], myLoc[1], p.lat, p.lon))
    })).sort((a,b) => a.dist - b.dist);
    if (nonVisites.length == 0) return toast('Tous les PDV sont visités');
    waypoints.push(L.latLng(nonVisites[0].lat, nonVisites[0].lon));
  }
  routeControl = L.Routing.control({
    waypoints, routeWhileDragging: false, show: true, collapsible: true,
    addWaypoints: false, lineOptions: {styles: [{color: '#FFF', weight: 6}]}
  }).addTo(map);
  showTourneePanel();
}

function showTourneePanel() {
  const visited = allPoints.filter(p => p.visited).length;
  const total = allPoints.length;
  let html = `<div style="padding:10px"><b>Avancement: ${visited}/${total} PDV visités</b></div>`;
  html += '<table><tr><th>Nom PDV</th><th>Num Distributeur</th><th>Distance</th><th>État</th></tr>';
  allPoints.forEach(p => {
    const d = calcDist(myLoc[0], myLoc[1], p.lat, p.lon);
    const etat = p.visited? '✅ Visité' : '⏳ À visiter';
    html += `<tr><td>${p.name}</td><td>${p.distributor || '-'}</td><td>${d} km</td><td>${etat}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('tournee-content').innerHTML = html;
  document.getElementById('tournee-panel').style.display = 'block';
}

window.showMailTournee = () => toast('Fonction mail désactivée');
window.sendTourneeMail = () => toast('Fonction mail désactivée');

window.onload = getGPS;
