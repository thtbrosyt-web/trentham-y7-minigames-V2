const hud = document.getElementById("hud");
const hintEl = document.getElementById("hint");
const podsEl = document.getElementById("corridorPods");
const startBtn = document.getElementById("startBtn");
const personalBestEl = document.getElementById("personalBest");

const GAME_TITLE = "Corridor Signals";

const COLORS = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3"];
const labels = ["A", "B", "C", "D"];

let score = 0;
let sequence = [];
let playerStep = 0;
let playing = false;
let inputLocked = true;

function renderHud() {
  hud.textContent = `Score: ${score} · Pattern length: ${sequence.length}`;
}

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest(GAME_TITLE);
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

function buildPods() {
  podsEl.innerHTML = "";
  for (let i = 0; i < 4; i += 1) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "corridor-pod";
    b.style.background = COLORS[i];
    b.textContent = labels[i];
    b.dataset.idx = String(i);
    b.addEventListener("click", () => onPodTap(i));
    podsEl.appendChild(b);
  }
}

function lightPod(idx, ms) {
  const btn = podsEl.querySelector(`[data-idx="${idx}"]`);
  if (!btn) return;
  btn.classList.add("lit");
  setTimeout(() => btn.classList.remove("lit"), ms);
}

async function playSequence() {
  inputLocked = true;
  hintEl.textContent = "Watch the pods flash…";
  for (let i = 0; i < sequence.length; i += 1) {
    await new Promise((r) => setTimeout(r, 460));
    lightPod(sequence[i], 460);
    await new Promise((r) => setTimeout(r, 520));
  }
  hintEl.textContent = "Your turn — repeat the pattern.";
  inputLocked = false;
  playerStep = 0;
}

function onPodTap(idx) {
  if (inputLocked || !playing) return;
  if (idx !== sequence[playerStep]) {
    inputLocked = true;
    hintEl.textContent = "Wrong order! Round over.";
    playing = false;
    startBtn.disabled = false;
    const final = score;
    if (window.TAPlatform) {
      window.TAPlatform.submitScore(GAME_TITLE, final, 14 + final / 2, 4 + final / 6);
    }
    renderPersonalBest();
    return;
  }
  lightPod(idx, 200);
  playerStep += 1;
  score += 6;
  renderHud();
  if (playerStep >= sequence.length) {
    score += 10;
    renderHud();
    sequence.push(Math.floor(Math.random() * 4));
    inputLocked = true;
    setTimeout(playSequence, 620);
  }
}

startBtn.addEventListener("click", () => {
  playing = true;
  score = 0;
  sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
  playerStep = 0;
  startBtn.disabled = true;
  renderHud();
  playSequence();
});

buildPods();
renderPersonalBest();
