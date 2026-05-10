const introScreen = document.getElementById("introScreen");
const gameArea = document.getElementById("gameArea");
const letsGoBtn = document.getElementById("letsGoBtn");
const showIntroAgain = document.getElementById("showIntroAgain");
const hud = document.getElementById("hud");
const hint = document.getElementById("hint");
const actionBtn = document.getElementById("actionBtn");
const startBtn = document.getElementById("startBtn");
const personalBestEl = document.getElementById("personalBest");

const TOTAL_ROUNDS = 8;
const TAP_MS = 520;

let score = 0;
let roundNum = 0;
let phase = "idle";
let waitTimer = null;
let tapTimer = null;
let tapStart = 0;

function clearTimers() {
  if (waitTimer) {
    clearTimeout(waitTimer);
    waitTimer = null;
  }
  if (tapTimer) {
    clearTimeout(tapTimer);
    tapTimer = null;
  }
}

function renderHud() {
  hud.textContent = `Round ${roundNum} / ${TOTAL_ROUNDS} · Score: ${score}`;
}

function renderPersonalBest() {
  if (!personalBestEl || !window.TAPlatform) return;
  const best = window.TAPlatform.getPersonalBest("Bell Break");
  personalBestEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

function enterGameFromIntro() {
  introScreen.classList.add("hidden");
  gameArea.classList.remove("hidden");
  renderPersonalBest();
  if (showIntroAgain) showIntroAgain.classList.remove("hidden");
}

letsGoBtn.addEventListener("click", enterGameFromIntro);
showIntroAgain.addEventListener("click", () => {
  introScreen.classList.remove("hidden");
  gameArea.classList.add("hidden");
});

function finishGame() {
  clearTimers();
  phase = "idle";
  actionBtn.disabled = true;
  actionBtn.textContent = "Game over";
  actionBtn.classList.remove("tap-go", "wait-phase");
  startBtn.disabled = false;
  hint.textContent = `Finished! Final score: ${score}. Play again?`;
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("Bell Break", score, 14 + Math.floor(score / 3), 4 + Math.floor(score / 8));
  }
  renderPersonalBest();
  if (showIntroAgain) {
    showIntroAgain.classList.remove("hidden");
  }
}

function scheduleNextRound() {
  if (roundNum >= TOTAL_ROUNDS) {
    finishGame();
    return;
  }
  roundNum += 1;
  renderHud();
  phase = "wait";
  actionBtn.disabled = false;
  actionBtn.textContent = "Wait… do not tap yet";
  actionBtn.classList.add("wait-phase");
  actionBtn.classList.remove("tap-go");
  hint.textContent = "The bell will ring soon. Tap only after the button turns green.";

  const delay = 700 + Math.random() * 1600;
  waitTimer = setTimeout(() => {
    waitTimer = null;
    if (phase !== "wait") return;
    phase = "tap";
    tapStart = performance.now();
    actionBtn.textContent = "TAP NOW!";
    actionBtn.classList.remove("wait-phase");
    actionBtn.classList.add("tap-go");
    hint.textContent = "Go!";
    tapTimer = setTimeout(() => {
      tapTimer = null;
      if (phase !== "tap") return;
      phase = "wait";
      score -= 2;
      hint.textContent = "Too slow — the bell stopped ringing.";
      actionBtn.classList.remove("tap-go");
      actionBtn.disabled = true;
      setTimeout(scheduleNextRound, 650);
    }, TAP_MS);
  }, delay);
}

function onActionClick() {
  if (phase === "wait") {
    clearTimers();
    score -= 4;
    hint.textContent = "Too early! Wait for the green bell.";
    actionBtn.classList.remove("wait-phase", "tap-go");
    actionBtn.disabled = true;
    phase = "idle";
    setTimeout(scheduleNextRound, 700);
    renderHud();
    return;
  }
  if (phase === "tap") {
    clearTimers();
    const ms = performance.now() - tapStart;
    const speedBonus = Math.max(0, Math.min(12, Math.floor((TAP_MS - ms) / 35)));
    score += 8 + speedBonus;
    hint.textContent = `Nice! +${8 + speedBonus} (speed bonus ${speedBonus}).`;
    actionBtn.classList.remove("tap-go");
    actionBtn.disabled = true;
    phase = "idle";
    renderHud();
    setTimeout(scheduleNextRound, 450);
  }
}

actionBtn.addEventListener("click", onActionClick);

startBtn.addEventListener("click", () => {
  clearTimers();
  score = 0;
  roundNum = 0;
  phase = "idle";
  startBtn.disabled = true;
  actionBtn.disabled = false;
  hint.textContent = "Focus…";
  renderHud();
  scheduleNextRound();
});

if (window.TASkipIntro && window.TASkipIntro()) {
  enterGameFromIntro();
}
