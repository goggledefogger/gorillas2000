let game, view, controller;

GAME_ID = 24;

class GorillasController {
  constructor(game, view) {
    this.game = game;
    this.view = view;
    this.setupEventListeners();
    this.musicIsPlaying = false;
  }

  setupEventListeners() {
    const angleSlider = document.getElementById('angle-slider');
    const velocitySlider = document.getElementById('velocity-slider');
    const throwButton = document.getElementById('throw-button');
    const resetButton = document.getElementById('reset-button');

    angleSlider.addEventListener('input', () => {
      this.view.hideNotifyTurn();
      this.view.updateAngleValue(angleSlider.value);
      this.updateView();
    });

    velocitySlider.addEventListener('input', () => {
      this.view.hideNotifyTurn();
      this.view.updateVelocityValue(velocitySlider.value);
      this.updateView();
    });

    throwButton.addEventListener('click', () => {
      this.view.hideNotifyTurn();
      this.game.initializeMeAsPlayer(this.game.currentPlayer);
      const angle = parseFloat(angleSlider.value);
      const velocity = parseFloat(velocitySlider.value);
      this.executeThrow(angle, velocity);
    });

    // Add event listener for the continue button to hide the message and start the next round
    document.getElementById('continue-btn').addEventListener('click', () => {
      this.startGame();
    });

    resetButton.addEventListener('click', () => {
      this.showPlayerChooser();
      this.clearGameData(GAME_ID);
      this.game.resetGame(true);
    });

    // add event listeners for all the replay buttons
    document.querySelectorAll('.replay-last-turn')
      .forEach((button) => {
        button.addEventListener('click', () => {
          this.replayLastTurn();
        });
      });

    // add an event listener for anything outside of the #turn-notification div
    document.addEventListener('click', (event) => {
      if (
        !event.target.closest('#turn-notification') &&
        !event.target.closest('.replay-last-turn') &&
        !event.target.closest('#music-button')
      ) {
        this.view.hideNotifyTurn();
      }
    });

    document.getElementById('music-button').addEventListener('click', () => {
      this.toggleMusic()
    });

    // // add an event listener to clicking on the main game image
    // document.getElementById('game-image').addEventListener('click', () => {
    //   this.view.toggleTrajectory();
    // });

  }

  clearGameData(gameId) {
    window.deleteFromDB('games/' + gameId);
  }

  toggleMusic() {
    if (!this.musicIsPlaying) {
    document.getElementById('game-audio').play();
    } else {
      document.getElementById('game-audio').pause();
    }

    this.musicIsPlaying = !this.musicIsPlaying;
    // toggle 'animated' css style on element
    document.getElementById('music-button').classList.toggle('pulsing');
  }

  startFirebaseListener(gameId) {
    window.createGameStateListener(gameId, this.dbGameStateChanged.bind(this));
  }

  dbGameStateChanged(gameState) {
    if (gameState) {
      this.game.handleGameStateChange(gameState);
    }
    this.updateView();
  }

  async executeThrow(angle, velocity) {
    let startX = this.game.gorillas[this.game.currentPlayer].x;
    let startY = this.game.gorillas[this.game.currentPlayer].y;

    // Await the resolution of drawBananaTrajectory
    const collisionResult = await this.view.drawBananaTrajectory(
      startX,
      startY,
      angle,
      velocity
    );

    // Save turn data to Firebase
    this.game.saveTurnData(angle, velocity, startX, startY, collisionResult);

    if (collisionResult) {
      if (!collisionResult.hit) {
        // No collision, went offscreen
        this.game.switchPlayer();
      } else {
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
    }

    this.updateView();
  }

  endGame(winningPlayer) {
    this.game.endGame(winningPlayer);
    this.view.showGameEnd();
    this.updateView();
  }

  startGame() {
    this.game.initializeRound();
    this.view.nextGame();
  }

  updateView() {
    this.view.render();
  }

  async replayLastTurn() {
    try {
      const lastTurnData = await this.getLastTurnData(GAME_ID);

      if (lastTurnData) {
        this.view.animateReplay(lastTurnData);
      }
    } catch (error) {
      console.log('Error during replay:', error);
    }
  }

  // Method to retrieve the last turn's data from Firebase
  async getLastTurnData(gameId) {
    // Create a promise to handle the Firebase callback
    return new Promise((resolve, reject) => {
      // Use the existing createGameStateListener function from firebase.js
      createGameStateListener(gameId, (data) => {
        if (data && data.lastTurn) {
          resolve(data.lastTurn);
        } else {
          reject('No data found for the last turn');
        }
      });
    });
  }

  showPlayerChooser() {
    const playerChooserModal = document.getElementById('player-chooser-modal');

    window.getInitialGameData(this.game.gameId, (data) => {
      // if there's already data, no need to set the player names
      if (data) {
        return;
      }

      const player1Name = 'JoelSpaz';
      const player2Name = 'DannyChamp';

      document.getElementById('player1-name-input').value = player1Name;
      document.getElementById('player2-name-input').value = player2Name;

      playerChooserModal.classList.remove('hidden');
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
      const player1Name = document.getElementById('player1-name-input').value;
      const player2Name = document.getElementById('player2-name-input').value;
      this.game.setPlayerNames(player1Name, player2Name);
      playerChooserModal.classList.add('hidden');
      this.updateView(); // Reflect the new names
    });
  }
}

function setup() {
  let cnv = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  cnv.parent('canvas-container');
  scaleCanvas(); // Apply initial scaling
  noLoop();

  game = new GorillasGame('Player 1', 'Player 2', 3);

  view = new GorillasView(game);
  controller = new GorillasController(game, view);
  game.controller = controller

  controller.startGame();
  controller.startFirebaseListener('24');

  controller.showPlayerChooser();
}

function scaleCanvas() {
  let scaleX =
    document.getElementById('canvas-container').offsetWidth / CANVAS_WIDTH;
  let scaleY =
    document.getElementById('canvas-container').offsetHeight / CANVAS_HEIGHT;
  let scale = Math.min(scaleX, scaleY);

  let canvas = document.querySelector('canvas');
  canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  canvas.style.left = '50%';
  canvas.style.top = '50%';
  canvas.style.position = 'absolute';
}

window.addEventListener('resize', scaleCanvas);
