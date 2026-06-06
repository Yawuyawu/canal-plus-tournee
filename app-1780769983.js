
// === PATCH SAVE CLOUD MASTET V4.4.22 - VERSION FORCE ===
const MASTER_KEY = '$2a$10$ucVCxh7kyGTmZP1H.G3HQ0HdQGUTyWD6o7Am0byx6FDKCb2cTLO0y';

window.savePDV = async function() {
  try {
    const res = await fetch(BIN, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Master-Key': MASTER_KEY 
      },
      body: JSON.stringify(window.pdvData)
    });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    console.log('SAVE MASTET OK:', window.pdvData.length, 'PDV');
  } catch(e) { 
    console.error('ERREUR SAVE:', e);
    alert('ERREUR SAVE MASTET: ' + e.message);
  }
}

// On force le save quand tu cliques sur ton bouton "Ajouter"
const oldAdd = window.addPDV;
window.addPDV = function(...args) {
  const result = oldAdd.apply(this, args);
  setTimeout(() => window.savePDV(), 500); // Save 0.5s après ajout
  return result;
}

// Charge au démarrage
loadPDV();
console.log('PATCH MASTET FORCE CHARGÉ - BIN:', BIN);
