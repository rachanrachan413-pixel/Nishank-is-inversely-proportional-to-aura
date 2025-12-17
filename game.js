const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Base game dimensions
const BASE_WIDTH = 360;
const BASE_HEIGHT = 640;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

// Function to resize canvas for mobile
function resizeCanvas() {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  
  const scaleX = maxWidth / BASE_WIDTH;
  const scaleY = maxHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
  
  canvas.style.width = (BASE_WIDTH * scale) + 'px';
  canvas.style.height = (BASE_HEIGHT * scale) + 'px';
}

// Resize on load and window resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
  setTimeout(resizeCanvas, 100);
});

let birdY = 300;
let birdX = 50;
let velocity = 0;
let gravity = 0.6;
let gameRunning = false;
let score = 0;
let pillars = [];
let pillarSpeed = 2;
let basePillarSpeed = 2;
let pillarGap = 280;
let basePillarGap = 280;
let pillarWidth = 60;
let lastPillarTime = 0;
let pillarInterval = 2000; // milliseconds

// Load images
const birdImg = new Image();
birdImg.src = "assets/images/bird.png.png";

const pillarImg = new Image();
pillarImg.src = "assets/images/pillar.png.png";

const messages = [
  "Enthada aura minus madbed",
  "Enthada pettunata??",
  "ba delight cafe ge poyi"
];

const bounceSounds = [
  new Audio("assets/sounds/bounce1.mp3.mp3"),
  new Audio("assets/sounds/bounce2.mp3.mp3"),
  new Audio("assets/sounds/bounce3.mp3.mp3")
];

const bgm = new Audio("assets/sounds/bgm.mp3.mp3");
const retrySound = new Audio("assets/sounds/retry.mp3.mp3");

// Set volume for sounds
bgm.volume = 0.2; // 20% volume
bounceSounds.forEach(sound => sound.volume = 0.8); // 80% volume
retrySound.volume = 0.8; // 80% volume

// Function to stop all sounds except bounce1
function stopAllSoundsExceptBounce1() {
  bgm.pause();
  bgm.currentTime = 0;
  bounceSounds[1].pause(); // bounce2
  bounceSounds[1].currentTime = 0;
  bounceSounds[2].pause(); // bounce3
  bounceSounds[2].currentTime = 0;
  retrySound.pause();
  retrySound.currentTime = 0;
}

function updateDifficulty() {
  if (score >= 20) {
    // More harder at 20 points
    pillarSpeed = basePillarSpeed * 1.5; // 50% faster
    pillarGap = basePillarGap * 0.85; // 15% smaller gap
    pillarInterval = 1700; // Pillars spawn more frequently
  } else if (score >= 10) {
    // Little harder at 10 points
    pillarSpeed = basePillarSpeed * 1.25; // 25% faster
    pillarGap = basePillarGap * 0.92; // 8% smaller gap
    pillarInterval = 1850; // Pillars spawn slightly more frequently
  } else {
    // Normal difficulty
    pillarSpeed = basePillarSpeed;
    pillarGap = basePillarGap;
    pillarInterval = 2000;
  }
}

function startGame() {
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("retry").style.display = "none";
  
  // Reset game state
  birdY = 300;
  birdX = 50;
  velocity = 0;
  score = 0;
  pillars = [];
  lastPillarTime = Date.now();
  gameRunning = true;
  
  // Reset difficulty
  updateDifficulty();
  
  bgm.loop = true;
  bgm.play().catch(e => console.log("Audio play failed:", e));
  loop();
}

function createPillar() {
  const minHeight = 100;
  const maxHeight = canvas.height - pillarGap - minHeight;
  const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
  
  pillars.push({
    x: canvas.width,
    topHeight: topHeight,
    bottomY: topHeight + pillarGap,
    passed: false
  });
}

