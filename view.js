let bananaImage;
let cityTexture;

function preload() {
  bananaImage = loadImage('images/banana.png', (img) => {
    img.resize(30, 0); // Resize to a width of 30 and auto-adjust height to maintain aspect ratio
  });
  gorillaImageBeforeThrow = loadImage('images/gorilla-before-throw.png', (img) => {
    img.resize(40, 0); // Resize to a width of 40 and auto-adjust height to maintain aspect ratio
  });
  cityTexture = loadImage('images/city-buildings.jpg');
  skyTexture = loadImage('images/sky.jpg');
}
class GorillasView {
  constructor(game) {
    this.game = game;
    this.maskGraphics = createGraphics(width, height);
    this.cityGraphics = createGraphics(width, height);
    this.pastHitsGraphics = createGraphics(width, height);
    this.explosions = [];
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
    // Clear the previous content of the graphics buffer
    this.maskGraphics.clear();

    // Draw the buildings on the graphics buffer
    this.maskGraphics.fill(255);
    this.maskGraphics.noStroke();
    for (let i = 0; i < this.game.cityscape.length; i++) {
      let buildingHeight = this.game.cityscape[i];
      this.maskGraphics.rect(
        i * 50,
        height - buildingHeight,
        50,
        buildingHeight
      );
    }

    // Clear the previous content of the city graphics buffer
    this.cityGraphics.clear();

    // Apply the mask to the city texture and draw it on the city graphics buffer
    cityTexture.mask(this.maskGraphics);
    this.cityGraphics.image(cityTexture, 0, 0, width, height);

    // Draw the masked city graphics buffer on the canvas
    image(this.cityGraphics, 0, 0, width, height);

    // Draw the building outlines
    stroke(0);
    strokeWeight(3);
    noFill();
    for (let i = 0; i < this.game.cityscape.length; i++) {
      let buildingHeight = this.game.cityscape[i];
      beginShape();
      vertex(i * 50, height);
      vertex(i * 50, height - buildingHeight);
      vertex((i + 1) * 50, height - buildingHeight);
      vertex((i + 1) * 50, height);
      endShape(CLOSE);
    }
  }

  drawGorillas() {
    for (let i = 0; i < this.game.gorillas.length; i++) {
      let gorilla = this.game.gorillas[i];
      let imgWidth = IMAGE_WIDTHS.GORILLA;
      let imgHeight =
        (gorillaImageBeforeThrow.height / gorillaImageBeforeThrow.width) *
        imgWidth;

      image(
        gorillaImageBeforeThrow,
        gorilla.x - imgWidth / 2,
        gorilla.y - imgHeight,
        imgWidth,
        imgHeight
      );
    }
  }

  drawBanana(x, y) {
    // Adjust width based on your preference
    let newWidth = 15; // Adjust this value based on your desired width

    let aspectRatio = bananaImage.height / bananaImage.width;
    let newHeight = aspectRatio * newWidth;

    image(
      bananaImage,
      x - newWidth / 2,
      y - newHeight / 2,
      newWidth,
      newHeight
    );
  }

  async drawBananaTrajectory(startX, startY, angle, power) {
    return new Promise((resolve) => {
      const g = 0.0981;
      let imgWidth = IMAGE_WIDTHS.GORILLA;
      let imgHeight =
        (gorillaImageBeforeThrow.height / gorillaImageBeforeThrow.width) *
        imgWidth;

      // Adjust the starting coordinates to be the center of the gorilla
      startX = startX;
      startY = startY - imgHeight / 2;

      const trajectory = computeTrajectory(
        this.game,
        startX,
        startY,
        angle,
        power,
        this.game.wind,
        g
      );

      let trajectoryIndex = 0;
      let rotationAngle = 0; // Initialize rotation angle
      let hit = false;

      const animateThrow = () => {
        background(220);
        this.drawSky();
        this.drawCityscape();
        this.drawGorillas();

        if (trajectoryIndex < trajectory.length) {
          const position = trajectory[trajectoryIndex];

          push(); // Save current drawing settings
          translate(position.x, position.y); // Move the origin to the banana's current position
          rotate(rotationAngle); // Rotate the drawing around the new origin
          image(bananaImage, -bananaImage.width / 2, -bananaImage.height / 2); // Draw the banana centered around the new origin
          pop(); // Restore drawing settings

          rotationAngle += radians(ROTATION_ANGLE); // Increment the rotation angle

          // Check for collisions
          hit = this.game.checkCollision(position.x, position.y);
          if (hit) {
            this.showExplosion(position.x, position.y);
            resolve({ hit, position });
          } else {
            trajectoryIndex++;
            requestAnimationFrame(animateThrow);
          }
        } else {
          resolve(false);
        }
      };

      animateThrow();
    });
  }

  animateBananaThrow(startX, startY, angle, power) {
    // ... logic ...
  }

  drawPlannedTrajectory(startX, startY, angle, power) {
    const g = 0.0981;
    let pulseIndex = 0;
    const trajectory = computeTrajectory(
      this.game,
      startX,
      startY,
      angle,
      power,
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

    const angle = parseFloat(document.getElementById('angle-slider').value);
    const power = parseFloat(document.getElementById('power-slider').value);

    let imgWidth = IMAGE_WIDTHS.GORILLA;
    let imgHeight =
      (gorillaImageBeforeThrow.height / gorillaImageBeforeThrow.width) *
      imgWidth;

    // Adjust the starting coordinates to be the center of the gorilla
    const startX = this.game.gorillas[this.game.currentPlayer].x;
    const startY =
      this.game.gorillas[this.game.currentPlayer].y - imgHeight / 2;

    this.drawPlannedTrajectory(startX, startY, angle, power);

    if (this.game.gameState === GAME_STATES.GAME_OVER) {
      fill(0, 0, 0, 127); // Semi-transparent black
      rect(0, 0, width, height);
    }
  }

  nextGame() {
    this.maskGraphics.clear();
    this.cityGraphics.clear();
    this.pastHitsGraphics.clear();
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
