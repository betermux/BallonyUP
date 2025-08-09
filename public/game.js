const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id.toString() : 'guest';

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  console.error('Canvas element not found!');
  alert('Error: Game canvas is missing. Check index.html.');
}
const ctx = canvas ? canvas.getContext('2d') : null;
if (!ctx) {
  console.error('Canvas context not available!');
  alert('Error: Unable to get canvas context.');
}
const bottomMenu = document.getElementById('bottom-menu');
const backButton = document.getElementById('back-button');
const shopButton = document.getElementById('shop-button');
const settingsButton = document.getElementById('settings-button');

const bgImg = new Image();
bgImg.src = 'assets/bg.png';
const balloonImg = new Image();
balloonImg.src = 'assets/balloon.gif';
const obstacleImg = new Image();
obstacleImg.src = 'assets/obstacle.png';
const coinImg = new Image();
coinImg.src = 'assets/coin.png';
const cloudImg = new Image();
cloudImg.src = 'assets/cloud.png';
const cloud1Img = new Image();
cloud1Img.src = 'assets/cloud1.png';
const cloud2Img = new Image();
cloud2Img.src = 'assets/cloud2.png';
const shopImg = new Image();
shopImg.src = 'assets/shop.png';
const settingsImg = new Image();
settingsImg.src = 'assets/settings.png';
const bgMenuImg = new Image();
bgMenuImg.src = 'assets/bgmenu.png';

function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let balloon = { x: canvas ? canvas.width / 2 - 64 : 0, y: canvas ? canvas.height / 2 : 0, width: 128, height: 128 };
let obstacles = [];
let speed = 2;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem(`highScore_${userId}`) ? parseInt(localStorage.getItem(`highScore_${userId}`)) : 0;
let lastTime = 0;
let spawnInterval;
let isPlaying = false;
let playCount = localStorage.getItem(`playCount_${userId}`) ? parseInt(localStorage.getItem(`playCount_${userId}`)) : 0;
let vibrationEnabled = localStorage.getItem(`vibrationEnabled_${userId}`) !== 'false';

let balloonY = canvas ? canvas.height / 2 : 0;
const balloonAmplitude = 10;
const balloonFrequency = 0.002;
let bgX = 0;
const bgSpeed = 25;

let clouds = [];
for (let i = 0; i < 9; i++) {
  clouds.push({
    img: i % 3 === 0 ? cloudImg : (i % 3 === 1 ? cloud1Img : cloud2Img),
    x: Math.random() * (canvas ? canvas.width : 1000),
    y: Math.random() * (canvas ? canvas.height / 2 : 500),
    size: 75 + Math.random() * 150,
    speed: 10 + Math.random() * 20,
    zIndex: Math.random() < 0.5 ? 'front' : 'back'
  });
}

let tasks = [
  { id: 'score_1000', description: 'Score 1000 points', reward: 'Unlock Red Skin', completed: false },
  { id: 'play_3_times', description: 'Play 3 times', reward: 'Unlock Blue Skin', progress: playCount, target: 3, completed: false },
  { id: 'no_music_challenge', description: 'Complete game without music', reward: 'Unlock Silent Skin', completed: false }
];

const menuBalloonSize = 384;
let balloonPixelData, obstaclePixelData;
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

function getPixelData(img, width, height) {
  if (!offscreenCtx || !img) return new Uint8ClampedArray(0);
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  offscreenCtx.clearRect(0, 0, width, height);
  offscreenCtx.drawImage(img, 0, 0, width, height);
  return offscreenCtx.getImageData(0, 0, width, height).data;
}

function checkPixelCollision(x1, y1, w1, h1, pixelData1, x2, y2, w2, h2, pixelData2) {
  if (!pixelData1 || !pixelData2 || x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1) return false;
  const xMin = Math.max(x1, x2);
  const xMax = Math.min(x1 + w1, x2 + w2);
  const yMin = Math.max(y1, y2);
  const yMax = Math.min(y1 + h1, y2 + h2);
  for (let y = yMin; y < yMax; y += 4) {
    for (let x = xMin; x < xMax; x += 4) {
      const px1 = Math.floor(x - x1);
      const py1 = Math.floor(y - y1);
      const px2 = Math.floor(x - x2);
      const py2 = Math.floor(y - y2);
      const index1 = (py1 * w1 + px1) * 4 + 3;
      const index2 = (py2 * w2 + px2) * 4 + 3;
      if (index1 < pixelData1.length && index2 < pixelData2.length && pixelData1[index1] > 0 && pixelData2[index2] > 0) {
        return true;
      }
    }
  }
  return false;
}

