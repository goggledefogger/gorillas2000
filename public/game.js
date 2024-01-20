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
    const numBuildings = width / BUILDING_WIDTH;

    // Initial cityscape generation
    for (let i = 0; i < numBuildings; i++) {
      let buildingHeight = random(BUILDING_MIN_HEIGHT, BUILDING_MAX_HEIGHT);

      // Limit height difference with the previous building
      if (i > 0) {
        const prevBuildingHeight = buildings[i - 1];
        if (Math.abs(buildingHeight - prevBuildingHeight) > BUILDING_MAX_HEIGHT_DIFFERENCE) {
          buildingHeight = prevBuildingHeight + random(-BUILDING_MAX_HEIGHT_DIFFERENCE, BUILDING_MAX_HEIGHT_DIFFERENCE);
        }
      }

      buildings.push(buildingHeight);
    }

    return buildings;
  }

  adjustBuildingsForGorillas() {
    for (let gorilla of this.gorillas) {
      const gorillaBuildingIndex = floor(gorilla.x / BUILDING_WIDTH);
  
      // Calculate the maximum height for the building on which the gorilla is standing
      const maxGorillaBuildingHeight = CANVAS_HEIGHT - gorilla.y - this.view.gorillaHeight;
  
      // Adjust the height of the building on which the gorilla is standing
      // to be equal to or less than maxGorillaBuildingHeight
      this.cityscape[gorillaBuildingIndex] = Math.min(
        this.cityscape[gorillaBuildingIndex],
        maxGorillaBuildingHeight
      );
  
      // Adjust adjacent buildings
      if (gorillaBuildingIndex > 0) {
        this.cityscape[gorillaBuildingIndex - 1] = Math.min(
          this.cityscape[gorillaBuildingIndex - 1],
          maxGorillaBuildingHeight - BUILDING_MIN_CLEARANCE
        );
      }
      if (gorillaBuildingIndex < this.cityscape.length - 1) {
        this.cityscape[gorillaBuildingIndex + 1] = Math.min(
          this.cityscape[gorillaBuildingIndex + 1],
          maxGorillaBuildingHeight - BUILDING_MIN_CLEARANCE
        );
      }

      // reposition the gorilla with the new building height
      gorilla.y = CANVAS_HEIGHT - this.cityscape[gorillaBuildingIndex];
    }
  }  

  positionGorillas() {
    // Use a proportion of the canvas width instead of random pixel values
    const gorilla1X = CANVAS_WIDTH * random(0.0625, 0.4375);
    const gorilla2X = CANVAS_WIDTH * random(0.5625, 0.9375);
  
    // Calculate the building index based on the gorilla's X position
    const buildingIndex1 = floor(gorilla1X / BUILDING_WIDTH);
    const buildingIndex2 = floor(gorilla2X / BUILDING_WIDTH);
  
    // Adjust the Y position so that the gorilla sits on top of the building
    // Subtracting the height of the gorilla to align its bottom with the building top
    const gorilla1Y = (CANVAS_HEIGHT - this.cityscape[buildingIndex1]) - this.view.gorillaHeight;
    const gorilla2Y = (CANVAS_HEIGHT - this.cityscape[buildingIndex2]) - this.view.gorillaHeight;
  
    const gorilla1Position = { x: gorilla1X, y: gorilla1Y };
    const gorilla2Position = { x: gorilla2X, y: gorilla2Y };
  
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
    this.adjustBuildingsForGorillas(); // New method to adjust building heights
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
