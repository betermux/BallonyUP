const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const gravity = 0.3
const friction = 0.99
let score = 0

const bgImg = new Image()
bgImg.src = './assets/bg.png'

const fruitImg = new Image()
fruitImg.src = './assets/watermelon.png'

const fruitHalfLeft = new Image()
fruitHalfLeft.src = './assets/watermelon_left.png'

const fruitHalfRight = new Image()
fruitHalfRight.src = './assets/watermelon_right.png'

const sliceSound = new Audio('./assets/slice_sound.mp3')

const fruits = []
const fruitHalves = []

class Fruit {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = 32
    this.vx = (canvas.width / 2 - x) * 0.01 // төв рүү татах
    this.vy = -8 - Math.random() * 2
    this.sliced = false
  }

  update() {
    this.vy += gravity
    this.x += this.vx
    this.y += this.vy
  }

  draw() {
    if (!this.sliced) {
      ctx.drawImage(fruitImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2)
    }
  }

  isHit(x1, y1, x2, y2) {
    const dx = this.x - x1
    const dy = this.y - y1
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < this.radius + 20
  }

  slice(angle) {
    this.sliced = true
    sliceSound.currentTime = 0
    sliceSound.play()

    fruitHalves.push(new FruitHalf(this.x, this.y, angle, 'left'))
    fruitHalves.push(new FruitHalf(this.x, this.y, angle, 'right'))
  }
}

class FruitHalf {
  constructor(x, y, angle, side) {
    this.x = x
    this.y = y
    const speed = 5 + Math.random() * 2
    const direction = angle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2)
    this.vx = Math.cos(direction) * speed
    this.vy = Math.sin(direction) * speed
    this.side = side
    this.image = side === 'left' ? fruitHalfLeft : fruitHalfRight
    this.rotation = 0
    this.rotationSpeed = (Math.random() - 0.5) * 0.2
  }

  update() {
    this.vy += gravity
    this.vx *= friction
    this.vy *= friction
    this.x += this.vx
    this.y += this.vy
    this.rotation += this.rotationSpeed
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    ctx.drawImage(this.image, -32, -32, 64, 64)
    ctx.restore()
  }
}

// Тарвас үүсгэх функц
function spawnFruit() {
  const x = Math.random() * canvas.width
  const fruit = new Fruit(x, canvas.height)  // Canvas-ийн доод талд гарч ирнэ
  fruits.push(fruit)
}

// Тарвас үүсгэх хугацааг setInterval-аар хийнэ
setInterval(spawnFruit, 2000)  // 2 секунд тутамд шинэ тарвас үүсгэх

// ✂️ Mouse swipe slice logic
let isDragging = false
let lastX = 0
let lastY = 0

canvas.addEventListener('mousedown', (e) => {
  isDragging = true
  lastX = e.offsetX
  lastY = e.offsetY
})

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  const currX = e.offsetX
  const currY = e.offsetY

  fruits.forEach(fruit => {
    if (!fruit.sliced && fruit.isHit(currX, currY, lastX, lastY)) {
      const angle = Math.atan2(currY - lastY, currX - lastX)
      fruit.slice(angle)
    }
  })

  lastX = currX
  lastY = currY
})

canvas.addEventListener('mouseup', () => {
  isDragging = false
})

function drawScore() {
  ctx.fillStyle = 'white'
  ctx.font = '20px Arial'
  ctx.fillText('Score: ' + score, 10, 30)
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

  fruits.forEach(fruit => {
    fruit.update()
    fruit.draw()
  })

  fruitHalves.forEach(half => {
    half.update()
    half.draw()
  })

  drawScore()
  requestAnimationFrame(gameLoop)
}

gameLoop()