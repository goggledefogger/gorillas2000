let game, view, controller;

class GorillasController {
  constructor(game, view) {
    this.game = game;
    this.view = view;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const angleSlider = document.getElementById('angle-slider');
    const powerSlider = document.getElementById('power-slider');
    const throwButton = document.getElementById('throw-button');

    angleSlider.addEventListener('input', () => {
      this.updateView();
    });

    powerSlider.addEventListener('input', () => {
      this.updateView();
    });

    throwButton.addEventListener('click', () => {
      const angle = parseFloat(angleSlider.value);
      const power = parseFloat(powerSlider.value);
      this.executeThrow(angle, power);
    });
  }

  async executeThrow(angle, power) {
    let startX = this.game.gorillas[this.game.currentPlayer].x;
    let startY = this.game.gorillas[this.game.currentPlayer].y;

    const hitData = await this.view.drawBananaTrajectory(
      startX,
      startY,
      angle,
      power
    );
    if (hitData.hit) {
      this.game.hitPosition = hitData.position; // Set the actual hit position
      this.view.showExplosion(this.game.hitPosition.x, this.game.hitPosition.y);
      this.game.switchPlayer();
    }

    this.updateView();
  }

  startGame() {
    this.game.initializeRound();
    this.updateView();
  }

  updateView() {
    this.view.render();
  }
}

function setup() {
  createCanvas(800, 600).parent('canvas-container'); // Create a canvas of 800x600 pixels
  noLoop(); // Ensure the draw function doesn't loop endlessly

  game = new GorillasGame('Player 1', 'Player 2', 3);
  view = new GorillasView(game);
  controller = new GorillasController(game, view);

  controller.startGame();
}
