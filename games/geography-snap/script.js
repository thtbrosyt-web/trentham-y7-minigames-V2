const hud = document.getElementById("hud");
const gridEl = document.getElementById("grid");
const newBtn = document.getElementById("newBtn");
const personalBestEl = document.getElementById("personalBest");

const PAIRS = [
  { id: "l1", text: "London" },
  { id: "l1", text: "England capital" },
  { id: "e1", text: "Edinburgh" },
  { id: "e1", text: "Scotland capital" },
  { id: "c1", text: "Cardiff" },
  { id: "c1", text: "Wales capital" },
  { id: "b1", text: "Belfast" },
  { id: "b1", text: "N. Ireland capital" },
  { id: "m1", text: "Manchester" },
  { id: "m1", text: "NW England city" },
  { id: "j1", text: "River Thames" },
  { id: "j1", text: "Flows through London" }
];

let score = 0;
let flipped = [];
let lock = false;
let pairsLeft = 6;

function renderHud() {
  hud.textContent = `Pairs left: ${pairsLeft} · Score: ${score}`;
}

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Geography Snap");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGrid() {
  gridEl.innerHTML = "";
  /* Day-event: 4 pairs (8 cards) instead of full deck */
  const deck = shuffle(PAIRS.slice(0, 8).map((c, i) => ({ ...c, key: `${c.id}-${i}` })));
  pairsLeft = deck.length / 2;
  score = 0;
  flipped = [];
  lock = false;
  renderHud();
  deck.forEach((card) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "card face-down";
    el.dataset.pid = card.id;
    el.dataset.key = card.key;
    el.dataset.text = card.text;
    el.addEventListener("click", () => onPick(el));
    gridEl.appendChild(el);
  });
}

function onPick(el) {
  if (lock || el.classList.contains("matched") || !el.classList.contains("face-down")) return;

  el.classList.remove("face-down");
  el.textContent = el.dataset.text;
  flipped.push(el);
  if (flipped.length < 2) return;

  lock = true;
  const [a, b] = flipped;
  if (a.dataset.pid === b.dataset.pid) {
    a.classList.add("matched");
    b.classList.add("matched");
    pairsLeft -= 1;
    score += 24 + pairsLeft * 2;
    flipped = [];
    lock = false;
    renderHud();
    if (pairsLeft <= 0) {
      if (window.TAPlatform) {
        window.TAPlatform.submitScore("Geography Snap", score, 18 + score / 4, 5 + score / 12);
      }
      renderPersonalBest();
    }
    return;
  }

  setTimeout(() => {
    [a, b].forEach((n) => {
      n.classList.add("face-down");
      n.textContent = "";
    });
    score = Math.max(0, score - 6);
    flipped = [];
    lock = false;
    renderHud();
  }, 700);
}

newBtn.addEventListener("click", buildGrid);
buildGrid();
renderPersonalBest();
