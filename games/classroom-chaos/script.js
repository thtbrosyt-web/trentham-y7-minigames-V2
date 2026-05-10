const intro = document.getElementById("intro");
const game = document.getElementById("game");
const introTitle = document.getElementById("introTitle");
const introByline = document.getElementById("introByline");
const introQuote = document.getElementById("introQuote");
const skipIntroBtn = document.getElementById("skipIntroBtn");
const hud = document.getElementById("hud");
const classroom = document.getElementById("classroom");
const personalBestEl = document.getElementById("personalBest");

const types = [
  { name: "Spill", icon: "💧", ttl: 2200 },
  { name: "Flying paper", icon: "📄", ttl: 1800 },
  { name: "Phone ringing", icon: "📱", ttl: 2400 }
];

let score = 0;
let combo = 0;
let spawnMs = 1650;
let live = true;
let started = false;
const active = new Set();

function typeText(el, text, speed = 55) {
  let i = 0;
  const timer = setInterval(() => {
    el.textContent = text.slice(0, i);
    i += 1;
    if (i > text.length) clearInterval(timer);
  }, speed);
}

function runIntro() {
  introTitle.classList.add("trace");
  setTimeout(() => introByline.classList.add("trace"), 900);
  setTimeout(() => typeText(introQuote, "Innovation drives every solution."), 1800);
  setTimeout(() => {
    if (started) return;
    started = true;
    intro.classList.add("hidden");
    game.classList.remove("hidden");
    tickSpawn();
  }, 4200);
}

function skipIntro() {
  if (started) return;
  started = true;
  intro.classList.add("hidden");
  game.classList.remove("hidden");
  tickSpawn();
}

function renderHud() {
  hud.textContent = `Score: ${score} | Combo: x${Math.max(1, combo)}`;
}

function randomType() {
  return types[Math.floor(Math.random() * types.length)];
}

function spawnProblem() {
  if (!live) return;
  const kind = randomType();
  const btn = document.createElement("button");
  btn.className = "problem";
  btn.textContent = kind.icon;
  btn.title = kind.name;
  btn.style.left = `${Math.random() * 82}%`;
  btn.style.top = `${Math.random() * 80}%`;
  classroom.appendChild(btn);
  active.add(btn);

  const timeout = setTimeout(() => {
    if (!active.has(btn)) return;
    combo = 0;
    score = Math.max(0, score - 7);
    renderHud();
    active.delete(btn);
    btn.remove();
  }, kind.ttl);

  btn.addEventListener("pointerdown", () => {
    clearTimeout(timeout);
    score += 8 + combo * 2;
    combo += 1;
    renderHud();
    active.delete(btn);
    btn.remove();
  });
}

function tickSpawn() {
  const scheduler = setInterval(() => {
    if (!live) {
      clearInterval(scheduler);
      return;
    }
    spawnProblem();
    if (Math.random() > 0.65) spawnProblem();
    spawnMs = Math.max(500, spawnMs * 0.98);
  }, spawnMs);

  setTimeout(() => {
    live = false;
    clearInterval(scheduler);
    active.forEach((node) => node.remove());
    active.clear();
    if (window.TAPlatform) {
      window.TAPlatform.submitScore("Classroom Chaos", score, 24 + score / 5, 9 + score / 7);
    }
    hud.textContent = `Round complete! Final score: ${score}`;
    renderPersonalBest();
  }, 45000);
}

classroom.addEventListener("pointerdown", (event) => {
  if (event.target === classroom) {
    score = Math.max(0, score - 3);
    combo = 0;
    renderHud();
  }
});

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Classroom Chaos");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

renderPersonalBest();
skipIntroBtn.addEventListener("click", skipIntro);
if (window.TASkipIntro && window.TASkipIntro()) {
  skipIntro();
} else {
  runIntro();
}
