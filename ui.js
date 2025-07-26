export class UI {
  constructor() {
    this.score = 0;
    this.scoreElement = document.createElement('div');
    this.scoreElement.style.position = 'absolute';
    this.scoreElement.style.top = '20px';
    this.scoreElement.style.left = '20px';
    this.scoreElement.style.color = 'white';
    this.scoreElement.style.fontSize = '30px';
    this.scoreElement.style.fontFamily = 'Arial, sans-serif';
    this.scoreElement.style.fontWeight = 'bold';
    this.scoreElement.style.textShadow = '2px 2px 4px #000000';
    this.scoreElement.innerText = 'Score: 0';
    document.body.appendChild(this.scoreElement);
  }
  
  addPoints(amount) {
    this.score += amount;
    this.scoreElement.innerText = `Score: ${this.score}`;
    this.pulse();
  }
  
  pulse() {
    this.scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.scoreElement.style.transform = 'scale(1)';
    }, 100);
  }
}