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

    // Await the resolution of drawBananaTrajectory
    const collisionResult = await this.view.drawBananaTrajectory(
      startX,
      startY,
      angle,
      power
    );

    if (collisionResult) {
      let winTextElement = document.getElementById('win-text');
      switch (collisionResult.hit.type) {
        case 'gorilla':
          // Handle gorilla collision
          winTextElement.textContent = `Player ${
            this.game.currentPlayer + 1
          } wins this round!`;
          this.updateScoreboard();
          // Show the win message
          document.getElementById('win-message').style.display = 'block';
          break;
        case 'building':
          // Handle building collision
          console.log(`Hit a building at index ${collisionResult.hit.index}`);
          this.game.switchPlayer();
          break;
        default:
          // No collision
          this.game.switchPlayer();
          break;
      }
    }
    this.updateView();
  }

  startGame() {
    this.game.initializeRound();
    this.updateView();

    // Add event listener for the continue button to hide the message and start the next round
    document.getElementById('continue-btn').addEventListener('click', () => {
      document.getElementById('win-message').style.display = 'none';
      this.game.initializeRound();
      this.updateView();
    });
  }

  updateScoreboard() {
    this.game.totalWins[this.game.currentPlayer]++;
    document.getElementById(
      `player${this.game.currentPlayer + 1}-score`
    ).textContent = this.game.totalWins[this.game.currentPlayer];
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
