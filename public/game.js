const GAME_STATES = {
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
  PAUSED: 'paused',
};

class GorillasGame {
  constructor(player1, player2, numGames) {
    this.player1 = player1;
    this.player2 = player2;
    this.numGames = numGames;
    this.totalWins = [0, 0];
    this.currentPlayer = null;
    this.cityscape = [];
    this.gorillas = []; // Positions of the gorillas
    this.wind = 0; // Wind speed and direction
    this.hitPosition = null;
    this.gameState = GAME_STATES.PLAYING; // Initialize the game state
    this.gameId = 24;
    this.lastKnownState = null;
  }

  initializeRound() {
    this.winner = null;
    this.loadFromState(this.getGameState());
    this.resetGame(true);
  }

  setPlayerNames(player1Name, player2Name) {
    this.player1 = player1Name;
    this.player2 = player2Name;
    this.updateGameState();
  }

  initializeMeAsPlayer(playerIndex) {
    this.winner = null;
    this.iamPlayer = playerIndex;
  }

  generateCityscape() {
    const buildings = [];
    const numBuildings = width / 50;
    const MAX_HEIGHT_DIFFERENCE = 150;
    const MIN_CLEARANCE = 50; // Minimum clearance above the gorilla for a clear throw
    const MAX_BUILDING_HEIGHT = height - 300; // Adjust as needed

    for (let i = 0; i < numBuildings; i++) {
      let buildingHeight = random(100, MAX_BUILDING_HEIGHT);

      // // Adjust height if the building is adjacent to a gorilla
      // for (let gorilla of this.gorillas) {
      //   const gorillaBuildingIndex = floor(gorilla.x / 50);
      //   if (Math.abs(gorillaBuildingIndex - i) <= 1) {
      //     buildingHeight = random(100, 250);
      //   }
      // }

      // Limit height difference with the previous building
      if (i > 0) {
        const prevBuildingHeight = buildings[i - 1];
        if (
          Math.abs(buildingHeight - prevBuildingHeight) > MAX_HEIGHT_DIFFERENCE
        ) {
          // Adjust the building height to be within the allowed range
          buildingHeight =
            prevBuildingHeight +
            random(-MAX_HEIGHT_DIFFERENCE, MAX_HEIGHT_DIFFERENCE);
        }
      }

      buildings.push(buildingHeight);
    }

    // Ensure the buildings next to the gorillas are not too tall
    for (let gorilla of this.gorillas) {
      const gorillaBuildingIndex = floor(gorilla.x / 50);
      buildings[gorillaBuildingIndex] = Math.min(
        buildings[gorillaBuildingIndex],
        height - gorilla.y - MIN_CLEARANCE
      );
      if (gorillaBuildingIndex > 0) {
        buildings[gorillaBuildingIndex - 1] = Math.min(
          buildings[gorillaBuildingIndex - 1],
          height - gorilla.y - MIN_CLEARANCE
        );
      }
      if (gorillaBuildingIndex < numBuildings - 1) {
        buildings[gorillaBuildingIndex + 1] = Math.min(
          buildings[gorillaBuildingIndex + 1],
          height - gorilla.y - MIN_CLEARANCE
        );
      }
    }

    return buildings;
  }

  positionGorillas() {
    // Use a proportion of the canvas width instead of random pixel values
    const gorilla1X = CANVAS_WIDTH * random(0.0625, 0.4375); // 50 to half of the canvas width - 150
    const gorilla2X = CANVAS_WIDTH * random(0.5625, 0.9375); // Half of the canvas width + 100 to canvas width - 100

    // Calculate the building index based on the gorilla's X position
    const buildingIndex1 = floor(gorilla1X / 50);
    const buildingIndex2 = floor(gorilla2X / 50);

    // Assuming the height of each building is stored in this.cityscape array
    const gorilla1Y =
      CANVAS_HEIGHT - this.cityscape[buildingIndex1];
    const gorilla2Y =
      CANVAS_HEIGHT - this.cityscape[buildingIndex2];

    const gorilla1Position = {
      x: gorilla1X,
      y: gorilla1Y,
    };

    const gorilla2Position = {
      x: gorilla2X,
      y: gorilla2Y,
    };

    return [gorilla1Position, gorilla2Position];
}


  generateWind() {
    return random(-5, 5); // Random wind speed between -5 and 5
  }

  switchPlayer() {
    this.currentPlayer = 1 - this.currentPlayer;
    this.updateGameState(); // Update game state on Firebase
  }

  getNextPosition(xPos, yPos, velocityX, velocityY, time) {
    const g = 0.0981;
    xPos += velocityX + this.wind;
    yPos -= velocityY - 0.5 * g * time * time;
    return { x: xPos, y: yPos };
  }

