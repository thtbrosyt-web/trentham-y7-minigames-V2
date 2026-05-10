const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const personalBestEl = document.getElementById("personalBest");

const player = { x: 150, y: 485, w: 40, h: 20, speed: 7 };
const hazards = [];
let score = 0;
let over = false;
let spawnEvery = 65;
let frame = 0;
let moveLeft = false;
let moveRight = false;

function spawnHazard() {
  hazards.push({ x: Math.random() * (canvas.width - 26), y: -24, w: 26, h: 24, speed: 2 + score / 200 });
}

function update() {
  if (over) return;
  frame += 1;
  if (frame % Math.max(20, Math.floor(spawnEvery)) === 0) {
    spawnHazard();
    spawnEvery *= 0.996;
  }
  if (moveLeft) player.x -= player.speed;
  if (moveRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  hazards.forEach((h) => (h.y += h.speed));
  for (const h of hazards) {
    if (h.y + h.h > player.y && h.y < player.y + player.h && h.x < player.x + player.w && h.x + h.w > player.x) {
      finish();
    }
  }
  while (hazards.length && hazards[0].y > canvas.height + 30) hazards.shift();
  score += 1;
  hud.textContent = `Score: ${Math.floor(score / 6)}`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d1d1d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffe14f";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#ff5858";
  hazards.forEach((h) => ctx.fillRect(h.x, h.y, h.w, h.h));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function finish() {
  if (over) return;
  over = true;
  const finalScore = Math.floor(score / 6);
  hud.textContent = `Game Over! Score: ${finalScore}`;
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Hallway Dash", finalScore, 20 + finalScore / 2, 8 + finalScore / 3);
  }
  renderPersonalBest();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveLeft = true;
  if (e.key === "ArrowRight") moveRight = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") moveLeft = false;
  if (e.key === "ArrowRight") moveRight = false;
});
document.getElementById("leftBtn").addEventListener("pointerdown", () => (moveLeft = true));
document.getElementById("rightBtn").addEventListener("pointerdown", () => (moveRight = true));
document.getElementById("leftBtn").addEventListener("pointerup", () => (moveLeft = false));
document.getElementById("rightBtn").addEventListener("pointerup", () => (moveRight = false));
document.getElementById("leftBtn").addEventListener("pointercancel", () => (moveLeft = false));
document.getElementById("rightBtn").addEventListener("pointercancel", () => (moveRight = false));

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Hallway Dash");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

renderPersonalBest();
loop();
