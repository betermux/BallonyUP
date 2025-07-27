const watermelon = document.getElementById('watermelon');
const melotCountEl = document.getElementById('melot-count');
let melot = 0;
let holdInterval = null;

const popSound = new Audio('assets/pop_sound.mp3');

function updateMelotDisplay() {
  melotCountEl.textContent = melot;
}

// Click/hold to mine melot
watermelon.addEventListener('mousedown', () => {
  popSound.currentTime = 0;
  popSound.play();
  melot++;
  updateMelotDisplay();

  holdInterval = setInterval(() => {
    melot++;
    updateMelotDisplay();
  }, 200);
});

document.addEventListener('mouseup', () => {
  clearInterval(holdInterval);
});

// Navigation with background animation
function navigateTo(page) {
  const bg = document.getElementById('bg-animation');
  bg.className = '';
  bg.classList.add('bg-' + page);

  try {
    popSound.currentTime = 0;
    popSound.play();
  } catch (e) {}

  console.log('Page:', page);
}

window.navigateTo = navigateTo;