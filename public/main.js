// public/main.js - VERSION RENDER FINALE

const API_URL = '/api/points';
let points = 0;

async function loadPoints() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    points = data.points;
    
    // Met à jour le texte "0 PDV" en haut à droite
    const pdvDiv = document.querySelector('[class*="PDV"]') || document.body;
    pdvDiv.innerHTML = pdvDiv.innerHTML.replace('0 PDV', `${points} PDV`);
    
    console.log('Points:', points);
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur réseau : Backend coupé ?');
  }
}

async function savePoints(newPoints) {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: newPoints })
    });
  } catch (error) {
    console.error('Erreur save:', error);
  }
}

// Lance au démarrage
document.addEventListener('DOMContentLoaded', loadPoints);
