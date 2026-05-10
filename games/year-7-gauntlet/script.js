const introScreen = document.getElementById("introScreen");
const gameArea = document.getElementById("gameArea");
const hud = document.getElementById("hud");
const hint = document.getElementById("hint");
const mount = document.getElementById("phaseMount");
const showIntroAgain = document.getElementById("showIntroAgain");
const personalBestEl = document.getElementById("personalBest");
const letsGoBtn = document.getElementById("letsGoBtn");

const REACTION_ROUNDS = 5;
const TAP_MS = 520;
const MATH_N = 5;
const WORD_N = 5;

let totalScore = 0;
let reactionRound = 0;
let reactionState = "idle";
let reactionTimers = [null, null];
let mathRemaining = MATH_N;
let wordDeck = [];
let wordIndex = 0;

const WORD_ITEMS = [
  {
    prompt: 'Which spelling is correct?',
    options: [
      { text: 'definitely', correct: true },
      { text: 'definately', correct: false },
      { text: 'definatly', correct: false },
      { text: 'definitly', correct: false }
    ]
  },
  {
    prompt: 'Which spelling is correct?',
    options: [
      { text: 'separate', correct: true },
      { text: 'seperate', correct: false },
      { text: 'sepperate', correct: false },
      { text: 'separete', correct: false }
    ]
  },
  {
    prompt: 'Capital of Wales?',
    options: [
      { text: 'Cardiff', correct: true },
      { text: 'Swansea', correct: false },
      { text: 'Newport', correct: false },
      { text: 'Bangor', correct: false }
    ]
  },
  {
    prompt: 'Choose the synonym of “rapid”.',
    options: [
      { text: 'fast', correct: true },
      { text: 'lazy', correct: false },
      { text: 'noisy', correct: false },
      { text: 'tiny', correct: false }
    ]
  },
  {
    prompt: 'How many degrees in a triangle?',
    options: [
      { text: '180', correct: true },
      { text: '90', correct: false },
      { text: '360', correct: false },
      { text: '270', correct: false }
    ]
  },
  {
    prompt: 'Which spelling is correct?',
    options: [
      { text: 'necessary', correct: true },
      { text: 'neccessary', correct: false },
      { text: 'necesary', correct: false },
      { text: 'nessesary', correct: false }
    ]
  }
];

function renderPersonalBest() {
  if (!personalBestEl || !window.TAPlatform) return;
  const best = window.TAPlatform.getPersonalBest("Year 7 Gauntlet");
  personalBestEl.textContent = `Your best Gauntlet score: ${best}.`;
}

function clearTimers(ids) {
  ids.forEach((id) => {
    if (id) clearTimeout(id);
  });
}

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function finishGauntlet() {
  hud.textContent = `Finished! Gauntlet score: ${totalScore}`;
  hint.textContent = 'Great run — heading back to the hub earns XP and coins.';
  mount.innerHTML = "";
  const again = document.createElement("button");
  again.type = "button";
  again.className = "gold-btn";
  again.textContent = "Run gauntlet again";
  again.addEventListener("click", startFullRun);
  mount.appendChild(again);
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Year 7 Gauntlet", totalScore, 25 + Math.floor(totalScore / 3), 8 + Math.floor(totalScore / 12));
  }
  renderPersonalBest();
}

/* --- Reaction phase --- */
function startReactionPhase() {
  reactionRound = 0;
  reactionState = "idle";
  hud.textContent = `Phase 1: Reaction (${REACTION_ROUNDS} rounds)`;
  mount.innerHTML =
    `<button type="button" id="rxBtn" class="gold-btn gauntlet-action wait-phase" disabled>Get ready…</button>` +
    `<button type="button" id="rxStart" class="gold-btn">Begin phase 1</button>`;

  const actionBtn = document.getElementById("rxBtn");
  const startBtn = document.getElementById("rxStart");

  function nextRoundInternal() {
    if (reactionRound >= REACTION_ROUNDS) {
      reactionTimers.forEach((t) => {
        if (t) clearTimeout(t);
      });
      reactionTimers = [null, null];
      mount.innerHTML = "";
      startMathPhase();
      return;
    }
    reactionRound += 1;
    hint.textContent = "Wait… tap only after green!";
    reactionState = "wait";
    actionBtn.disabled = false;
    actionBtn.textContent = "Wait… do not tap yet";
    actionBtn.classList.add("wait-phase");
    actionBtn.classList.remove("tap-go");

    const delay = 550 + Math.random() * 1200;
    reactionTimers[0] = setTimeout(() => {
      if (reactionState !== "wait") return;
      reactionState = "tap";
      const tapStart = performance.now();
      actionBtn.actionTapStart = tapStart;
      actionBtn.textContent = "TAP NOW!";
      actionBtn.classList.remove("wait-phase");
      actionBtn.classList.add("tap-go");
      reactionTimers[1] = setTimeout(() => {
        if (reactionState !== "tap") return;
        reactionState = "idle";
        totalScore -= 2;
        hint.textContent = "Too slow — −2.";
        actionBtn.classList.remove("tap-go");
        actionBtn.disabled = true;
        setTimeout(() => nextRoundInternal(), 600);
      }, TAP_MS);
    }, delay);
  }

  actionBtn.addEventListener("click", () => {
    if (reactionState === "wait") {
      reactionTimers.forEach((t) => {
        if (t) clearTimeout(t);
      });
      reactionTimers = [null, null];
      totalScore -= 4;
      reactionState = "idle";
      hint.textContent = "Too early! −4";
      actionBtn.classList.remove("wait-phase", "tap-go");
      actionBtn.disabled = true;
      setTimeout(() => nextRoundInternal(), 700);
      return;
    }
    if (reactionState === "tap") {
      clearTimeout(reactionTimers[1]);
      reactionTimers[1] = null;
      const ms = performance.now() - actionBtn.actionTapStart;
      const speedBonus = Math.max(0, Math.min(10, Math.floor((TAP_MS - ms) / 38)));
      const gain = 6 + speedBonus;
      totalScore += gain;
      reactionState = "idle";
      hint.textContent = `Nice! +${gain}`;
      actionBtn.classList.remove("tap-go");
      actionBtn.disabled = true;
      setTimeout(() => nextRoundInternal(), 450);
    }
  });

  startBtn.addEventListener(
    "click",
    () => {
      startBtn.remove();
      nextRoundInternal();
    },
    { once: true }
  );
}

