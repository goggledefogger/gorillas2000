class GorillasView {
  constructor(game) {
    this.game = game;
  }

  drawCityscape() {
    for (let i = 0; i < this.game.cityscape.length; i++) {
      let buildingHeight = this.game.cityscape[i];
      rect(i * 50, height - buildingHeight, 50, buildingHeight);
    }
  }

  drawGorillas() {
    for (let gorilla of this.game.gorillas) {
      ellipse(gorilla.x, gorilla.y, 40, 40);
    }
  }

  drawBanana(x, y) {
    // ... logic ...
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
          ellipse(position.x, position.y, 5, 5); // Draw a small circle for the banana's position

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

    const trajectory = computeTrajectory(
      this.game,
      startX,
      startY,
      angle,
      power,
      this.game.wind,
      g
    );

    stroke(255, 0, 0); // Make the planned trajectory red
    for (let i = 0; i < trajectory.length - 1; i++) {
      line(
        trajectory[i].x,
        trajectory[i].y,
        trajectory[i + 1].x,
        trajectory[i + 1].y
      );
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
