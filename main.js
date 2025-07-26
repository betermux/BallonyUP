const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
const gravity = 0.4;
const friction = 0.98;

const fruits = [];
const fruitHalves = [];

const scoreDiv = document.getElementById('score');

const bgImg = new Image();
bgImg.src = './assets/bg.png';

const fruitImg = new Image();
fruitImg.src = './assets/watermelon.png';

const fruitHalfLeft = new Image();
fruitHalfLeft.src = './assets/watermelon_left.png';

const fruitHalfRight = new Image();
fruitHalfRight.src = './assets/watermelon_right.png';

const sliceSound = new Audio('./assets/slice_sound.mp3');

// ⏳ Wait until all images are loaded
let imagesLoaded = 0;
const totalImages = 4;

function checkAllLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) startGame();
}

bgImg.onload = checkAllLoaded;
fruitImg.onload = checkAllLoaded;
fruitHalfLeft.onload = checkAllLoaded;
fruitHalfRight.onload = checkAllLoaded;

class Fruit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 64;
    this.vx = (Math.random() - 0.5) * 5;
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
      ctx.drawImage(fruitImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
  }

  isHit(x1, y1, x2, y2) {
    const dx = this.x - x1;
    const dy = this.y - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + 20;
  }

  slice(angle) {
    this.sliced = true;
    sliceSound.currentTime = 0;
    sliceSound.play();

    fruitHalves.push(new FruitHalf(this.x, this.y, angle, 'left'));
    fruitHalves.push(new FruitHalf(this.x, this.y, angle, 'right'));

    score += 10;
    scoreDiv.textContent = 'Score: ' + score;
  }
}

class FruitHalf {
  constructor(x, y, angle, side) {
    this.x = x;
    this.y = y;
    const speed = 6 + Math.random() * 2;
    const direction = angle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
    this.vx = Math.cos(direction) * speed;
    this.vy = Math.sin(direction) * speed;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.image = side === 'left' ? fruitHalfLeft : fruitHalfRight;
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
    ctx.drawImage(this.image, -64, -64, 128, 128);
    ctx.restore();
  }
}

function spawnFruit() {
  const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
  const fruit = new Fruit(x, canvas.height + 100);
  fruits.push(fruit);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  fruits.forEach(fruit => {
    fruit.update();
    fruit.draw();
  });

  fruitHalves.forEach(half => {
    half.update();
    half.draw();
  });

  requestAnimationFrame(gameLoop);
}

// 🐭 Touch events for slicing
let isDragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDragging = true;
  const touch = e.touches[0];
  lastX = touch.clientX;
  lastY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isDragging) return;
  const touch = e.touches[0];
  const currX = touch.clientX;
  const currY = touch.clientY;

  fruits.forEach(fruit => {
    if (!fruit.sliced && fruit.isHit(currX, currY, lastX, lastY)) {
      const angle = Math.atan2(currY - lastY, currX - lastX);
      fruit.slice(angle);
    }
  });

  lastX = currX;
  lastY = currY;
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isDragging = false;
});

function startGame() {
  setInterval(spawnFruit, 1500);
  gameLoop();
}