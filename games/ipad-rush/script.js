const intro = document.getElementById("intro");
const game = document.getElementById("game");
const introTitle = document.getElementById("introTitle");
const introByline = document.getElementById("introByline");
const introQuote = document.getElementById("introQuote");
const skipIntroBtn = document.getElementById("skipIntroBtn");
const hud = document.getElementById("hud");
const playField = document.getElementById("playField");
const personalBestEl = document.getElementById("personalBest");

let timeLeft = 30;
let score = 0;
let timer = null;
let spawnTimer = null;
let running = false;

function typeText(el, text, speed = 60) {
  let i = 0;
  const id = setInterval(() => {
    el.textContent = text.slice(0, i);
    i += 1;
    if (i > text.length) clearInterval(id);
  }, speed);
}

function updateHud() {
  hud.textContent = `Time: ${timeLeft} | Score: ${score}`;
}

function inChargeZone(x, y) {
  const zone = document.querySelector(".charge-zone").getBoundingClientRect();
  return x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom;
}

function spawnIpad() {
  const ipad = document.createElement("div");
  ipad.className = "ipad";
  ipad.textContent = "iPad";
  ipad.style.left = `${Math.random() * 68 + 2}%`;
  ipad.style.top = `${Math.random() * 70 + 4}%`;
  playField.appendChild(ipad);

  let dragging = false;
  let pointerId = null;
  let ox = 0;
  let oy = 0;

  ipad.addEventListener("pointerdown", (event) => {
    dragging = true;
    pointerId = event.pointerId;
    ipad.setPointerCapture(pointerId);
    const r = ipad.getBoundingClientRect();
    ox = event.clientX - r.left;
    oy = event.clientY - r.top;
  });
  ipad.addEventListener("pointermove", (event) => {
    if (!dragging || pointerId !== event.pointerId) return;
    const field = playField.getBoundingClientRect();
    ipad.style.left = `${event.clientX - field.left - ox}px`;
    ipad.style.top = `${event.clientY - field.top - oy}px`;
  });
  ipad.addEventListener("pointerup", (event) => {
    if (!dragging || pointerId !== event.pointerId) return;
    dragging = false;
    if (inChargeZone(event.clientX, event.clientY)) {
      score += 12;
      ipad.remove();
      updateHud();
    }
  });

  setTimeout(() => {
    if (ipad.isConnected) {
      ipad.remove();
      score = Math.max(0, score - 4);
      updateHud();
    }
  }, 2600);
}

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("iPad Rush");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

function endGame() {
  running = false;
  clearInterval(timer);
  clearInterval(spawnTimer);
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("iPad Rush", score, 18 + score / 5, 6 + score / 7);
  }
  renderPersonalBest();
  hud.textContent = `Round Over! Final score: ${score}`;
}

function startGame() {
  if (running) return;
  running = true;
  playField.innerHTML = `<div class="charge-zone">Charging Cart</div>`;
  timeLeft = 30;
  score = 0;
  updateHud();
  timer = setInterval(() => {
    timeLeft -= 1;
    updateHud();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
  spawnTimer = setInterval(spawnIpad, 900);
}

function showGame() {
  intro.classList.add("hidden");
  game.classList.remove("hidden");
  startGame();
}

function runIntro() {
  introTitle.classList.add("trace");
  setTimeout(() => introByline.classList.add("trace"), 1000);
  setTimeout(() => typeText(introQuote, "Fast hands. Charge every iPad before class!"), 2000);
  setTimeout(showGame, 4200);
}

skipIntroBtn.addEventListener("click", showGame);
renderPersonalBest();
if (window.TASkipIntro && window.TASkipIntro()) {
  showGame();
} else {
  runIntro();
}
