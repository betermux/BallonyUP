const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const watermelon = new Image();
watermelon.src = './assets/watermelon.png';

let rotation = 0;
let isHolding = false;
let melot = 0;

const melotCount = document.getElementById('melot-count');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeFrame = document.getElementById('upgrade-frame');

// Watermelon position & size
const wm = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 120, // том биш, тохиромжтой хэмжээнд
};

// Handle resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  wm.x = canvas.width / 2;
  wm.y = canvas.height / 2;
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background animation
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffecd2');
  gradient.addColorStop(1, '#fcb69f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Watermelon rotation
  ctx.save();
  ctx.translate(wm.x, wm.y);
  ctx.rotate(rotation);
  ctx.drawImage(watermelon, -wm.size / 2, -wm.size / 2, wm.size, wm.size);
  ctx.restore();

  requestAnimationFrame(draw);
}
draw();

// Click to gain MELOT
canvas.addEventListener('click', (e) => {
  const dx = e.clientX - wm.x;
  const dy = e.clientY - wm.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < wm.size / 2) {
    melot += 1;
    melotCount.textContent = melot;
  }
});

// Hold for extra animation
canvas.addEventListener('mousedown', () => { isHolding = true });
canvas.addEventListener('mouseup', () => { isHolding = false });

function animateRotation() {
  if (isHolding) {
    rotation += 0.01;
  } else {
    rotation += 0.003;
  }
  requestAnimationFrame(animateRotation);
}
animateRotation();

// Upgrade popup toggle
upgradeBtn.addEventListener('click', () => {
  upgradeFrame.style.display = upgradeFrame.style.display === 'none' ? 'block' : 'none';
});