function drawBackground(time, deltaTime) {
  if (!isPlaying && canvas && ctx) {
    bgX -= bgSpeed * deltaTime;
    if (bgX <= -canvas.width) bgX += canvas.width;
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
  }
}

function drawClouds(deltaTime) {
  if (!isPlaying && canvas && ctx) {
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed * deltaTime;
      if (cloud.x <= -cloud.size) {
        cloud.x = canvas.width;
        cloud.y = Math.random() * canvas.height / 2;
      }
      if (cloud.zIndex === 'back') ctx.drawImage(cloud.img, cloud.x, cloud.y, cloud.size, cloud.size);
    });
  }
}

function drawBalloon(time) {
  if (!isPlaying && canvas && ctx) {
    balloonY = canvas.height / 2 + Math.sin(time * balloonFrequency) * balloonAmplitude;
    ctx.drawImage(balloonImg, canvas.width / 2 - menuBalloonSize / 2, balloonY - menuBalloonSize / 2, menuBalloonSize, menuBalloonSize);
  } else if (isPlaying && canvas && ctx) {
    ctx.drawImage(balloonImg, balloon.x, balloon.y, balloon.width, balloon.height);
  }
}

function drawCloudsFront(deltaTime) {
  if (!isPlaying && canvas && ctx) {
    clouds.forEach(cloud => {
      if (cloud.zIndex === 'front') ctx.drawImage(cloud.img, cloud.x, cloud.y, cloud.size, cloud.size);
    });
  }
}

function drawObstacles(deltaTime) {
  if (!isPlaying || !canvas || !ctx) return;
  for (let obs of obstacles) {
    obs.y += speed * deltaTime * 60;
    ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
    if (
      checkPixelCollision(
        balloon.x, balloon.y, balloon.width, balloon.height, balloonPixelData,
        obs.x, obs.y, obs.width, obs.height, obstaclePixelData
      )
    ) {
      gameOver = true;
      backButton.style.display = 'block';
      bottomMenu.style.display = 'none';
      shopButton.style.display = 'none';
      settingsButton.style.display = 'none';
      document.getElementById('shop-button-glow').style.display = 'none';
      isPlaying = false;
      updateTasks();
      saveGameState();
      window.saveScore(highScore); // Firebase-д оноо хадгалах
      if (score >= 1000) window.addTokens(10); // Жишээ: 1000 оноонд 10 токен
      checkNoMusicChallenge();
    }
  }
  obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function drawScore() {
  if (canvas && ctx) {
    document.getElementById('score-display-top').textContent = Math.floor(highScore);
    if (isPlaying) {
      ctx.fillStyle = 'black';
      ctx.font = '16px "Press Start 2P"';
      ctx.drawImage(coinImg, 10, 10, 24, 24);
      ctx.fillText(`${Math.floor(score)} | High Score: ${Math.floor(highScore)}`, 40, 30);
      score += 1 / 60;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem(`highScore_${userId}`, highScore);
        document.getElementById('score-display-top').textContent = Math.floor(highScore);
        window.saveScore(highScore); // Firebase-д оноо хадгалах
      }
    }
    updateWallet();
  }
}

function updateWallet() {
  document.getElementById('score-display').textContent = Math.floor(score);
  document.getElementById('high-score-display').textContent = Math.floor(highScore);
  window.getUserData(); // Firebase-ээс токеныг шинэчлэх
}

