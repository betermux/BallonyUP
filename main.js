const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const gravity = 0.3;
const friction = 0.99;
let score = 0;

// Images and Sounds
const bgImg = new Image();
bgImg.src = './assets/bg.png';

const fruitImg = new Image();
fruitImg.src = './assets/watermelon.png';

const fruitHalfLeft = new Image();
fruitHalfLeft.src = './assets/watermelon_left.png';

const fruitHalfRight = new Image();
fruitHalfRight.src = './assets/watermelon_right.png';

const sliceSound = new Audio('./assets/slice_sound.mp3');

// Arrays to hold fruits and fruit halves
const fruits = [];
const fruitHalves = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Fruit class
class Fruit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 32;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = -8 - Math.random() * 2;
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

    score += 10;  // Increment score
  }
}

// FruitHalf class (the sliced pieces)
class FruitHalf {
  constructor(x, y, angle, side) {
    this.x = x;
    this.y = y;
    const speed = 5 + Math.random() * 2;
    const direction = angle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
    this.vx = Math.cos(direction) * speed;
    this.vy = Math.sin(direction) * speed;
    this.side = side;
    this.image = side === 'left' ? fruitHalfLeft : fruitHalfRight;
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

// Function to spawn a new fruit
function spawnFruit() {
  const x = Math.random() * canvas.width;
  const fruit = new Fruit(x, canvas.height);  // Fruit spawns at the bottom of the screen
  fruits.push(fruit);
}

// Spawn fruit every 2 seconds
setInterval(spawnFruit, 2000);  // 2 seconds interval

// Mouse swipe slice logic
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

  fruits.forEach(fruit => {
    if (!fruit.sliced && fruit.isHit(currX, currY, lastX, lastY)) {
      const angle = Math.atan2(currY - lastY, currX - lastX);
      fruit.slice(angle);
    }
  });

  lastX = currX;
  lastY = currY;
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

// Function to draw the score
function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('Score: ' + score, 20, 40);
}

// Game loop to animate the fruits and fruit halves
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

  drawScore();
  requestAnimationFrame(gameLoop);
}

gameLoop();