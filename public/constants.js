const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const COLLISION_DISTANCE = 50;

const TIME_INCREMENT = 0.2; // Adjust this value to change the simulation speed
const VELOCITY_FACTOR = 0.5;
const VELOCITY_SCALE = 10; // Adjust this value to change the sensitivity
const MAX_TIME = 1000;
const PULSE_SPEED = 3; // Adjust for faster or slower pulsating

const ROTATION_ANGLE = 40;

const COLORS = {
  BUILDING: '#000000', // Black
  GORILLA: '#800080', // Purple
  GORILLA_2: '#32CD32', // Green
  TRAJECTORY: '#FF0000', // Red
  BANANA_FILL: '#DAA520', // Dark Yellow (Goldenrod)
  BANANA_STROKE: '#000000', // Black
  SKY: '#ADD8E6', // This is a light blue color
};
const IMAGE_WIDTHS = {
  GORILLA: 60,
  BANANA: 30,
};

const BUILDING_WIDTH = 50;
const BUILDING_MIN_HEIGHT = 100;
const BUILDING_MAX_HEIGHT_DIFFERENCE = 150;
const BUILDING_MIN_CLEARANCE = 50; // Minimum clearance above the gorilla for a clear throw
const BUILDING_MAX_HEIGHT = 325;

const COLLISION_DETECTION_DELAY = 5;
