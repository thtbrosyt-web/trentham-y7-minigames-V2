const introScreen = document.getElementById("introScreen");
const gameScreen = document.getElementById("gameScreen");
const introTyped = document.getElementById("introTyped");
const enterGameBtn = document.getElementById("enterGameBtn");

const reactionZone = document.getElementById("reactionZone");
const zoneText = document.getElementById("zoneText");
const feedback = document.getElementById("feedback");
const lastTimeEl = document.getElementById("lastTime");
const bestTimeEl = document.getElementById("bestTime");
const scoreValueEl = document.getElementById("scoreValue");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const skipIntroBtn = document.getElementById("skipIntroBtn");
const platformLeaderboard = document.getElementById("platformLeaderboard");

const BEST_SCORE_KEY = "schoolReactionTrainerBestMs";
const PENALTY_POINTS = 8;

let gameState = "idle";
let waitTimeout = null;
let signalTimestamp = 0;
let score = 0;
let bestMs = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? "", 10);

if (!Number.isFinite(bestMs)) {
  bestMs = null;
}

updateBestScore();
renderScore();
renderPlatformLeaderboard();

function typeIntroMessage(text, delay = 36) {
  let idx = 0;

  function next() {
    introTyped.textContent = text.slice(0, idx);
    idx += 1;
    if (idx <= text.length) {
      setTimeout(next, delay);
    } else {
      enterGameBtn.classList.add("show");
      enterGameBtn.classList.remove("hidden");
    }
  }

  next();
}

function scheduleIntroTyping() {
  const msg = "Innovation is key. Train your reflexes every day.";
  if (document.documentElement.classList.contains("ta-reduce-motion")) {
    typeIntroMessage(msg);
    return;
  }
  let done = false;
  function go() {
    if (done) return;
    done = true;
    typeIntroMessage(msg);
  }
  const whiteEl = document.querySelector(".trace-white");
  const fallbackMs = 3200;
  const fallbackId = window.setTimeout(go, fallbackMs);
  if (whiteEl) {
    whiteEl.addEventListener("animationend", (e) => {
      if (e.animationName !== "revealWhite") return;
      window.clearTimeout(fallbackId);
      go();
    });
  }
}

if (window.TASkipIntro && window.TASkipIntro()) {
  introScreen.classList.remove("active");
  gameScreen.classList.add("active");
} else {
  scheduleIntroTyping();
}

enterGameBtn.addEventListener("click", () => {
  introScreen.classList.remove("active");
  gameScreen.classList.add("active");
});
skipIntroBtn.addEventListener("click", () => {
  introScreen.classList.remove("active");
  gameScreen.classList.add("active");
});

function updateBestScore() {
  bestTimeEl.textContent = bestMs ? `${bestMs} ms` : "-- ms";
}

function renderScore() {
  scoreValueEl.textContent = `${score}`;
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.classList.remove("good", "bad");
  if (type) {
    feedback.classList.add(type);
  }
}

function resetZoneState() {
  reactionZone.classList.remove("ready", "penalty");
  reactionZone.classList.add("waiting");
}

function beginRound() {
  if (gameState === "waiting" || gameState === "ready") {
    return;
  }

  gameState = "waiting";
  resetZoneState();
  zoneText.textContent = "Wait for the bell...";
  setFeedback("Stay focused. Do not click early.");

  const delay = Math.floor(Math.random() * 2600) + 1400;

  waitTimeout = window.setTimeout(() => {
    gameState = "ready";
    signalTimestamp = performance.now();
    reactionZone.classList.remove("waiting");
    reactionZone.classList.add("ready");
    zoneText.textContent = "BELL! TAP NOW!";
    setFeedback("Go! Go! Go!");
  }, delay);
}

function handleReaction() {
  if (gameState === "waiting") {
    if (waitTimeout) {
      clearTimeout(waitTimeout);
      waitTimeout = null;
    }
    gameState = "idle";
    score = Math.max(0, score - PENALTY_POINTS);
    renderScore();
    reactionZone.classList.remove("ready", "waiting");
    reactionZone.classList.add("penalty");
    zoneText.textContent = "Too Early!";
    setFeedback(`Too Early! -${PENALTY_POINTS} points`, "bad");
    return;
  }

  if (gameState === "ready") {
    const reactionMs = Math.round(performance.now() - signalTimestamp);
    lastTimeEl.textContent = `${reactionMs} ms`;

    let gained = Math.max(12, 320 - reactionMs);
    gained = Math.round(gained / 2);
    score += gained;
    renderScore();

    if (!bestMs || reactionMs < bestMs) {
      bestMs = reactionMs;
      localStorage.setItem(BEST_SCORE_KEY, `${bestMs}`);
      updateBestScore();
    }

    gameState = "idle";
    reactionZone.classList.remove("ready", "penalty");
    reactionZone.classList.add("waiting");
    zoneText.textContent = "Round complete";

    if (reactionMs <= 170) {
      setFeedback(`Perfect! ${reactionMs} ms (+${gained})`, "good");
    } else if (reactionMs <= 250) {
      setFeedback(`Great! ${reactionMs} ms (+${gained})`, "good");
    } else {
      setFeedback(`Good try! ${reactionMs} ms (+${gained})`);
    }
    return;
  }

  setFeedback("Press Start Round, then wait for the bell.");
}

function restartGame() {
  if (score > 0 && window.TAPlatform) {
    window.TAPlatform.submitScore("School Reaction Trainer", score, 10 + score / 10, 3 + score / 15);
    renderPlatformLeaderboard();
  }
  if (waitTimeout) {
    clearTimeout(waitTimeout);
    waitTimeout = null;
  }
  gameState = "idle";
  score = 0;
  renderScore();
  lastTimeEl.textContent = "-- ms";
  resetZoneState();
  zoneText.textContent = "Press Start to begin";
  setFeedback("Game reset. Ready when you are.");
}

function renderPlatformLeaderboard() {
  if (!platformLeaderboard || !window.TAPlatform) {
    return;
  }
  const best = window.TAPlatform.getPersonalBest("School Reaction Trainer");
  platformLeaderboard.textContent = `Your best score: ${best}. Beat it next time!`;
}

startBtn.addEventListener("click", beginRound);
restartBtn.addEventListener("click", restartGame);

reactionZone.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  handleReaction();
});
