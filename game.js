const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'guest';

const database = window.firebaseDatabase;
import { ref, set, onValue } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
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

const bgMusic = new Audio('assets/bg.mp3');
bgMusic.loop = true;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let balloon = { x: canvas.width / 2 - 64, y: canvas.height / 2, width: 128, height: 128 };
let obstacles = [];
let speed = 2;
let gameOver = false;
let score = 0;
let highScore = 0;
let lastTime = 0;
let spawnInterval;
let isPlaying = false;
let playCount = localStorage.getItem(`playCount_${userId}`) ? parseInt(localStorage.getItem(`playCount_${userId}`)) : 0;
let vibrationEnabled = localStorage.getItem(`vibrationEnabled_${userId}`) !== 'false';
let musicEnabled = localStorage.getItem(`musicEnabled_${userId}`) !== 'false';

let balloonY = canvas.height / 2;
const balloonAmplitude = 10;
const balloonFrequency = 0.002;
let bgX = 0;
const bgSpeed = 25;

let clouds = [];
for (let i = 0; i < 9; i++) {
  clouds.push({
    img: i % 3 === 0 ? cloudImg : (i % 3 === 1 ? cloud1Img : cloud2Img),
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height / 2,
    size: 75 + Math.random() * 150,
    speed: 10 + Math.random() * 20,
    zIndex: Math.random() < 0.5 ? 'front' : 'back'
  });
}

let tasks = [
  { id: 'score_1000', description: 'Score 1000 points', reward: 'Unlock Red Skin', completed: false },
  { id: 'play_3_times', description: 'Play 3 times', reward: 'Unlock Blue Skin', progress: playCount, target: 3, completed: false },
];

const menuBalloonSize = 384;
let balloonPixelData, obstaclePixelData;
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

function loadHighScoreFromFirebase() {
  const userRef = ref(database, 'leaderboard/' + userId);
  onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.score) {
      highScore = data.score;
      document.getElementById('score-display-top').textContent = Math.floor(highScore);
      updateWallet();
    }
  }, (error) => {
    tg.showAlert('Error loading high score from Firebase: ' + error.message);
  });
}

function saveScoreToFirebase() {
  const username = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username || 'Unknown' : 'Unknown';
  set(ref(database, 'leaderboard/' + userId), {
    username: username,
    score: Math.floor(highScore),
    timestamp: Date.now()
  }).catch(error => {
    tg.showAlert('Error saving score to Firebase: ' + error.message);
  });
}

