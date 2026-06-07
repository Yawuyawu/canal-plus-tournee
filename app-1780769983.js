// ===== API VERCEL TERMINUS =====
const API = '/api/save';

window.pdvData = [];

// SAVE vers Vercel
window.savePDV = async () => {
  try {
    await fetch(API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(window.pdvData)
    });
    console.log('SAVE OK:', window.pdvData.length, 'PDV');
  } catch(e) {
    console.log('SAVE ERROR:', e);
  }
}

// LOAD depuis Vercel
window.loadPDV = async () => {
  try {
    const r = await fetch(API);
    window.pdvData = await r.json();
    console.log('LOAD OK:', window.pdvData.length, 'PDV');
    updateCounters();
  } catch(e) {
    console.log('LOAD ERROR:', e);
    window.pdvData = [];
  }
}

// COMPTEURS FIX BUG 6 MILLIONS
window.updateCounters = function() {
  if(!window.pdvData) window.pdvData = [];
  
  const totalPDV = window.pdvData.length;
  const totalStock = window.pdvData.reduce((s,p) => s + Number(p.stock || 0), 0);
  const totalCR = window.pdvData.filter(p => p.cr === true).length;
  
  const pdvEl = document.querySelector('[id*="PDV"]');
  const stockEl = document.querySelector('[id*="Stock"]');
  const crEl = document.querySelector('[id*="CR"]');
  
  if(pdvEl) pdvEl.textContent = totalPDV + ' PDV';
  if(stockEl) stockEl.textContent = totalStock + ' Stock';
  if(crEl) crEl.textContent = totalCR + ' CR';
}

// FONCTION POUR AJOUTER UN PDV
window.ajouterPDV = function(nom, stock, cr) {
  const nouveauPDV = {
    id: Date.now(),
    nom: nom,
    stock: Number(stock) || 0,
    cr: Boolean(cr),
    date: new Date().toISOString()
  };
  
  window.pdvData.push(nouveauPDV);
  updateCounters();
  setTimeout(() => savePDV(), 300);
}

// CHARGEMENT AU DÉMARRAGE
document.addEventListener('DOMContentLoaded', () => {
  loadPDV();
});
