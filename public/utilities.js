function computeTrajectory(currentPlayer, startX, startY, angle, power, wind, g) {
  let trajectory = [];
  let time = 0;
  let xPos = startX;
  let yPos = startY;
  currentPlayer = currentPlayer || 0;

  // Adjust angle based on the current player
  let adjustedAngle = currentPlayer === 0 ? angle : 180 - angle;
  const radianAngle = radians(adjustedAngle);

  const adjustedPower = adjustPower(power);

  const velocityX = adjustedPower * cos(radianAngle);
  const velocityY = adjustedPower * sin(radianAngle);

  while (yPos < height) {
    xPos += (velocityX + wind) * TIME_INCREMENT;
    yPos -= (velocityY - 0.5 * g * time * time) * TIME_INCREMENT;
    trajectory.push({ x: xPos, y: yPos });
    time += TIME_INCREMENT;

    // Safety check to ensure loop doesn't run forever
    if (time > MAX_TIME) break;
  }

  return trajectory;
}

function adjustPower(power) {
  const MIN_POWER = 1; // Minimum power value to avoid log(0)

  return Math.log(power + MIN_POWER) * POWER_SCALE;
}
