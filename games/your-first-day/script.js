const introScreen = document.getElementById("intro-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const skipIntroButton = document.getElementById("skip-intro-button");
const introQuote = document.getElementById("intro-quote");
const logoSvg = document.querySelector(".logo-svg");

const characterName = document.getElementById("character-name");
const sceneText = document.getElementById("scene-text");
const choicesContainer = document.getElementById("choices");
const confidenceMeter = document.getElementById("confidence-meter");
const confidenceValue = document.getElementById("confidence-value");
const restartButton = document.getElementById("restart-button");
const platformLeaderboard = document.getElementById("platformLeaderboard");

const introLine = "Innovation is key. Courage turns first days into new beginnings.";
let introTypingIndex = 0;

const gameState = {
  currentSceneId: storyData.startScene,
  confidence: 50
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function typeIntroLine() {
  if (introTypingIndex <= introLine.length) {
    introQuote.textContent = introLine.slice(0, introTypingIndex);
    introTypingIndex += 1;
    setTimeout(typeIntroLine, 35);
  } else {
    startButton.hidden = false;
  }
}

function playIntro() {
  logoSvg.classList.add("trace-main");
  setTimeout(() => logoSvg.classList.add("trace-sub"), 2000);
  setTimeout(typeIntroLine, 3550);
}

function updateConfidenceUI() {
  confidenceMeter.style.width = `${gameState.confidence}%`;
  confidenceValue.textContent = `${gameState.confidence}`;
}

function resolveEndingId() {
  if (gameState.confidence >= 78) return "ending_shining";
  if (gameState.confidence >= 55) return "ending_balanced";
  if (gameState.confidence >= 35) return "ending_quiet";
  return "ending_reset";
}

function goToScene(sceneId) {
  const nextId = sceneId === "ending_router" ? resolveEndingId() : sceneId;
  const scene = storyData.scenes[nextId];

  if (!scene) {
    sceneText.textContent = "A scene could not be loaded.";
    choicesContainer.innerHTML = "";
    return;
  }

  gameState.currentSceneId = nextId;
  characterName.textContent = scene.speaker || "Narrator";
  sceneText.textContent = scene.text;
  choicesContainer.innerHTML = "";

  if (scene.ending) {
    if (window.TAPlatform) {
      const finalScore = gameState.confidence;
      window.TAPlatform.submitScore("Your First Day", finalScore, 15 + finalScore / 3, 6 + finalScore / 10);
      renderPlatformLeaderboard();
    }
    const playAgainButton = document.createElement("button");
    playAgainButton.className = "btn choice-btn";
    playAgainButton.textContent = "Play Again";
    playAgainButton.addEventListener("click", resetGame);
    choicesContainer.appendChild(playAgainButton);
    return;
  }

  scene.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "btn choice-btn";
    button.type = "button";
    button.textContent = choice.text;
    button.addEventListener("click", () => {
      gameState.confidence = clamp(gameState.confidence + (choice.confidence || 0), 0, 100);
      updateConfidenceUI();
      goToScene(choice.next);
    });
    choicesContainer.appendChild(button);
  });
}

function renderPlatformLeaderboard() {
  if (!platformLeaderboard || !window.TAPlatform) {
    return;
  }
  const best = window.TAPlatform.getPersonalBest("Your First Day");
  platformLeaderboard.textContent = `Your best score: ${best}. Beat it next time!`;
}

function startGame() {
  introScreen.classList.remove("active");
  gameScreen.classList.add("active");
  goToScene(gameState.currentSceneId);
}

function skipIntro() {
  startButton.hidden = false;
  introQuote.textContent = introLine;
  startGame();
}

function resetGame() {
  gameState.currentSceneId = storyData.startScene;
  gameState.confidence = 50;
  updateConfidenceUI();
  goToScene(gameState.currentSceneId);
}

startButton.addEventListener("click", startGame);
skipIntroButton.addEventListener("click", skipIntro);
restartButton.addEventListener("click", resetGame);

updateConfidenceUI();
renderPlatformLeaderboard();
if (window.TASkipIntro && window.TASkipIntro()) {
  skipIntro();
} else {
  playIntro();
}
