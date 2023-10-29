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
      switch (collisionResult.hit.type) {
        case 'gorilla':
          const winningPlayer = 1 - collisionResult.hit.player;
          this.endGame(winningPlayer);
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

  endGame(winningPlayer) {
    let winTextElement = document.getElementById('win-text');
    // Handle gorilla collision
    winTextElement.textContent = `Player ${
      this.game.currentPlayer + 1
    } wins this round!`;;
    // Show the win message
    document.getElementById('win-message').style.display = 'block';
    this.game.endGame(winningPlayer);

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

  updateView() {
    this.view.render();
  }
}

function setup() {
  const canvasContainer = document.getElementById('canvas-container');
  let cnv = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  // remove cnv.center();
  cnv.parent('canvas-container');
  noLoop();

  game = new GorillasGame('Player 1', 'Player 2', 3);
  view = new GorillasView(game);
  controller = new GorillasController(game, view);

  controller.startGame();
}
