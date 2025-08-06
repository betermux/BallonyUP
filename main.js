const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let balloonImg = new Image();
balloonImg.src = "assets/balloon.png";

let cloudImg = new Image();
cloudImg.src = "assets/cloud.png";

let score = 0;
let balloon = { x: canvas.width / 2 - 25, y: canvas.height - 150, width: 50, height: 70 };
let clouds = [];
let gameOver = false;

// Swipe control
let startX = 0;
canvas.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
  let diff = e.touches[0].clientX - startX;
  balloon.x += diff;
  startX = e.touches[0].clientX;
});

// Саад үүл үүсгэх
function spawnCloud() {
  clouds.push({
    x: Math.random() * (canvas.width - 80),
    y: -80,
    width: 80,
    height: 50,
    speed: 2 + Math.random() * 2
  });
}

// Мөргөлдөөн шалгах
function isColliding(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Үндсэн loop
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Clouds
  for (let i = 0; i < clouds.length; i++) {
    let c = clouds[i];
    c.y += c.speed;
    ctx.drawImage(cloudImg, c.x, c.y, c.width, c.height);

    if (isColliding(balloon, c)) {
      gameOver = true;
      alert("🎈 Game Over! Score: " + score + " m");
      return;
    }
  }

  // Balloon
  ctx.drawImage(balloonImg, balloon.x, balloon.y, balloon.width, balloon.height);

  // Score
  score++;
  document.getElementById("score").textContent = `${score} m`;

  requestAnimationFrame(gameLoop);
}

// Саад spawn-дах
setInterval(spawnCloud, 1000);

// Start
balloonImg.onload = () => {
  gameLoop();
};