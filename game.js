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
  }

  initializeRound() {
    this.cityscape = this.generateCityscape();
    this.gorillas = this.positionGorillas();
    this.wind = this.generateWind();
    this.currentPlayer = 0;
  }

  generateCityscape() {
    const buildings = [];
    const numBuildings = width / 50; // Assuming each building is 50 pixels wide

    for (let i = 0; i < numBuildings; i++) {
      buildings.push(random(100, 400)); // Random building height between 100 and 400 pixels
    }

    return buildings;
  }

  positionGorillas() {
    const gorilla1X = random(50, width / 2 - 50); // Place the first gorilla on the left half of the screen
    const gorilla2X = random(width / 2 + 50, width - 50); // Place the second gorilla on the right half of the screen

    const gorilla1Position = {
      x: gorilla1X,
      y: height - this.cityscape[floor(gorilla1X / 50)], // Get the top of the building as the y position
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
  }

  getNextPosition(xPos, yPos, velocityX, velocityY, time) {
    const g = 0.0981;
    xPos += velocityX + this.wind;
    yPos -= velocityY - 0.5 * g * time * time;
    return { x: xPos, y: yPos };
  }

  takeTurn(angle, power) {
    const g = 0.0981; // Gravity, reduced for the scale of our game
    let hit = false;
    let xPos = this.gorillas[this.currentPlayer].x;
    let yPos = this.gorillas[this.currentPlayer].y;

    // Offset the starting position slightly based on angle and power
    const radianAngle = radians(angle);
    xPos += 500 * cos(radianAngle); // You can adjust the offset value as needed
    yPos -= 500 * sin(radianAngle);

    const trajectory = computeTrajectory(
      this,
      xPos,
      yPos,
      angle,
      power,
      this.wind,
      g
    );

    for (let position of trajectory) {
      if (this.checkCollision(position.x, position.y)) {
        hit = true;
        this.hitPosition = { x: position.x, y: position.y };
        break;
      }
    }

    return hit;
  }

  checkCollision(x, y) {
    const buildingIndex = floor(x / 50);

    if (y > height - this.cityscape[buildingIndex]) {
      console.log('Collision with building:', buildingIndex);
      return true;
    }

    for (let i = 0; i < this.gorillas.length; i++) {
      if (i === this.currentPlayer) continue; // Skip checking collision with the current player's gorilla

      const gorilla = this.gorillas[i];
      const distance = dist(x, y, gorilla.x, gorilla.y);

      if (distance < 20) {
        console.log('Collision with gorilla at:', gorilla.x, gorilla.y);
        return true;
      }
    }

    return false;
  }

  play() {
    // ... logic ...
  }
}
