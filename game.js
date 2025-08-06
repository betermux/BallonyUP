
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    y: canvas.height - 100,
    width: 50,
    height: 80,
    vy: -2, // Upward velocity (floating up)
    vx: 0,  // Horizontal velocity (affected by drag)
    drag: 0.95 // Drag factor (slows horizontal movement)
};
let clouds = [];
let gameOver = false;
let isDragging = false;
let score = 0;

// Cloud spawn settings
const cloudSpawnRate = 100;
let cloudSpawnTimer = 0;

// Mouse event listeners
canvas.addEventListener('mousedown', (e) => {
    if (gameOver) {
        // Check if restart button is clicked
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
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
});
canvas.addEventListener('mousemove', (e) => {
    if (isDragging && !gameOver) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        // Apply force to balloon's horizontal velocity based on mouse position
        balloon.vx += (mouseX - balloon.x) * 0.05; // Adjust sensitivity
    }
});
canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

// Spawn clouds
function spawnCloud() {
    const cloud = {
        x: Math.random() * (canvas.width - 100),
        y: -100,
        width: 100,
        height: 60,
        vy: 2 // Clouds move downward
    };
    clouds.push(cloud);
}

// Check collision between balloon and cloud
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
    balloon.y = canvas.height - 100;
    balloon.vx = 0;
    clouds = [];
    score = 0;
    gameOver = false;
}

// Game loop
function update() {
    if (!gameOver) {
        // Update balloon
        balloon.y += balloon.vy; // Float upward
        balloon.x += balloon.vx; // Move horizontally
        balloon.vx *= balloon.drag; // Apply drag to horizontal velocity

        // Keep balloon in bounds
        if (balloon.x < 0) balloon.x = 0;
        if (balloon.x + balloon.width > canvas.width) balloon.x = canvas.width - balloon.width;

        // Spawn clouds
        cloudSpawnTimer++;
        if (cloudSpawnTimer > cloudSpawnRate) {
            spawnCloud();
            cloudSpawnTimer = 0;
        }

        // Update clouds
        clouds.forEach((cloud, index) => {
            cloud.y += cloud.vy;
            // Remove clouds that go off-screen
            if (cloud.y > canvas.height) {
                clouds.splice(index, 1);
                score++;
            }
            // Check for collision
            if (checkCollision(balloon, cloud)) {
                gameOver = true;
            }
        });
    }

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    clouds.forEach(cloud => {
        ctx.drawImage(cloudImg, cloud.x, cloud.y, cloud.width, cloud.height);
    });

    // Draw balloon
    ctx.drawImage(balloonImg, balloon.x, balloon.y, balloon.width, balloon.height);

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Draw game over and restart button
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(restartImg, canvas.width / 2 - 50, canvas.height / 2, 100, 50);
    }

    requestAnimationFrame(update);
}

// Start game when assets are loaded
let assetsLoaded = 0;
const totalAssets = 3;
function checkAssetsLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        update();
    }
}
balloonImg.onload = checkAssetsLoaded;
cloudImg.onload = checkAssetsLoaded;
restartImg.onload = checkAssetsLoaded;