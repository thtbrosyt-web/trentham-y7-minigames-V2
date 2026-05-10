const hud = document.getElementById("hud");
const hintEl = document.getElementById("hint");
const answersEl = document.getElementById("answers");
const startBtn = document.getElementById("startBtn");
const personalBestEl = document.getElementById("personalBest");

const ROUNDS = 9;
const ITEMS = [
  { word: "necessary", def: "Needed; must happen", wrong: ["neccessary", "necesary", "necessery"] },
  { word: "separate", def: "Split apart", wrong: ["seperate", "separete", "seperete"] },
  { word: "environment", def: "The natural world around us", wrong: ["enviroment", "enviornment", "environmant"] },
  { word: "achievement", def: "Something done successfully", wrong: ["acheivement", "achievment", "acheivemant"] },
  { word: "committee", def: "Group meeting to decide things", wrong: ["comittee", "commitee", "comitee"] },
  { word: "definitely", def: "For sure", wrong: ["definately", "definitly", "definetly"] },
  { word: "recommend", def: "Suggest as a good choice", wrong: ["reccommend", "reccomend", "recomend"] },
  { word: "occurred", def: "happened", wrong: ["occured", "ocurred", "ocurred"] },
  { word: "parallel", def: "Lines same distance apart", wrong: ["parralel", "paralel", "parrallel"] },
  { word: "rhythm", def: "Pattern of beats in music", wrong: ["rythm", "rhymth", "rythem"] },
  { word: "variety", def: "Many different kinds", wrong: ["varity", "variey", "vaiety"] },
  { word: "temperature", def: "How hot or cold", wrong: ["temperture", "temparature", "temprature"] },
  { word: "appreciate", def: "Be thankful for", wrong: ["apreciate", "appreicate", "aprecciate"] },
  { word: "knowledge", def: "What you know and learn", wrong: ["knowlege", "knowladge", "knowlede"] },
  { word: "experiment", def: "A science test", wrong: ["expiriment", "experament", "expirement"] }
];

let round = 0;
let score = 0;
let active = false;

function renderHud() {
  hud.textContent = `Round ${Math.min(round + 1, ROUNDS)} / ${ROUNDS} · Score: ${score}`;
}

function renderPersonalBest() {
  if (!window.TAPlatform || !personalBestEl) return;
  const best = window.TAPlatform.getPersonalBest("Spell Sprint");
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

function nextRound() {
  if (round >= ROUNDS) {
    finish();
    return;
  }
  const item = ITEMS[round % ITEMS.length];
  hintEl.textContent = `Definition: ${item.def}`;
  const wrongOpts = shuffle([...item.wrong]).slice(0, 3);
  const opts = shuffle([item.word, ...wrongOpts]);
  answersEl.innerHTML = "";
  opts.forEach((w) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gold-btn";
    btn.textContent = w;
    btn.addEventListener("click", () => {
      if (!active) return;
      if (w === item.word) score += 12;
      else score = Math.max(0, score - 5);
      round += 1;
      renderHud();
      nextRound();
    });
    answersEl.appendChild(btn);
  });
}

function finish() {
  active = false;
  startBtn.disabled = false;
  hintEl.textContent = `Finished! Final score: ${score}`;
  answersEl.innerHTML = "";
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Spell Sprint", score, 16 + score / 3, 5 + score / 12);
  }
  renderPersonalBest();
}

startBtn.addEventListener("click", () => {
  round = 0;
  score = 0;
  active = true;
  startBtn.disabled = true;
  renderHud();
  nextRound();
});

renderPersonalBest();