/* --- Maths phase --- */
function startMathPhase() {
  mathRemaining = MATH_N;
  hud.textContent = `Phase 2: Quick maths (${MATH_N} questions)`;
  mount.innerHTML = `<p id="mathQ" class="hint"></p><div id="mathOpts" class="gauntlet-choices"></div>`;
  showMathQuestion();
}

function showMathQuestion() {
  if (mathRemaining <= 0) {
    mount.innerHTML = "";
    startWordPhase();
    return;
  }
  const x = rnd(3, 12);
  const y = rnd(3, 12);
  const ans = x * y;
  const wrong = new Set();
  while (wrong.size < 3) {
    const d = ans + rnd(-10, 10);
    if (d !== ans && d > 0) wrong.add(d);
  }
  const opts = shuffle([ans, ...wrong]);
  hint.textContent = `Score running: ${totalScore}`;
  document.getElementById("mathQ").textContent = `${x} × ${y} = ?`;
  const box = document.getElementById("mathOpts");
  box.innerHTML = "";
  opts.forEach((n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gold-btn";
    b.textContent = String(n);
    b.addEventListener("click", () => {
      if (n === ans) totalScore += 12;
      else totalScore = Math.max(0, totalScore - 3);
      mathRemaining -= 1;
      showMathQuestion();
    });
    box.appendChild(b);
  });
}

/* --- Word phase --- */
function startWordPhase() {
  wordDeck = shuffle(WORD_ITEMS.slice());
  wordIndex = 0;
  hud.textContent = `Phase 3: Words & facts (${WORD_N})`;
  wordNext();
}

function wordNext() {
  if (wordIndex >= WORD_N || !wordDeck[wordIndex]) {
    finishGauntlet();
    return;
  }
  const item = wordDeck[wordIndex];
  wordIndex += 1;
  hint.textContent = `Score running: ${totalScore}`;
  const opts = shuffle(item.options.slice());
  mount.innerHTML = `<p id="wq" class="hint" style="min-height:2.8em;"></p><div id="wordOpts" class="gauntlet-choices"></div>`;
  document.getElementById("wq").textContent = item.prompt;
  const box = document.getElementById("wordOpts");
  opts.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gold-btn";
    b.textContent = o.text;
    b.addEventListener("click", () => {
      if (o.correct) totalScore += 10;
      else totalScore = Math.max(0, totalScore - 4);
      wordNext();
    });
    box.appendChild(b);
  });
}

function startFullRun() {
  clearTimers([reactionTimers[0], reactionTimers[1]]);
  reactionTimers = [null, null];
  reactionRound = 0;
  totalScore = 0;
  hud.textContent = "Year 7 Gauntlet";
  hint.textContent = "";
  renderPersonalBest();
  startReactionPhase();
}

function enterGameFromIntro() {
  introScreen.classList.add("hidden");
  gameArea.classList.remove("hidden");
  if (showIntroAgain) showIntroAgain.classList.remove("hidden");
  startFullRun();
}

letsGoBtn.addEventListener("click", enterGameFromIntro);

if (showIntroAgain) {
  showIntroAgain.addEventListener("click", () => {
    introScreen.classList.remove("hidden");
    gameArea.classList.add("hidden");
    showIntroAgain.classList.add("hidden");
    mount.innerHTML = "";
    clearTimers([reactionTimers[0], reactionTimers[1]]);
  });
}

if (window.TASkipIntro && window.TASkipIntro()) {
  enterGameFromIntro();
}
