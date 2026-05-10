const hud = document.getElementById("hud");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const startBtn = document.getElementById("startBtn");
const personalBestEl = document.getElementById("personalBest");

let timeLeft = 60;
let score = 0;
let correct = 0;
let timer = null;
let currentAnswer = 0;

function renderHud() {
  hud.textContent = `Time: ${timeLeft}s · Score: ${score}`;
}

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Times Table Rush");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function nextQuestion() {
  const x = rand(2, 12);
  const y = rand(2, 12);
  currentAnswer = x * y;
  questionEl.textContent = `${x} × ${y} = ?`;
  const wrong = new Set();
  while (wrong.size < 3) {
    const d = currentAnswer + rand(-8, 8);
    if (d !== currentAnswer && d > 0) wrong.add(d);
  }
  const opts = [currentAnswer, ...wrong];
  opts.sort(() => Math.random() - 0.5);
  answersEl.innerHTML = "";
  opts.forEach((n) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gold-btn";
    btn.textContent = String(n);
    btn.addEventListener("click", () => {
      if (timeLeft <= 0) return;
      if (n === currentAnswer) {
        score += 10;
        correct += 1;
      } else {
        score = Math.max(0, score - 4);
      }
      renderHud();
      nextQuestion();
    });
    answersEl.appendChild(btn);
  });
}

function endRun() {
  clearInterval(timer);
  timer = null;
  startBtn.disabled = false;
  questionEl.textContent = `Time up! Score: ${score} (${correct} correct)`;
  answersEl.innerHTML = "";
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Times Table Rush", score, 18 + score / 4, 5 + score / 10);
  }
  renderPersonalBest();
}

startBtn.addEventListener("click", () => {
  if (timer) return;
  score = 0;
  correct = 0;
  timeLeft = 60;
  startBtn.disabled = true;
  renderHud();
  nextQuestion();
  timer = setInterval(() => {
    timeLeft -= 1;
    renderHud();
    if (timeLeft <= 0) endRun();
  }, 1000);
});

renderPersonalBest();
