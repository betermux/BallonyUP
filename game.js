const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to fixed resolution
canvas.width = 800;
canvas.height = 600;

// Load Telegram WebApp
const Telegram = window.Telegram.WebApp;
Telegram.ready();

// Load assets
const balloonImg = new Image();
balloonImg.src = 'assets/balloon.png';
const cloudImg = new Image();
cloudImg.src = 'assets/cloud.png';
const restartImg = new Image();
restartImg.src = 'assets/restart.png';

// Game variables
let balloon = {
    x: canvas.width / 2,
    y: 500,
    width: null,
    height: null,
    vy: -2,
    vx: 0,
    drag: 0.95
};
let clouds = [];
let gameOver = false;
let isDragging = false;
let score = 0;
let cameraY = 0;

// Cloud spawn settings
const cloudSpawnRate = 100;
let cloudSpawnTimer = 0;

// Event listeners
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchend', handleEnd);

function handleStart(e) {
    e.preventDefault();
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.type === 'touchstart' ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.type === 'touchstart' ? e.touches[0].clientY : e.clientY) - rect.top;
        const mouseX = x * scaleX;
        const mouseY = y * scaleY;
        const restartBtn = { x: canvas.width / 2 - 50, y: canvas.height / 2, width: 100, height: 50 };
        if (
            mouseX >= restartBtn.x &&
            mouseX <= restartBtn.x + restartBtn.width &&
            mouseY >= restartBtn.y &&
            mouseY <= restartBtn.y + restartBtn.height
        ) {
            resetGame();
        }
    } else {
        isDragging = true;
    }
}

function handleMove(e) {
    if (isDragging && !gameOver) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.type === 'touchmove' ? e.touches[0].clientX : e.clientX) - rect.left;
        const mouseX = x * scaleX;
        balloon.vx += (mouseX - balloon.x) * 0.05;
    }
}

function handleEnd() {
    isDragging = false;
}

// Spawn clouds
function spawnCloud() {
    const cloud = {
        x: Math.random() * (canvas.width - cloudImg.width),
        y: cameraY - cloudImg.height,
        width: cloudImg.width,
        height: cloudImg.height,
        vy: 2
    };
    clouds.push(cloud);
}

// Check collision
function checkCollision(balloon, cloud) {
    return (
        balloon.x < cloud.x + cloud.width &&
        balloon.x + balloon.width > cloud.x &&
        balloon.y < cloud.y + cloud.height &&
        balloon.y + balloon.height > cloud.y
    );
}

// Reset game
function resetGame() {
    balloon.x = canvas.width / 2;
    balloon.y = 500;
    balloon.vx = 0;
    clouds = [];
    score = 0;
    cameraY = 0;
    gameOver = false;
}

// Game loop
function update() {
    if (!gameOver) {
        // Update balloon
        balloon.y += balloon.vy;
        balloon.x += balloon.vx;
        balloon.vx *= balloon.drag;

        // Keep balloon in bounds
        if (balloon.x < 0) balloon.x = 0;
        if (balloon.x + balloon.width > canvas.width) balloon.x = canvas.width - balloon.width;

        // Update camera
        cameraY = Math.max(0, balloon.y - canvas.height / 2);

        // Spawn clouds
        cloudSpawnTimer++;
        if (cloudSpawnTimer > cloudSpawnRate) {
            spawnCloud();
            cloudSpawnTimer = 0;
        }

        // Update clouds
        clouds = clouds.filter(cloud => cloud.y < cameraY + canvas.height + cloud.height);
        clouds.forEach(cloud => {
            cloud.y += cloud.vy;
            if (checkCollision(balloon, cloud)) {
                gameOver = true;
            }
        });

        // Update score
        score = Math.floor(cameraY / 100);
    }

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    clouds.forEach(cloud => {
        ctx.drawImage(cloudImg, cloud.x, cloud.y - cameraY, cloud.width, cloud.height);
    });

    // Draw balloon
    ctx.drawImage(balloonImg, balloon.x, balloon.y - cameraY, balloon.width, balloon.height);

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Draw game over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(restartImg, canvas.width / 2 - 50, canvas.height / 2, 100, 50);
    }

    requestAnimationFrame(update);
}

// Wait for assets to load
let assetsLoaded = 0;
const totalAssets = 3;
function checkAssetsLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        balloon.width = balloonImg.width;
        balloon.height = balloonImg.height;
        update();
    }
}
balloonImg.onload = checkAssetsLoaded;
cloudImg.onload = checkAssetsLoaded;
restartImg.onload = checkAssetsLoaded;

// Initialize Telegram WebApp
Telegram.expand();