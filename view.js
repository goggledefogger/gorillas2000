let bananaImage;

function preload() {
  bananaImage = loadImage('/images/banana.png');
}
class GorillasView {
  constructor(game) {
    this.game = game;
  }

  drawCityscape() {
    fill(COLORS.BUILDING);
    stroke(COLORS.BUILDING);
    for (let i = 0; i < this.game.cityscape.length; i++) {
      let buildingHeight = this.game.cityscape[i];
      rect(i * 50, height - buildingHeight, 50, buildingHeight);
    }
  }

  drawGorillas() {
    for (let i = 0; i < this.game.gorillas.length; i++) {
      let gorilla = this.game.gorillas[i];
      fill(i === 0 ? COLORS.GORILLA : COLORS.GORILLA_2);
      ellipse(gorilla.x, gorilla.y, 40, 40);
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
      let hit = false;

      const animateThrow = () => {
        background(220); // Clear the canvas
        this.drawCityscape();
        this.drawGorillas();

        if (trajectoryIndex < trajectory.length) {
          const position = trajectory[trajectoryIndex];
          this.drawBanana(position.x, position.y); // Draw the banana at the current position (x, y

          // Check for collisions
          hit = this.game.checkCollision(position.x, position.y);
          if (hit) {
            this.showExplosion(position.x, position.y);
            resolve({ hit, position }); // Return the position of the hit
          } else {
            trajectoryIndex++;
            requestAnimationFrame(animateThrow);
          }
        } else {
          resolve(false);
        }
      };

      animateThrow(); // Start the animation loop
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
    background(220); // Clear the canvas first
    this.drawCityscape();
    this.drawGorillas();

    const angle = parseFloat(document.getElementById('angle-slider').value);
    const power = parseFloat(document.getElementById('power-slider').value);
    const startX = this.game.gorillas[this.game.currentPlayer].x;
    const startY = this.game.gorillas[this.game.currentPlayer].y;

    this.drawPlannedTrajectory(startX, startY, angle, power);
  }
}
