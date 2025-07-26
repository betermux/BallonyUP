const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const gravity = 0.3
let score = 0

// Зургуудыг дуудаж бэлтгэх
const fruitImg = new Image()
fruitImg.src = './assets/watermelon.png'

const fruitHalfLeft = new Image()
fruitHalfLeft.src = './assets/watermelon_left.png'

const fruitHalfRight = new Image()
fruitHalfRight.src = './assets/watermelon_right.png'

const fruits = []
const fruitHalves = []

// 🎯 Жимс объект
class Fruit {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = 32
    this.vx = (Math.random() - 0.5) * 4
    this.vy = -10 - Math.random() * 5
    this.gravity = gravity
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

  slice() {
    this.isSliced = true
    fruitHalves.push(new FruitHalf(this.x, this.y, 'left'))
    fruitHalves.push(new FruitHalf(this.x, this.y, 'right'))
  }
}

// ✂️ Зүсэгдсэний дараах талууд
class FruitHalf {
  constructor(x, y, direction) {
    this.x = x
    this.y = y
    this.radius = 32
    this.vx = direction === 'left' ? -3 : 3
    this.vy = -5
    this.gravity = gravity
    this.rotation = 0
    this.rotationSpeed = direction === 'left' ? -0.1 : 0.1
    this.image = direction === 'left' ? fruitHalfLeft : fruitHalfRight
  }

  update() {
    this.vy += this.gravity
    this.x += this.vx
    this.y += this.vy
    this.rotation += this.rotationSpeed
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2)
    ctx.restore()
  }
}

// 🎯 Оноо харуулах
function drawScore() {
  ctx.fillStyle = 'white'
  ctx.font = '24px Arial'
  ctx.fillText('Score: ' + score, 10, 30)
}

// 🕹️ Слайс хийх үед
function handleSlice(x, y) {
  fruits.forEach(fruit => {
    if (!fruit.isSliced && fruit.isHit(x, y)) {
      fruit.slice()
      score++
    }
  })
}

// 🖱️ Mouse event
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  handleSlice(x, y)
})

// 📱 Touch event
canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect()
  for (let touch of e.touches) {
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    handleSlice(x, y)
  }
})

// 🍉 Тарвас spawn хийх
setInterval(() => {
  const fruit = new Fruit(Math.random() * canvas.width, canvas.height)
  fruits.push(fruit)
}, 1000)

// 🎮 Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

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