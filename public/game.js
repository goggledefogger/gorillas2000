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
  }

  initializeRound() {
    this.loadFromState(this.getGameState());
    this.resetGame(true);
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
    const gorilla1X = random(50, width / 2 - 150);
    const gorilla2X = random(width / 2 + 100, width - 100);

    const gorilla1Position = {
      x: gorilla1X,
      y: height - this.cityscape[floor(gorilla1X / 50)],
    };

    const gorilla2Position = {
      x: gorilla2X,
      y: height - this.cityscape[floor(gorilla2X / 50)],
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

  async takeTurn(angle, power) {
    const g = 0.0981; // Gravity, reduced for the scale of our game
    let xPos = this.gorillas[this.currentPlayer].x;
    let yPos = this.gorillas[this.currentPlayer].y;

    // Offset the starting position slightly based on angle and power
    const radianAngle = radians(angle);
    xPos += 500 * cos(radianAngle); // You can adjust the offset value as needed
    yPos -= 500 * sin(radianAngle);

    // Use the drawBananaTrajectory function to get the hit status
    const hit = await this.view.drawBananaTrajectory(xPos, yPos, angle, power);
    if (hit) {
      this.hitPosition = { x: xPos, y: yPos };
    }

    this.updateGameState(); // Update the game state on Firebase

    return hit;
  }

  checkCollision(x, y) {
    const buildingIndex = floor(x / 50);

    if (y > height - this.cityscape[buildingIndex]) {
      console.log('Collision with building:', buildingIndex);
      return { type: 'building', index: buildingIndex };
    }

    for (let i = 0; i < this.gorillas.length; i++) {
      // check if it's the current player gorilla and continue if so
      if (i === this.currentPlayer) continue;

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
    this.totalWins[winningPlayer]++;
    console.log(`Player ${winningPlayer + 1} wins this round!`);

    this.updateGameState(); // Update game state on Firebase
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
  }
}
