const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const gravity = 0.3
const fruitImg = new Image()
fruitImg.src = './assets/watermelon.png'

const fruits = []

class Fruit {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = 32
    this.vy = 0
  }

  update() {
    this.vy += gravity
    this.y += this.vy

    // Шал хүрсэн бол хөдөлгөөнийг зогсооно
    if (this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius
      this.vy = 0
    }
  }

  draw() {
    ctx.drawImage(fruitImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2)
  }
}

canvas.addEventListener('click', () => {
  const fruit = new Fruit(canvas.width / 2, 0)
  fruits.push(fruit)
})

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  fruits.forEach(fruit => {
    fruit.update()
    fruit.draw()
  })

  requestAnimationFrame(gameLoop)
}

gameLoop()
