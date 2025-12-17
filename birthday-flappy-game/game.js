const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

let birdY = 300;
let birdX = 50;
let velocity = 0;
let gravity = 0.6;
let gameRunning = false;
let score = 0;
let pillars = [];
let pillarSpeed = 2;
let pillarGap = 200;
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
    const birdRadius = 25;
    const birdLeft = birdX - birdRadius;
    const birdRight = birdX + birdRadius;
    const birdTop = birdY - birdRadius;
    const birdBottom = birdY + birdRadius;
    
    // Check if bird horizontally overlaps with pillar
    const horizontalOverlap = birdRight > pillar.x && birdLeft < pillar.x + pillarWidth;
    
    if (horizontalOverlap) {
      // Check if bird touches top pillar (bird bottom is below top pillar bottom)
      const touchesTopPillar = birdBottom > 0 && birdTop < pillar.topHeight;
      
      // Check if bird touches bottom pillar (bird top is above bottom pillar top)
      const touchesBottomPillar = birdTop < canvas.height && birdBottom > pillar.bottomY;
      
      if (touchesTopPillar || touchesBottomPillar) {
        endGame();
        return;
      }
    }

    // Score point
    if (!pillar.passed && birdX > pillar.x + pillarWidth) {
      pillar.passed = true;
      score++;
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

document.addEventListener("click", () => {
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
  startGame();
}