function loop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Create new pillars
  const now = Date.now();
  if (now - lastPillarTime > pillarInterval) {
    createPillar();
    lastPillarTime = now;
  }

  // Update bird physics
  velocity += gravity;
  birdY += velocity;

  // Draw and update pillars
  for (let i = pillars.length - 1; i >= 0; i--) {
    const pillar = pillars[i];
    pillar.x -= pillarSpeed;

    // Draw top pillar
    ctx.drawImage(
      pillarImg,
      pillar.x,
      0,
      pillarWidth,
      pillar.topHeight
    );

    // Draw bottom pillar
    ctx.drawImage(
      pillarImg,
      pillar.x,
      pillar.bottomY,
      pillarWidth,
      canvas.height - pillar.bottomY
    );

    // Check collision - bird is 50x50, so radius is 25
    // Use a slightly smaller collision radius for more forgiving collisions
    const birdRadius = 20;
    const birdLeft = birdX - birdRadius;
    const birdRight = birdX + birdRadius;
    const birdTop = birdY - birdRadius;
    const birdBottom = birdY + birdRadius;
    
    // Check if bird horizontally overlaps with pillar
    const horizontalOverlap = birdRight > pillar.x && birdLeft < pillar.x + pillarWidth;
    
    if (horizontalOverlap) {
      // The gap is the safe zone between top and bottom pillars
      // Gap goes from y=pillar.topHeight to y=pillar.bottomY
      // Bird is safe if it's completely within the gap
      const birdInGap = birdTop >= pillar.topHeight && birdBottom <= pillar.bottomY;
      
      // If bird is NOT in the gap, it must be touching a pillar
      if (!birdInGap) {
        // Check if bird is touching top pillar (y=0 to y=pillar.topHeight)
        const touchingTop = birdBottom > 0 && birdTop < pillar.topHeight;
        
        // Check if bird is touching bottom pillar (y=pillar.bottomY to y=canvas.height)
        const touchingBottom = birdTop < canvas.height && birdBottom > pillar.bottomY;
        
        // Only end game if bird is actually touching a pillar
        if (touchingTop || touchingBottom) {
          endGame();
          return;
        }
      }
    }

    // Score point
    if (!pillar.passed && birdX > pillar.x + pillarWidth) {
      pillar.passed = true;
      score++;
      updateDifficulty(); // Update difficulty when score increases
    }

    // Remove off-screen pillars
    if (pillar.x + pillarWidth < 0) {
      pillars.splice(i, 1);
    }
  }

  // Draw bird
  if (birdImg.complete) {
    ctx.drawImage(birdImg, birdX - 25, birdY - 25, 50, 50);
  } else {
    // Fallback circle if image not loaded
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(birdX, birdY, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw score
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 10, 30);

  // Check boundaries
  if (birdY > canvas.height || birdY < 0) {
    endGame();
    return;
  }

  requestAnimationFrame(loop);
}

// Function to handle jump
function handleJump() {
  if (!gameRunning) return;
  velocity = -8;
  const soundIndex = Math.floor(Math.random() * bounceSounds.length);
  const sound = bounceSounds[soundIndex];
  
  // If bounce1 is playing, stop all other sounds
  if (soundIndex === 0) {
    stopAllSoundsExceptBounce1();
    // Resume bgm after bounce1 finishes
    sound.addEventListener('ended', function resumeBGM() {
      if (gameRunning) {
        bgm.play().catch(e => console.log("Audio play failed:", e));
      }
      sound.removeEventListener('ended', resumeBGM);
    }, { once: true });
  }
  
  sound.currentTime = 0;
  sound.play().catch(e => console.log("Sound play failed:", e));
}

// Support both click and touch events for mobile
document.addEventListener("click", handleJump);
document.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent scrolling
  handleJump();
});

function endGame() {
  gameRunning = false;
  bgm.pause();
  retrySound.currentTime = 0;
  retrySound.play().catch(e => console.log("Retry sound play failed:", e));
  canvas.style.display = "none";
  document.getElementById("retry").style.display = "block";
  document.getElementById("message").innerText =
    messages[Math.floor(Math.random() * messages.length)];
}

function restartGame() {
  birdY = 300;
  birdX = 50;
  velocity = 0;
  score = 0;
  pillars = [];
  lastPillarTime = Date.now();
  document.getElementById("retry").style.display = "none";
  // Reset difficulty will be handled in startGame()
  startGame();
}