function updateLeaderboard() {
  const leaderboardRef = ref(database, 'leaderboard/');
  onValue(leaderboardRef, (snapshot) => {
    const data = snapshot.val();
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';

    if (!data) {
      const li = document.createElement('li');
      li.textContent = 'No leaderboard data available';
      leaderboard.appendChild(li);
    } else {
      const sortedScores = Object.entries(data)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 10);
      sortedScores.forEach(([userId, userData], index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. @${userData.username}: ${userData.score} coins`;
        leaderboard.appendChild(li);
      });
    }
  }, (error) => {
    tg.showAlert('Error fetching leaderboard: ' + error.message);
  });
}

function getPixelData(img, width, height) {
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  offscreenCtx.clearRect(0, 0, width, height);
  offscreenCtx.drawImage(img, 0, 0, width, height);
  return offscreenCtx.getImageData(0, 0, width, height).data;
}

function checkPixelCollision(x1, y1, w1, h1, pixelData1, x2, y2, w2, h2, pixelData2) {
  if (x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1) return false;
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
      if (pixelData1[index1] > 0 && pixelData2[index2] > 0) {
        return true;
      }
    }
  }
  return false;
}

function drawBackground(time, deltaTime) {
  if (!isPlaying) {
    bgX -= bgSpeed * deltaTime;
    if (bgX <= -canvas.width) {
      bgX += canvas.width;
    }
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
  }
}

function drawClouds(deltaTime) {
  if (!isPlaying) {
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed * deltaTime;
      if (cloud.x <= -cloud.size) {
        cloud.x = canvas.width;
        cloud.y = Math.random() * canvas.height / 2;
      }
      if (cloud.zIndex === 'back') {
        ctx.drawImage(cloud.img, cloud.x, cloud.y, cloud.size, cloud.size);
      }
    });
  }
}

function drawBalloon(time) {
  if (!isPlaying) {
    balloonY = canvas.height / 2 + Math.sin(time * balloonFrequency) * balloonAmplitude;
    ctx.drawImage(balloonImg, canvas.width / 2 - menuBalloonSize / 2, balloonY - menuBalloonSize / 2, menuBalloonSize, menuBalloonSize);
  } else {
    ctx.drawImage(balloonImg, balloon.x, balloon.y, balloon.width, balloon.height);
  }
}

function drawCloudsFront(deltaTime) {
  if (!isPlaying) {
    clouds.forEach(cloud => {
      if (cloud.zIndex === 'front') {
        ctx.drawImage(cloud.img, cloud.x, cloud.y, cloud.size, cloud.size);
      }
    });
  }
}

function drawObstacles(deltaTime) {
  if (!isPlaying) return;
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
    }
  }
  obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function drawScore() {
  document.getElementById('score-display-top').textContent = Math.floor(highScore);
  if (isPlaying) {
    ctx.fillStyle = 'black';
    ctx.font = '16px "Press Start 2P"';
    ctx.drawImage(coinImg, 10, 10, 24, 24);
    ctx.fillText(`${Math.floor(score)} | High Score: ${Math.floor(highScore)}`, 40, 30);
    score += 1 / 60;
    if (score > highScore) {
      highScore = score;
      document.getElementById('score-display-top').textContent = Math.floor(highScore);
      saveScoreToFirebase();
    }
  }
  updateWallet();
}

function updateBalloon() {
  if (!isPlaying) {
    balloon.x = canvas.width / 2 - menuBalloonSize / 2;
  }
}

function gameLoop(time) {
  const deltaTime = lastTime ? (time - lastTime) / 1000 : 1/60;
  lastTime = time;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (isPlaying) {
    ctx.fillStyle = '#aee1f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    drawBackground(time, deltaTime);
    drawClouds(deltaTime);
    drawBalloon(time);
    drawCloudsFront(deltaTime);
  }
  if (isPlaying) {
    updateBalloon();
    drawBalloon(time);
    drawObstacles(deltaTime);
  }
  drawScore();
  requestAnimationFrame(gameLoop);
}

function spawnObstacle() {
  const size = 76.8;
  const x = Math.random() * (canvas.width - size);
  obstacles.push({ x, y: -size, width: size, height: size });
}

function saveGameState() {
  localStorage.setItem(`playCount_${userId}`, playCount);
  localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks));
  localStorage.setItem(`vibrationEnabled_${userId}`, vibrationEnabled);
  localStorage.setItem(`musicEnabled_${userId}`, musicEnabled);
  saveScoreToFirebase();
  updateLeaderboard();
}

function changeSkin(skinId) {
  balloonImg.src = `assets/${skinId}.gif`;
  tg.showAlert(`Skin changed to: ${skinId}`);
  saveGameState();
}

function updateWallet() {
  document.getElementById('score-display').textContent = Math.floor(score);
  document.getElementById('high-score-display').textContent = Math.floor(highScore);
}

function updateTasks() {
  tasks.forEach(task => {
    if (task.id === 'score_1000' && score >= 1000 && !task.completed) {
      task.completed = true;
      tg.showAlert(`Task completed: ${task.description}! Reward: ${task.reward}`);
    }
    if (task.id === 'play_3_times' && !task.completed) {
      playCount++;
      task.progress = playCount;
      if (task.progress >= task.target) {
        task.completed = true;
        tg.showAlert(`Task completed: ${task.description}! Reward: ${task.reward}`);
      }
    }
  });
  localStorage.setItem(`playCount_${userId}`, playCount);
  updateTaskList();
  saveGameState();
}

function updateTaskList() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.description} - ${task.completed ? 'Completed' : `Progress: ${task.progress || 0}/${task.target || 1}`} (Reward: ${task.reward})`;
    taskList.appendChild(li);
  });
}

function resetGame() {
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
  gameLoop();
}

canvas.addEventListener('touchmove', function(e) {
  if (isPlaying) {
    e.preventDefault();
    let touch = e.touches[0];
    balloon.x = Math.max(10, Math.min(touch.clientX - balloon.width / 2, canvas.width - balloon.width - 10));
  }
}, { passive: false });

canvas.addEventListener('mousemove', function(e) {
  if (isPlaying) {
    balloon.x = Math.max(10, Math.min(e.clientX - balloon.width / 2, canvas.width - balloon.width - 10));
  }
});

document.querySelectorAll('.menu-button').forEach(button => {
  button.addEventListener('click', () => {
    if (!isPlaying) {
      if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
      const layerId = button.dataset.layer;
      if (layerId === 'play-layer') {
        resetGame();
      } else {
        document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
        document.getElementById(layerId).style.display = 'flex';
        if (layerId === 'tasks-layer') updateTaskList();
        if (layerId === 'leaderboard-layer') updateLeaderboard();
        if (layerId === 'wallet-layer') updateWallet();
      }
    }
  });
});

shopButton.addEventListener('click', () => {
  if (!isPlaying) {
    if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
    document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
    document.getElementById('shop-layer').style.display = 'flex';
  }
});

settingsButton.addEventListener('click', () => {
  if (!isPlaying) {
    if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
    document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
    document.getElementById('settings-layer').style.display = 'flex';
  }
});

document.querySelectorAll('.menu-layer .back-button').forEach(button => {
  button.addEventListener('click', () => {
    if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
    button.parentNode.style.display = 'none';
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

document.getElementById('music-toggle').addEventListener('change', (e) => {
  musicEnabled = e.target.checked;
  localStorage.setItem(`musicEnabled_${userId}`, musicEnabled);
  if (musicEnabled) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
});

Promise.all([
  new Promise(resolve => { bgImg.onload = resolve; bgImg.onerror = () => tg.showAlert('Failed to load background image'); }),
  new Promise(resolve => { balloonImg.onload = resolve; balloonImg.onerror = () => tg.showAlert('Failed to load balloon image'); }),
  new Promise(resolve => { obstacleImg.onload = resolve; obstacleImg.onerror = () => tg.showAlert('Failed to load obstacle image'); }),
  new Promise(resolve => { coinImg.onload = resolve; coinImg.onerror = () => tg.showAlert('Failed to load coin image'); }),
  new Promise(resolve => { cloudImg.onload = resolve; cloudImg.onerror = () => tg.showAlert('Failed to load cloud image'); }),
  new Promise(resolve => { cloud1Img.onload = resolve; cloud1Img.onerror = () => tg.showAlert('Failed to load cloud1 image'); }),
  new Promise(resolve => { cloud2Img.onload = resolve; cloud2Img.onerror = () => tg.showAlert('Failed to load cloud2 image'); }),
  new Promise(resolve => { shopImg.onload = resolve; shopImg.onerror = () => tg.showAlert('Failed to load shop image'); }),
  new Promise(resolve => { settingsImg.onload = resolve; settingsImg.onerror = () => tg.showAlert('Failed to load settings image'); }),
  new Promise(resolve => { bgMenuImg.onload = resolve; bgMenuImg.onerror = () => tg.showAlert('Failed to load menu background image'); }),
]).then(() => {
  balloonPixelData = getPixelData(balloonImg, balloon.width, balloon.height);
  obstaclePixelData = getPixelData(obstacleImg, 76.8, 76.8);
  updateTaskList();
  loadHighScoreFromFirebase();
  updateLeaderboard();
  updateWallet();
  document.getElementById('vibration-toggle').checked = vibrationEnabled;
  document.getElementById('music-toggle').checked = musicEnabled;
  if (musicEnabled) bgMusic.play();
  gameLoop();
}).catch(error => {
  tg.showAlert('Error loading assets: ' + error.message);
});

tg.BackButton.onClick(() => {
  if (vibrationEnabled) tg.HapticFeedback.impactOccurred('medium');
  document.querySelectorAll('.menu-layer').forEach(layer => layer.style.display = 'none');
  bottomMenu.style.display = 'flex';
  shopButton.style.display = 'block';
  settingsButton.style.display = 'block';
  document.getElementById('shop-button-glow').style.display = 'block';
});

window.changeSkin = function(skinId) {
  balloonImg.src = `assets/${skinId}.gif`;
  tg.showAlert(`Skin changed to: ${skinId}`);
  saveGameState();
};