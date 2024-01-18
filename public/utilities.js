function computeTrajectory(currentPlayer, startX, startY, angle, velocity, wind, g) {
  let trajectory = [];
  let time = 0;
  let xPos = startX;
  let yPos = startY;
  currentPlayer = currentPlayer || 0;

  // Adjust angle based on the current player
  let adjustedAngle = currentPlayer === 0 ? angle : 180 - angle;
  const radianAngle = radians(adjustedAngle);

  const adjustedVelocity = adjustVelocity(velocity);

  const velocityX = adjustedVelocity * cos(radianAngle);
  const velocityY = adjustedVelocity * sin(radianAngle);

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

function adjustVelocity(velocity) {
  const MIN_VELOCITY = 1; // Minimum velocity value to avoid log(0)

  return Math.log(velocity + MIN_VELOCITY) * VELOCITY_SCALE;
}