  checkCollision(x, y) {
    const buildingIndex = floor(x / 50);

    if (y > height - this.cityscape[buildingIndex]) {
      console.log('Collision with building:', buildingIndex);
      return { type: 'building', index: buildingIndex };
    }

    for (let i = 0; i < this.gorillas.length; i++) {
      const gorilla = this.gorillas[i];
      const distance = dist(x, y, gorilla.x, gorilla.y);

      if (distance < COLLISION_DISTANCE) {
        // Increase this value as needed
        console.log('Collision with gorilla at:', gorilla.x, gorilla.y);
        return { type: 'gorilla', player: i };
      }
    }

    return false;
  }

  play() {
    // ... logic ...
  }

  endGame(winningPlayer) {
    this.gameState = GAME_STATES.GAME_OVER; // Set game state to game over when the game ends
    console.log(`Player ${winningPlayer + 1} wins this round!`);
    this.winner = winningPlayer
    if (this.iamPlayer === winningPlayer) {
      this.saveGameEndData(winningPlayer);
    }
  }

  saveGameEndData(winningPlayer) {
    this.totalWins[winningPlayer]++;
    this.updateGameState();
  }

  resetGame(bypassUpdatingDb) {
    this.hitPosition = null;
    this.cityscape = this.generateCityscape();
    this.gorillas = this.positionGorillas();
    this.wind = this.generateWind();
    this.currentPlayer = 0;
    this.gameState = GAME_STATES.PLAYING;

    if (!bypassUpdatingDb) {
      this.updateGameState(); // Update game state on Firebase
    }
  }

  updateGameState() {
    const gameState = this.getGameState();
    window.writeGameState(gameState);
  }

  getGameState() {
    const gameState = {
      player1: this.player1,
      player2: this.player2,
      numGames: this.numGames,
      totalWins: this.totalWins,
      currentPlayer: this.currentPlayer,
      cityscape: this.cityscape,
      gorillas: this.gorillas,
      wind: this.wind,
      hitPosition: this.hitPosition || null,
      gameId: this.gameId,
      lastTurn: this.lastTurn || null,
      winner: this.winner,
      gameState: this.gameState,
    };
    return gameState;
  }

  loadFromState(gameState) {
    this.player1 = gameState.player1;
    this.player2 = gameState.player2;
    this.numGames = gameState.numGames;
    this.totalWins = gameState.totalWins;
    this.currentPlayer = gameState.currentPlayer;
    this.cityscape = gameState.cityscape;
    this.gorillas = gameState.gorillas;
    this.wind = gameState.wind;
    this.hitPosition = gameState.hitPosition;
    this.gameId = gameState.gameId;
    this.lastTurn = gameState.lastTurn;
  }

  saveTurnData(angle, velocity, startX, startY, hitResult) {
    let lastTurnPlayer = (this.currentPlayer + 1) % 2;

    this.lastTurn = {
      angle: angle,
      velocity: velocity,
      startX: startX,
      startY: startY,
      hitResult: hitResult, // Includes collision details if any
      playerIndex: lastTurnPlayer,
    };

    this.updateGameState();
  }

  isNewTurn(gameState) {
    // Check if there's a last known state to compare against
    if (this.lastKnownState) {
      const isNewTurnForPlayer =
        this.lastKnownState.currentPlayer !== gameState.currentPlayer;

      this.lastKnownState = gameState; // Update the last known state
      return isNewTurnForPlayer;
    }

    // If there's no last known state, consider it a new turn
    this.lastKnownState = gameState;
    return true;
  }

  handleGameStateChange(gameState) {
    this.loadFromState(gameState);
    let opponentJustWon = false;

    if (
      gameState.gameState === GAME_STATES.GAME_OVER &&
      gameState.winner !== undefined &&
      gameState.winner !== this.iamPlayer
    ) {
      opponentJustWon = true;
    }

    if (opponentJustWon) {
      // Trigger the win popup on the other player's browser
      this.controller.endGame(gameState.winner);
    }

    let isFirstTurn = false;

    if (!gameState.lastTurn) {
      // this the first turn of a new game
      isFirstTurn = true;
    }

    let newCurrentPlayer = (this.currentPlayer + 1) % 2;

    if (
      this.isNewTurn(gameState) &&
      newCurrentPlayer !== this.iamPlayer &&
      !isFirstTurn
    ) {
      // show an alert that the opponent
      // did another turn and now they can watch the replay
      this.view.notifyTurn();
    }
  }

  getCurrentPlayerName() {
    return this.currentPlayer === 0 ? this.player1 : this.player2;
  }

  getLastPlayerName() {
    return this.currentPlayer === 0 ? this.player2 : this.player1;
  }
}
