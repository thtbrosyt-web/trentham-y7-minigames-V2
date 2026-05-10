const hud = document.getElementById("hud");
const qtextEl = document.getElementById("qtext");
const answersEl = document.getElementById("answers");
const startBtn = document.getElementById("startBtn");
const personalBestEl = document.getElementById("personalBest");

const BANK = [
  {
    q: "Which cell part controls what enters and leaves the cell?",
    a: "Cell membrane",
    w: ["Nucleus only", "Cytoplasm only", "Chloroplast only"]
  },
  {
    q: "Water freezing into ice is an example of which change?",
    a: "Change of state",
    w: ["Chemical reaction", "Photosynthesis", "Combustion"]
  },
  {
    q: "What do we call a push or a pull?",
    a: "A force",
    w: ["Friction only", "Weight only", "Speed"]
  },
  {
    q: "Which gas do plants take in for photosynthesis?",
    a: "Carbon dioxide",
    w: ["Oxygen", "Nitrogen", "Helium"]
  },
  {
    q: "The basic unit of life is a…",
    a: "Cell",
    w: ["Tissue", "Organ", "Atom"]
  },
  {
    q: "Which temperature scale uses water boiling at 100° (at sea level)?",
    a: "Celsius",
    w: ["Kelvin only name", "No scale does", "Fahrenheit always"]
  },
  {
    q: "Sound travels as…",
    a: "Vibrations",
    w: ["Only light", "Static electricity", "Photosynthesis"]
  },
  {
    q: "A mixture where you can see different parts (like sand in water) is often called…",
    a: "A heterogeneous mixture",
    w: ["An element", "A pure compound only", "Always a solution"]
  },
  {
    q: "The centre of an atom is called the…",
    a: "Nucleus",
    w: ["Electron shell whole", "Isotope only", "Molecule"]
  },
  {
    q: "Which organ pumps blood around the body?",
    a: "Heart",
    w: ["Lungs", "Liver", "Kidneys"]
  },
  {
    q: "Melting is when a solid turns into a…",
    a: "Liquid",
    w: ["Gas directly always", "Plasma only", "Mixture only"]
  },
  {
    q: "What tool measures temperature?",
    a: "Thermometer",
    w: ["Barometer", "Stopwatch", "Ruler"]
  }
];

const QUESTIONS_PER_RUN = 8;

let deck = [];
let idx = 0;
let score = 0;
let active = false;

function renderHud() {
  const n = deck.length || QUESTIONS_PER_RUN;
  hud.textContent = `Question ${Math.min(idx + 1, n)} / ${n} · Score: ${score}`;
}

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Science Snippets");
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

function showQuestion() {
  if (idx >= deck.length) {
    finish();
    return;
  }
  const item = deck[idx];
  qtextEl.textContent = item.q;
  const opts = shuffle([item.a, ...item.w]);
  answersEl.innerHTML = "";
  opts.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gold-btn";
    btn.textContent = t;
    btn.addEventListener("click", () => {
      if (!active) return;
      if (t === item.a) score += 14;
      else score = Math.max(0, score - 4);
      idx += 1;
      renderHud();
      showQuestion();
    });
    answersEl.appendChild(btn);
  });
}

function finish() {
  active = false;
  startBtn.disabled = false;
  qtextEl.textContent = `Quiz complete! Final score: ${score}`;
  answersEl.innerHTML = "";
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Science Snippets", score, 20 + score / 3, 6 + score / 15);
  }
  renderPersonalBest();
}

startBtn.addEventListener("click", () => {
  deck = shuffle([...BANK]).slice(0, QUESTIONS_PER_RUN);
  idx = 0;
  score = 0;
  active = true;
  startBtn.disabled = true;
  renderHud();
  showQuestion();
});

renderPersonalBest();
