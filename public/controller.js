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
    const resetButton = document.getElementById('reset-button');

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

    // Add event listener for the continue button to hide the message and start the next round
    document.getElementById('continue-btn').addEventListener('click', () => {
      document.getElementById('win-message').style.display = 'none';
      this.startGame();
    });

    resetButton.addEventListener('click', () => {
      this.game.resetGame();
      this.updateView();
    });
  }

  startFirebaseListener(gameId) {
    window.createGameStateListener(gameId, this.dbGameStateChanged.bind(this));
  }

  dbGameStateChanged(gameState) {
    if (gameState) {
      this.game.loadFromState(gameState);
    }
    this.updateView();
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
    } wins this round!`;
    // Show the win message
    document.getElementById('win-message').style.display = 'block';
    this.game.endGame(winningPlayer);
    this.updateView();
  }

  startGame() {
    this.game.initializeRound();
    this.view.nextGame();
  }

  updateScoreboard() {
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');

    if (player1ScoreElement && player2ScoreElement) {
      player1ScoreElement.textContent = this.game.totalWins[0];
      player2ScoreElement.textContent = this.game.totalWins[1];
    }
  }

  updateView() {
    this.updateScoreboard();
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
  controller.startFirebaseListener('24');
}

