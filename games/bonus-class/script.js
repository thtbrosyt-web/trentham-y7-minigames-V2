const questionEl = document.getElementById("bonusQuestion");
const choicesEl = document.getElementById("bonusChoices");
const resultEl = document.getElementById("bonusResult");
const againBtn = document.getElementById("bonusAgain");
const personalBestEl = document.getElementById("personalBest");

const ROUNDS = [
  {
    q: "Which word means “very happy”?",
    opts: [
      { t: "Ecstatic", ok: true },
      { t: "Terrible", ok: false },
      { t: "Tiny", ok: false }
    ]
  },
  {
    q: "7 × 8 = ?",
    opts: [
      { t: "54", ok: false },
      { t: "56", ok: true },
      { t: "63", ok: false }
    ]
  },
  {
    q: "Capital city of Scotland?",
    opts: [
      { t: "Glasgow", ok: false },
      { t: "Edinburgh", ok: true },
      { t: "Dundee", ok: false }
    ]
  }
];

let score = 0;
let done = false;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderPersonalBest() {
  if (!personalBestEl || !window.TAPlatform) return;
  const best = window.TAPlatform.getPersonalBest("Bonus Class");
  personalBestEl.textContent = `Your best Bonus Class score: ${best}.`;
}

function finishRun() {
  done = true;
  choicesEl.innerHTML = "";
  resultEl.textContent = score >= 2 ? `Nice! Score ${score}/3 — bonus logged.` : `Score ${score}/3 — play again to beat your best.`;
  againBtn.classList.remove("hidden");
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Bonus Class", score, 8 + score * 4, 3 + score * 2);
  }
  renderPersonalBest();
}

function showRound(idx) {
  if (idx >= ROUNDS.length) {
    finishRun();
    return;
  }
  const r = ROUNDS[idx];
  questionEl.textContent = r.q;
  choicesEl.innerHTML = "";
  shuffle(r.opts).forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gold-btn";
    b.textContent = o.t;
    b.addEventListener("click", () => {
      if (done) return;
      if (o.ok) score += 1;
      showRound(idx + 1);
    });
    choicesEl.appendChild(b);
  });
}

function startRun() {
  score = 0;
  done = false;
  resultEl.textContent = "";
  againBtn.classList.add("hidden");
  showRound(0);
}

againBtn.addEventListener("click", startRun);

renderPersonalBest();
startRun();
