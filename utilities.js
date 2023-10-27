function computeTrajectory(game, startX, startY, angle, power, wind, g) {
  let trajectory = [];
  let time = 0;
  let xPos = startX;
  let yPos = startY;

  // Adjust angle based on the current player
  let adjustedAngle = game.currentPlayer === 0 ? angle : 180 - angle;
  const radianAngle = radians(adjustedAngle);

  const velocityX = POWER_FACTOR * power * cos(radianAngle);
  const velocityY = POWER_FACTOR * power * sin(radianAngle);

  while (yPos < height && yPos > 0) {
    xPos += (velocityX + wind) * TIME_INCREMENT;
    yPos -= (velocityY - 0.5 * g * time * time) * TIME_INCREMENT;
    trajectory.push({ x: xPos, y: yPos });
    time += TIME_INCREMENT;
  }

  return trajectory;
}
