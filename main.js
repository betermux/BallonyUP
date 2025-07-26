const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.3;
const friction = 0.98;
let score = 0;

// Images
const fruitImg = new Image();
fruitImg.src = './assets/watermelon.png';

const fruitLeftImg = new Image();
fruitLeftImg.src = './assets/watermelon_left.png';

const fruitRightImg = new Image();
fruitRightImg.src = './assets/watermelon_right.png';

const sliceSound = new Audio('./assets/slice_sound.mp3');

const fruits = [];
const halves = [];

// Fruit class
class Fruit {
  constructor(x) {
    this.x = x;
    this.y = canvas.height;
    this.radius = 32;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -10 - Math.random() * 4;
    this.sliced = false;
  }

  update() {
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    if (!this.sliced) {
      ctx.drawImage(fruitImg, this.x - this.radius, this.y - this.radius, 64, 64);
    }
  }

  isHit(x1, y1, x2, y2) {
    const dx = this.x - x1;
    const dy = this.y - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + 20;
  }

  slice(angle) {
    this.sliced = true;
    sliceSound.currentTime = 0;
    sliceSound.play();

    halves.push(new FruitHalf(this.x, this.y, angle, 'left'));
    halves.push(new FruitHalf(this.x, this.y, angle, 'right'));
    score += 10;
  }
}

class FruitHalf {
  constructor(x, y, angle, side) {
    this.x = x;
    this.y = y;
    this.side = side;
    const speed = 6 + Math.random() * 2;
    const direction = angle + (side === 'left' ? -0.5 : 0.5);
    this.vx = Math.cos(direction) * speed;
    this.vy = Math.sin(direction) * speed;
    this.image = side === 'left' ? fruitLeftImg : fruitRightImg;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.vy += gravity;
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.image, -32, -32, 64, 64);
    ctx.restore();
  }
}

// Spawn fruit
function spawnFruit() {
  const x = 100 + Math.random() * (canvas.width - 200);
  fruits.push(new Fruit(x));
}
setInterval(spawnFruit, 1500);

// Slice logic
let isDragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const currX = e.offsetX;
  const currY = e.offsetY;

  for (const fruit of fruits) {
    if (!fruit.sliced && fruit.isHit(currX, currY, lastX, lastY)) {
      const angle = Math.atan2(currY - lastY, currX - lastX);
      fruit.slice(angle);
    }
  }

  lastX = currX;
  lastY = currY;
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

// Draw score
function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('Score: ' + score, 20, 40);
}

// Main game loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  fruits.forEach(f => {
    f.update();
    f.draw();
  });

  halves.forEach(h => {
    h.update();
    h.draw();
  });

  drawScore();
  requestAnimationFrame(loop);
}
loop();