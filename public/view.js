let bananaImage;
let gorillaImageBeforeThrow;
let originalCityTexture; // Store the unaltered city texture
let skyTexture;

function preload() {
  bananaImage = loadImage('images/banana.png', (img) => {
    img.resize(IMAGE_WIDTHS.BANANA, 0);
  });

  gorillaImageBeforeThrow = loadImage('images/gorilla-before-throw.png');

  cityTexture = loadImage('images/city-buildings.jpg', (img) => {
    originalCityTexture = img.get();
  });

  skyTexture = loadImage('images/sky.jpg');
}

class GorillasView {
  constructor(game) {
    this.game = game;
    game.view = this;

    // Define the textures as properties of the class
    this.bananaImage = bananaImage;
    this.gorillaImageBeforeThrow = gorillaImageBeforeThrow;
    this.originalCityTexture = originalCityTexture;
    this.skyTexture = skyTexture;

    this.maskGraphics = createGraphics(width, height);
    this.cityGraphics = createGraphics(width, height);
    this.pastHitsGraphics = createGraphics(width, height);
    this.explosions = [];

    // Removed 'this' as it's not the correct context in preload
    this.gorillaWidth = IMAGE_WIDTHS.GORILLA;
    this.gorillaHeight =
      (gorillaImageBeforeThrow.height / gorillaImageBeforeThrow.width) *
      this.gorillaWidth;

    this.bananaWidth = IMAGE_WIDTHS.BANANA;
    this.bananaHeight =
      (bananaImage.height / bananaImage.width) * this.bananaWidth;

    this.lastFrameTime = Date.now();

    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const animate = () => {
      this.renderExplosions();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  drawSky() {
    for (let x = 0; x < width; x += skyTexture.width) {
      for (let y = 0; y < height; y += skyTexture.height) {
        image(skyTexture, x, y);
      }
    }
  }

  drawCityscape() {
    this.createBuildingMask(); // Recreate the building mask for new building heights
    this.applyCityTexture(); // Apply the new mask and texture
    this.drawBuildingOutlines(); // Draw the outlines over the textured buildings
  }

  createBuildingMask() {
    this.maskGraphics.clear();
    this.maskGraphics.fill(255); // Use white fill to create the mask
    this.maskGraphics.noStroke();

    // Create the mask based on current building heights
    this.game.cityscape.forEach((buildingHeight, i) => {
      this.maskGraphics.rect(
        i * BUILDING_WIDTH,
        height - buildingHeight,
        BUILDING_WIDTH,
        buildingHeight
      );
    });
  }

  drawBuildingOutlines() {
    stroke(0);
    strokeWeight(3);
    noFill();
    this.game.cityscape.forEach((buildingHeight, i) => {
      const [x1, y1, x2, y2] = [
        i * BUILDING_WIDTH,
        height,
        (i + 1) * BUILDING_WIDTH,
        height - buildingHeight,
      ];
      beginShape();
      vertex(x1, y1);
      vertex(x1, y2);
      vertex(x2, y2);
      vertex(x2, y1);
      endShape(CLOSE);
    });
  }

  applyCityTexture() {
    this.cityGraphics.clear();

    // Make a copy of the original city texture to apply the mask to
    let maskedTexture = originalCityTexture.get(); // .get() creates a copy of the image
    maskedTexture.mask(this.maskGraphics); // Apply the mask to the copy

    // Draw the masked texture onto the city graphics
    this.cityGraphics.image(maskedTexture, 0, 0, width, height);

    // Draw the city graphics onto the main canvas
    image(this.cityGraphics, 0, 0);
  }

  drawGorillas() {
    const currentPlayerIndex = this.game.currentPlayer;
    this.game.gorillas.forEach((gorilla, index) => {
      // Check if the gorilla is the non-current player
      if (index !== currentPlayerIndex) {
        // Apply reduced opacity for the non-current player's gorilla
        push(); // Start a new drawing state
        tint(255, 127); // Apply 50% opacity (255 is fully opaque, 0 is fully transparent)
      }

      // Draw the gorilla
      image(
        this.gorillaImageBeforeThrow,
        gorilla.x - this.gorillaWidth / 2,
        gorilla.y - this.gorillaHeight,
        this.gorillaWidth,
        this.gorillaHeight
      );

      if (index !== currentPlayerIndex) {
        pop(); // Restore original drawing state
      }
    });
  }

  drawBanana(x, y) {
    image(
      bananaImage,
      x - this.bananaWidth / 2,
      y - this.bananaHeight / 2,
      this.bananaWidth,
      this.bananaHeight
    );
  }
  async drawBananaTrajectory(startX, startY, angle, velocity) {
    return new Promise((resolve) => {
      this.animateTrajectory(
        startX,
        startY,
        angle,
        velocity,
        this.game.wind,
        false,
        (hit) => {
          resolve({ hit, position: { x: startX, y: startY } });
        },
        this.game.currentPlayer
      );
    });
  }

  isPlayerOnLeft(playerIndex) {
    const gorilla = this.game.gorillas[playerIndex];
    return gorilla.x < CANVAS_WIDTH / 2; // Assuming 'width' is the width of your canvas
  }

  animateTrajectory(
    startX,
    startY,
    angle,
    velocity,
    wind,
    isPreview = false,
    onCollision = null,
    playerIndex
  ) {
    const g = 0.0981;

    const adjustedStartX = startX + this.gorillaWidth / 2;
    const adjustedStartY = startY - this.gorillaHeight / 2;

    const trajectory = computeTrajectory(
      playerIndex,
      adjustedStartX,
      adjustedStartY,
      angle,
      velocity,
      wind,
      g
    );

    if (isPreview) {
      // Draw the entire trajectory for preview
      stroke(COLORS.TRAJECTORY);
      noFill();
      beginShape();
      for (let point of trajectory) {
        vertex(point.x, point.y);
      }
      endShape();
    } else {
      let trajectoryIndex = 0;
      let rotationAngle = 0;

      const frameDuration = 1000 / FRAME_RATE;

      const animateFrame = () => {
        const now = Date.now();
        const timeSinceLastFrame = now - this.lastFrameTime;

        // Limit the frame rate on fast devices
        if (timeSinceLastFrame < frameDuration) {
          requestAnimationFrame(animateFrame);
          return;
        }

        this.lastFrameTime = now - (timeSinceLastFrame % frameDuration);
        background(220);
        this.drawSky();
        this.drawCityscape();
        this.drawGorillas();

        // Draw planned trajectory if it's a preview
        if (isPreview && trajectoryIndex < trajectory.length) {
          this.drawPlannedTrajectoryPoint(trajectory[trajectoryIndex]);
        }

        if (trajectoryIndex < trajectory.length && !isPreview) {
          const position = trajectory[trajectoryIndex];

          push();
          translate(position.x, position.y);
          rotate(rotationAngle);

          // Draw the banana at the center of the rotation
          image(
            bananaImage,
            -this.bananaWidth / 2,
            -this.bananaHeight / 2,
            this.bananaWidth,
            this.bananaHeight
          );

          pop();

          rotationAngle += radians(ROTATION_ANGLE);

          // Collision detection after the specified delay
          if (frameCount > COLLISION_DETECTION_DELAY) {
            let hit = this.game.checkCollision(position.x, position.y);
            if (hit) {
              if (hit.type === 'gorilla' && hit.player === playerIndex) {
                // ignore the collision with the current player since it's a replay
                // TODO fix this so instead of ignoring collisions from the current
                // gorilla, it fixes the issue with immediate gorilla collisions
              } else {
                this.showExplosion(position.x, position.y);
                if (onCollision) {
                  onCollision(hit);
                }
                return; // Stop the animation loop upon collision
              }
            }
          }

          trajectoryIndex++;
          frameCount++; // Increment frame counter
          requestAnimationFrame(animateFrame);
        } else if (!isPreview) {
          // Handle end of trajectory without collision
          if (onCollision) {
            onCollision(null);
          }
        }
      };

      animateFrame();
    }
  }

  getBananaCollisionPoint(position) {
    return {
      x: position.x + this.bananaWidth / 2,
      y: position.y + this.bananaHeight / 2,
    };
  }

  // Helper method to draw a single point of the planned trajectory
  drawPlannedTrajectoryPoint(position) {
    fill(COLORS.TRAJECTORY);
    ellipse(position.x, position.y, 5);
  }

  animateBananaThrow(startX, startY, angle, velocity, playerIndex) {
    this.animateTrajectory(
      startX,
      startY,
      angle,
      velocity,
      this.game.wind,
      false,
      null,
      playerIndex
    );
  }

  animateReplay(lastTurnData) {
    const { startX, startY, angle, velocity, playerIndex } = lastTurnData;

    this.animateTrajectory(
      startX,
      startY,
      angle,
      velocity,
      this.game.wind,
      false,
      (hit) => {
        // Additional logic for after the replay
      },
      playerIndex
    );
  }

  drawPlannedTrajectory(startX, startY, angle, velocity) {
    const g = 0.0981;
    let pulseIndex = 0;
    const trajectory = computeTrajectory(
      this.game.currentPlayer,
      startX,
      startY,
      angle,
      velocity,
      this.game.wind,
      g
    );

    stroke(COLORS.TRAJECTORY);
    noFill();
    beginShape();
    for (let point of trajectory) {
      vertex(point.x, point.y);
    }
    endShape();

    // Animate the pulsating effect
    if (trajectory.length) {
      let pulsePoint = trajectory[pulseIndex];
      fill(COLORS.TRAJECTORY);
      ellipse(pulsePoint.x, pulsePoint.y, 5);
      pulseIndex = (pulseIndex + PULSE_SPEED) % trajectory.length;
    }
  }

  showExplosion(x, y) {
    const explosion = new Explosion(x, y);
    this.explosions.push(explosion);
    // Set a timeout to start fading the explosion after a certain amount of time
    setTimeout(() => {
      explosion.hide();
    }, 1000); // Adjust the time as needed

    // Draw a permanent mark on the pastHits graphics buffer
    this.pastHitsGraphics.push();
    this.pastHitsGraphics.fill(0, 0, 0, 150); // Black with some transparency
    this.pastHitsGraphics.noStroke();
    this.pastHitsGraphics.ellipse(x, y, 20); // You can adjust the size and color as needed
    this.pastHitsGraphics.pop();
  }

  renderExplosions() {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.update();
      explosion.render();
      if (explosion.finished) {
        this.explosions.splice(i, 1);
      }
    }
  }

  render() {
    background(220);

    this.drawSky();
    this.drawCityscape();
    this.drawGorillas();

    // Render the past hits
    image(this.pastHitsGraphics, 0, 0);

    // Initialize trajectory preview
    const angle = parseFloat(document.getElementById('angle-slider').value);
    const velocity = parseFloat(
      document.getElementById('velocity-slider').value
    );

    const currentPlayer = this.game.currentPlayer;
    const previousTurnPlayer = (currentPlayer + 1) % 2;
    this.renderScoreboard(currentPlayer, previousTurnPlayer);

    const gorillaPosition = this.game.gorillas[currentPlayer];

    // Adjust for the center of the gorilla
    const startX = gorillaPosition.x + this.gorillaWidth / 2;
    const startY = gorillaPosition.y - this.gorillaHeight / 2;

    if (this.shouldShowTrajectory) {
      this.drawPlannedTrajectory(startX, startY, angle, velocity);
    }

    if (this.game.gameState === GAME_STATES.GAME_OVER) {
      fill(0, 0, 0, 127); // Semi-transparent black
      rect(0, 0, width, height);
    }
  }

  toggleTrajectory() {
    this.shouldShowTrajectory = !this.shouldShowTrajectory;
    this.render();
  }

  renderScoreboard(currentPlayer, previousTurnPlayer) {
    // update the player names
    document.querySelector('#player-1 .player-label').textContent =
      this.game.player1;
    document.querySelector('#player-2 .player-label').textContent =
      this.game.player2;

    document
      .getElementById(`player-${currentPlayer + 1}`)
      .classList.add('current-player');
    document
      .getElementById(`player-${previousTurnPlayer + 1}`)
      .classList.remove('current-player');

    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');

    if (
      player1ScoreElement &&
      player2ScoreElement &&
      this.game &&
      this.game.totalWins
    ) {
      player1ScoreElement.textContent = this.game.totalWins[0];
      player2ScoreElement.textContent = this.game.totalWins[1];
    }
  }

  nextGame() {
    this.maskGraphics.clear();
    this.cityGraphics.clear();
    this.pastHitsGraphics.clear();
    this.hideGameEnd();
    this.render();
  }

  notifyTurn() {
    const notificationElement = document.getElementById('turn-notification');
    const replayButtons = document.querySelectorAll('.replay-last-turn');

    // const currentPlayerName = this.game.getCurrentPlayerName();
    const lastTurnPlayerName = this.game.getLastPlayerName();

    // do things to each replayButton
    for (let i = 0; i < replayButtons.length; i++) {
      const replayButton = replayButtons[i];
      replayButton.textContent = `Replay ${lastTurnPlayerName}'s turn`;
    }

    if (this.game.gameState !== GAME_STATES.GAME_OVER) {
      notificationElement.classList.remove('hidden');
      notificationElement.classList.add('visible');
    }
  }

  hideNotifyTurn() {
    const notificationElement = document.getElementById('turn-notification');
    notificationElement.classList.remove('visible');
    notificationElement.classList.add('hidden');
  }

  // Update the angle value display
  updateAngleValue(value) {
    document.getElementById('angle-value').textContent = value;
  }

  // Update the velocity value display
  updateVelocityValue(value) {
    document.getElementById('velocity-value').textContent = value;
  }

  showGameEnd() {
    let winTextElement = document.getElementById('win-text');
    // Handle gorilla collision
    winTextElement.textContent = `${this.game.getCurrentPlayerName()} wins this round!`;
    // Show the win message
    document.getElementById('win-message').style.display = 'block';
    this.notifyTurn();
  }

  hideGameEnd() {
    document.getElementById('win-message').style.display = 'none';
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = 40;
    this.finished = false;
    this.transparency = 255; // Fully opaque
  }

  update() {
    if (this.radius < this.maxRadius) {
      this.radius += 2; // Increase the radius to expand the circle
    } else {
      this.transparency -= 5; // Decrease the transparency to fade the circle
      if (this.transparency <= 0) {
        this.finished = true; // The explosion is finished when it's fully transparent
      } else {
        view.render();
      }
    }
  }

  hide() {
    this.transparency = 0;
    this.update();
  }

  render() {
    push();
    fill(255, 0, 0, this.transparency);
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
    pop();
  }
}
