let melot = 0;
const melotDisplay = document.getElementById('melot-amount');
const watermelon = document.getElementById('watermelon');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradePopup = document.getElementById('upgrade-popup');

const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// --- Watermelon click
watermelon.addEventListener('click', () => {
  melot++;
  melotDisplay.textContent = melot;
});

// --- Watermelon hold animation
let holdTimeout;
watermelon.addEventListener('mousedown', () => {
  watermelon.classList.add('hold');
});
window.addEventListener('mouseup', () => {
  watermelon.classList.remove('hold');
});

// --- Upgrade popup
upgradeBtn.addEventListener('click', () => {
  upgradePopup.style.display = 'block';
  setTimeout(() => {
    upgradePopup.style.display = 'none';
  }, 1500);
});

// --- Settings menu toggle
settingsToggle.addEventListener('click', () => {
  settingsMenu.style.display =
    settingsMenu.style.display === 'block' ? 'none' : 'block';
});

// --- Dark Mode toggle
darkModeToggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
});