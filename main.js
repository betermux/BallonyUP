const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const gravity = 0.3
let score = 0

const fruitImg = new Image()
fruitImg.src = './assets/watermelon.png'

const fruits = []

class Fruit {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = 32
    this.vx = (Math.random() - 0.5) * 4
    this.vy = -10 - Math.random() * 5
    this.gravity = 0.3
    this.isSliced = false
  }

  update() {
    if (!this.isSliced) {
      this.vy += this.gravity
      this.x += this.vx
      this.y += this.vy
    }
  }

  draw() {
    if (!this.isSliced) {
      ctx.drawImage(fruitImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2)
    }
  }

  isHit(px, py) {
    const dx = this.x - px
    const dy = this.y - py
    return Math.sqrt(dx * dx + dy * dy) < this.radius
  }
}

// Санамсаргүй тарвас spawn хийдэг
setInterval(() => {
  const fruit = new Fruit(Math.random() * canvas.width, canvas.height)
  fruits.push(fruit)
}, 1000)

// Mouse / Touch gesture зүсэлт илрүүлдэг
function handleSlice(x, y) {
  fruits.forEach(fruit => {
    if (!fruit.isSliced && fruit.isHit(x, y)) {
      fruit.isSliced = true
      score++
    }
  })
}

// Mouse зүсэлт
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  handleSlice(x, y)
})

// Touch зүсэлт
canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect()
  for (let touch of e.touches) {
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    handleSlice(x, y)
  }
})

// Оноо харуулах
function drawScore() {
  ctx.fillStyle = 'white'
  ctx.font = '24px Arial'
  ctx.fillText('Score: ' + score, 10, 30)
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  fruits.forEach(fruit => {
    fruit.update()
    fruit.draw()
  })

  drawScore()
  requestAnimationFrame(gameLoop)
}

gameLoop()