function updateTasks() {
  if (tasks) {
    tasks.forEach(task => {
      if (task.id === 'score_1000' && score >= 1000 && !task.completed) {
        task.completed = true;
        window.addTokens(10); // Токен нэмэх
        tg.showAlert(`Task completed: ${task.description}! Reward: ${task.reward}`);
      }
      if (task.id === 'play_3_times' && !task.completed) {
        playCount++;
        task.progress = playCount;
        if (task.progress >= task.target) {
          task.completed = true;
          window.addTokens(5); // Токен нэмэх
          tg.showAlert(`Task completed: ${task.description}! Reward: ${task.reward}`);
        }
      }
    });
    localStorage.setItem(`playCount_${userId}`, playCount);
    updateTaskList();
    saveGameState();
  }
}

function checkNoMusicChallenge() {
  if (tasks) {
    const noMusicTask = tasks.find(task => task.id === 'no_music_challenge');
    if (!noMusicTask.completed && gameOver) {
      noMusicTask.completed = true;
      window.addTokens(5); // Токен нэмэх
      tg.showAlert(`Challenge Completed: ${noMusicTask.description}! Reward: ${noMusicTask.reward}`);
      updateTaskList();
      saveGameState();
    }
  }
}

function updateTaskList() {
  const taskList = document.getElementById('task-list');
  if (taskList && tasks) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.textContent = `${task.description} - ${task.completed ? 'Completed' : `Progress: ${task.progress || 0}/${task.target || 1}`} (Reward: ${task.reward})`;
      taskList.appendChild(li);
    });
  }
}

function resetGame() {
  if (!canvas) return;
  gameOver = false;
  isPlaying = true;
  balloon.x = canvas.width / 2 - balloon.width / 2;
  balloon.y = canvas.height / 2 - balloon.height / 2;
  obstacles = [];
  score = 0;
  backButton.style.display = 'none';
  bottomMenu.style.display = 'none';
  shopButton.style.display = 'none';
  settingsButton.style.display = 'none';
  document.getElementById('shop-button-glow').style.display = 'none';
  document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnObstacle, 1500);
  updateTasks();
  saveGameState();
  tg.showAlert('Welcome to No Background Music Challenge! Play without music for a unique experience.');
  gameLoop();
}

function spawnObstacle() {
  if (!canvas) return;
  const size = 76.8;
  const x = Math.random() * (canvas.width - size);
  obstacles.push({ x, y: -size, width: size, height: size });
}

function saveGameState() {
  localStorage.setItem(`highScore_${userId}`, highScore);
  localStorage.setItem(`playCount_${userId}`, playCount);
  if (tasks) localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks));
  localStorage.setItem(`vibrationEnabled_${userId}`, vibrationEnabled);
  window.saveScore(highScore); // Firebase-д оноо хадгалах
}

function changeSkin(skinId) {
  if (balloonImg) {
    balloonImg.src = `assets/${skinId}.gif`;
    balloonPixelData = getPixelData(balloonImg, balloon.width, balloon.height);
    tg.showAlert(`Skin changed to: ${skinId}`);
    saveGameState();
  }
}

function updateBalloon() {
  if (!isPlaying && canvas) balloon.x = canvas.width / 2 - menuBalloonSize / 2;
}

