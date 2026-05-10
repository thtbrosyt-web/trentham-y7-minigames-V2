const hud = document.getElementById("hud");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const startBtn = document.getElementById("startBtn");
const personalBestEl = document.getElementById("personalBest");
let score = 0;
let time = 22;
let answer = 0;
let timer = null;

function renderHud() {
  hud.textContent = `Time: ${time} | Score: ${score}`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextQuestion() {
  const a = rand(2, 16);
  const b = rand(2, 12);
  answer = a * b;
  questionEl.textContent = `${a} x ${b} = ?`;
  const opts = [answer, answer + rand(1, 4), answer - rand(1, 3), answer + rand(5, 7)];
  opts.sort(() => Math.random() - 0.5);
  answersEl.innerHTML = "";
  opts.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "gold-btn";
    btn.textContent = String(opt);
    btn.addEventListener("click", () => {
      score += opt === answer ? 10 : -5;
      nextQuestion();
      renderHud();
    });
    answersEl.appendChild(btn);
  });
}

function finish() {
  clearInterval(timer);
  timer = null;
  questionEl.textContent = `Round Over! Final score: ${score}`;
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Homework Rush", score, 20 + score / 4, 6 + score / 6);
  }
  renderPersonalBest();
}

startBtn.addEventListener("click", () => {
  score = 0;
  time = 22;
  renderHud();
  nextQuestion();
  clearInterval(timer);
  timer = setInterval(() => {
    time -= 1;
    renderHud();
    if (time <= 0) {
      finish();
    }
  }, 1000);
});

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Homework Rush");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

renderPersonalBest();
