let bananaImage;
let cityTexture;

function preload() {
  bananaImage = loadImage('images/banana.png', (img) => {
    img.resize(30, 0); // Resize to a width of 30 and auto-adjust height to maintain aspect ratio
  });
  gorillaImageBeforeThrow = loadImage('images/gorilla-before-throw.png', (img) => {
    img.resize(40, 0); // Resize to a width of 40 and auto-adjust height to maintain aspect ratio
  });
  cityTexture = loadImage('images/city-buildings.jpg', img => {
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
      img.pixels[i + 3] = img.pixels[i + 3] * 0.7; // Change 0.7 to desired transparency (0 is fully transparent, 1 is fully opaque)
    }
    img.updatePixels();
  });
}
class GorillasView {
  constructor(game) {
    this.game = game;
  }
  
  drawCityscape() {
    // Create an off-screen graphics buffer
    let maskGraphics = createGraphics(width, height);

    // Draw the buildings on the graphics buffer
    maskGraphics.fill(255);  // The mask uses grayscale. White means the texture will show, black means it will be hidden.
    maskGraphics.noStroke();
    for (let i = 0; i < this.game.cityscape.length; i++) {
      let buildingHeight = this.game.cityscape[i];
      maskGraphics.rect(i * 50, height - buildingHeight, 50, buildingHeight);
    }

    // Use the buffer as a mask for the cityTexture
    cityTexture.mask(maskGraphics);

    // Draw the masked cityTexture on the canvas
    image(cityTexture, 0, 0, width, height);

    // Draw the building outlines
    stroke(0);  // Black outline
    strokeWeight(3);  // Thicker outline
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
        this.drawCityscape();
        this.drawGorillas();

        if (trajectoryIndex < trajectory.length) {
          const position = trajectory[trajectoryIndex];

          push(); // Save current drawing settings
          translate(position.x, position.y); // Move the origin to the banana's current position
          rotate(rotationAngle); // Rotate the drawing around the new origin
          image(bananaImage, -bananaImage.width / 2, -bananaImage.height / 2); // Draw the banana centered around the new origin
          pop(); // Restore drawing settings

          rotationAngle += radians(10); // Increment the rotation angle

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
    push(); // Save the current drawing state
    fill(255, 0, 0);
    ellipse(x, y, 40, 40);
    pop(); // Restore the drawing state
  }

  render() {
    background(220);
    this.drawCityscape();
    this.drawGorillas();

    const angle = parseFloat(document.getElementById('angle-slider').value);
    const power = parseFloat(document.getElementById('power-slider').value);

    let imgWidth = 40; // This was the size you used for the gorilla image
    let imgHeight =
      (gorillaImageBeforeThrow.height / gorillaImageBeforeThrow.width) *
      imgWidth;

    // Adjust the starting coordinates to be the center of the gorilla
    const startX = this.game.gorillas[this.game.currentPlayer].x;
    const startY =
      this.game.gorillas[this.game.currentPlayer].y - imgHeight / 2;

    this.drawPlannedTrajectory(startX, startY, angle, power);
  }
}