function gameLoop(time) {
  if (!canvas || !ctx) return;
  const deltaTime = lastTime ? (time - lastTime) / 1000 : 1/60;
  lastTime = time;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (isPlaying) {
    ctx.fillStyle = '#aee1f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    drawBackground(time, deltaTime);
    drawClouds(deltaTime);
  }
  updateBalloon();
  drawBalloon(time);
  if (!isPlaying) drawCloudsFront(deltaTime);
  drawObstacles(deltaTime);
  drawScore();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('touchmove', function(e) {
  if (isPlaying && canvas) {
    e.preventDefault();
    let touch = e.touches[0];
    balloon.x = Math.max(10, Math.min(touch.clientX - balloon.width / 2, canvas.width - balloon.width - 10));
  }
}, { passive: false });

canvas.addEventListener('mousemove', function(e) {
  if (isPlaying && canvas) {
    balloon.x = Math.max(10, Math.min(e.clientX - balloon.width / 2, canvas.width - balloon.width - 10));
  }
});

document.querySelectorAll('.menu-button').forEach(button => {
  button.addEventListener('click', () => {
    if (!isPlaying && canvas) {
      if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
      const layerId = button.dataset.layer;
      if (layerId === 'play-layer') {
        resetGame();
      } else {
        document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
        document.getElementById(layerId).style.display = 'flex';
        if (layerId === 'tasks-layer') updateTaskList();
        if (layerId === 'leaderboard-layer') window.updateLeaderboard();
        if (layerId === 'wallet-layer') updateWallet();
      }
    }
  });
});

shopButton.addEventListener('click', () => {
  if (!isPlaying && canvas) {
    if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
    document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
    document.getElementById('shop-layer').style.display = 'flex';
  }
});

settingsButton.addEventListener('click', () => {
  if (!isPlaying && canvas) {
    if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
    document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
    document.getElementById('settings-layer').style.display = 'flex';
  }
});

document.querySelectorAll('.menu-layer .back-button').forEach(button => {
  button.addEventListener('click', () => {
    if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
    button.parentNode.parentNode.style.display = 'none';
  });
});

backButton.addEventListener('click', () => {
  if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
  backButton.style.display = 'none';
  bottomMenu.style.display = 'flex';
  shopButton.style.display = 'block';
  settingsButton.style.display = 'block';
  document.getElementById('shop-button-glow').style.display = 'block';
  document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
});

document.getElementById('vibration-toggle').addEventListener('change', (e) => {
  vibrationEnabled = e.target.checked;
  localStorage.setItem(`vibrationEnabled_${userId}`, vibrationEnabled);
});

let imagesLoaded = 0;
function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === 9) {
    if (!canvas || !ctx) {
      alert('Error: Canvas or context not available. Check your setup.');
      return;
    }
    document.getElementById('loading-screen').style.display = 'none';
    balloonPixelData = getPixelData(balloonImg, balloon.width, balloon.height);
    obstaclePixelData = getPixelData(obstacleImg, 76.8, 76.8);
    if (!balloonPixelData || !obstaclePixelData) {
      console.warn('Pixel data failed to load for balloon or obstacle.');
    }
    updateTaskList();
    window.updateLeaderboard();
    updateWallet();
    document.getElementById('vibration-toggle').checked = vibrationEnabled;
    gameLoop();
  }
}
bgImg.onload = checkImagesLoaded;
balloonImg.onload = checkImagesLoaded;
obstacleImg.onload = checkImagesLoaded;
coinImg.onload = checkImagesLoaded;
cloudImg.onload = checkImagesLoaded;
cloud1Img.onload = checkImagesLoaded;
cloud2Img.onload = checkImagesLoaded;
shopImg.onload = checkImagesLoaded;
settingsImg.onload = checkImagesLoaded;
bgMenuImg.onload = checkImagesLoaded;
bgImg.onerror = () => tg.showAlert('Failed to load background image');
balloonImg.onerror = () => tg.showAlert('Failed to load balloon image');
obstacleImg.onerror = () => tg.showAlert('Failed to load obstacle image');
coinImg.onerror = () => tg.showAlert('Failed to load coin image');
cloudImg.onerror = () => tg.showAlert('Failed to load cloud image');
cloud1Img.onerror = () => tg.showAlert('Failed to load cloud1 image');
cloud2Img.onerror = () => tg.showAlert('Failed to load cloud2 image');
shopImg.onerror = () => tg.showAlert('Failed to load shop image');
settingsImg.onerror = () => tg.showAlert('Failed to load settings image');
bgMenuImg.onerror = () => tg.showAlert('Failed to load menu background image');

tg.BackButton.onClick(() => {
  if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
  document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
  bottomMenu.style.display = 'flex';
  shopButton.style.display = 'block';
  settingsButton.style.display = 'block';
  document.getElementById('shop-button-glow').style.display = 'block');
});

window.changeSkin = function(skinId) {
  if (balloonImg) {
    balloonImg.src = `assets/${skinId}.gif`;
    balloonPixelData = getPixelData(balloonImg, balloon.width, balloon.height);
    tg.showAlert(`Skin changed to: ${skinId}`);
    saveGameState();
  }
};