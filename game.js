const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas resolution
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
    y: 500, // Start near bottom
    width: 50, // Fixed size for balloon
    height: 80,
    vy: -2, // Upward velocity
    vx: 0,  // Horizontal velocity
    drag: 0.95 // Drag factor
};
let clouds = [];
let gameOver = false;
let isDragging = false;
let score = 0;
let cameraY = 0;
let touchX = null;

// Cloud spawn settings
const cloudSpawnRate = 100;
let cloudSpawnTimer = 0;

// Touch event listeners
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouchStart(e) {
    e.preventDefault();
    try {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        const touchXPos = (touch.clientX - rect.left) * scaleX;
        const touchYPos = (touch.clientY - rect.top) * scaleY;

        if (gameOver) {
            const restartBtn = { x: canvas.width / 2 - 50, y: canvas.height / 2, width: 100, height: 50 };
            if (
                touchXPos >= restartBtn.x &&
                touchXPos <= restartBtn.x + restartBtn.width &&
                touchYPos >= restartBtn.y &&
                touchYPos <= restartBtn.y + restartBtn.height
            ) {
                resetGame();
            }
        } else {
            isDragging = true;
            touchX = touchXPos;
        }
    } catch (error) {
        console.error('Touch start error:', error);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    try {
        if (isDragging && !gameOver) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const touch = e.touches[0];
            touchX = (touch.clientX - rect.left) * scaleX;
            balloon.vx = (touchX - balloon.x) * 0.1; // Direct velocity for smoother control
        }
    } catch (error) {
        console.error('Touch move error:', error);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    try {
        isDragging = false;
        touchX = null;
    } catch (error) {
        console.error('Touch end error:', error);
    }
}

// Spawn clouds
function spawnCloud() {
    try {
        const cloud = {
            x: Math.random() * (canvas.width - (cloudImg.width || 100)),
            y: cameraY - (cloudImg.height || 60),
            width: cloudImg.width || 100, // Fallback size
            height: cloudImg.height || 60,
            vy: 2
        };
        clouds.push(cloud);
    } catch (error) {
        console.error('Spawn cloud error:', error);
    }
}

// Check collision
function checkCollision(balloon, cloud) {
    try {
        return (
            balloon.x < cloud.x + cloud.width &&
            balloon.x + balloon.width > cloud.x &&
            balloon.y < cloud.y + cloud.height &&
            balloon.y + balloon.height > cloud.y
        );
    } catch (error) {
        console.error('Collision check error:', error);
        return false;
    }
}

// Reset game
function resetGame() {
    try {
        balloon.x = canvas.width / 2;
        balloon.y = 500;
        balloon.vx = 0;
        clouds = [];
        score = 0;
        cameraY = 0;
        gameOver = false;
        isDragging = false;
        touchX = null;
    } catch (error) {
        console.error('Reset game error:', error);
    }
}

// Game loop
function update() {
    try {
        if (!gameOver) {
            // Update balloon
            balloon.y += balloon.vy;
            balloon.x += balloon.vx;
            balloon.vx *= balloon.drag;

            // Keep balloon in bounds
            balloon.x = Math.max(0, Math.min(balloon.x, canvas.width - balloon.width));

            // Update camera
            cameraY = Math.max(0, balloon.y - canvas.height / 2);

            // Spawn clouds
            cloudSpawnTimer++;
            if (cloudSpawnTimer > cloudSpawnRate) {
                spawnCloud();
                cloudSpawnTimer = 0;
            }

            // Update clouds
            clouds = clouds.filter(cloud => cloud.y < cameraY + canvas.height + (cloud.height || 60));
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
    } catch (error) {
        console.error('Update loop error:', error);
    }

    requestAnimationFrame(update);
}

// Wait for assets to load
let assetsLoaded = 0;
const totalAssets = 3;
function checkAssetsLoaded() {
    try {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            // Set balloon to fixed size, clouds/restart to natural size
            balloon.width = 50;
            balloon.height = 80;
            clouds.forEach(cloud => {
                cloud.width = cloudImg.width || 100;
                cloud.height = cloudImg.height || 60;
            });
            update();
        }
    } catch (error) {
        console.error('Asset load error:', error);
    }
}
balloonImg.onload = checkAssetsLoaded;
cloudImg.onload = checkAssetsLoaded;
restartImg.onload = checkAssetsLoaded;

// Initialize Telegram WebApp
Telegram.expand();