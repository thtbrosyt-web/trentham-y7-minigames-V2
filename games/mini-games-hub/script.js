const scenes = document.querySelectorAll(".scene");
const menuButtons = document.querySelectorAll(".menu-btn");
const backButtons = document.querySelectorAll(".back-btn");

const introTitle = document.getElementById("intro-title");
const introSubtitle = document.getElementById("intro-subtitle");
const introQuote = document.getElementById("intro-quote");
const skipIntroBtn = document.getElementById("skip-intro-btn");
const hubScoreEl = document.getElementById("hub-score");
const platformLeaderboard = document.getElementById("personalBest");
let hubScore = 0;

const inspiringText = "Innovation is key!";

function switchScene(sceneId) {
  scenes.forEach((scene) => scene.classList.remove("active"));
  document.getElementById(sceneId).classList.add("active");
}

function typeText(element, text, speed = 55, callback) {
  element.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    element.textContent += text[i];
    i += 1;
    if (i >= text.length) {
      clearInterval(timer);
      if (callback) callback();
    }
  }, speed);
}

function runIntro() {
  introTitle.classList.add("animate-title");
  setTimeout(() => {
    introSubtitle.classList.add("animate-subtitle");
  }, 1800);
  setTimeout(() => {
    typeText(introQuote, inspiringText, 70);
  }, 3500);
  setTimeout(() => {
    switchScene("menu-scene");
  }, 6100);
}

function skipIntro() {
  switchScene("menu-scene");
}

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const map = {
      maths: "maths-scene",
      reaction: "reaction-scene",
      flag: "flag-scene",
      typing: "typing-scene"
    };
    switchScene(map[button.dataset.game]);

    if (button.dataset.game === "maths") loadMathsQuestion();
    if (button.dataset.game === "reaction") resetReaction();
    if (button.dataset.game === "flag") loadFlagQuestion();
    if (button.dataset.game === "typing") prepareTypingRound();
  });
});

backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (window.TAPlatform && hubScore > 0) {
      window.TAPlatform.submitScore("Mini Games Hub", hubScore, 12 + hubScore / 5, 4 + hubScore / 8);
      renderLeaderboard();
    }
    switchScene(button.dataset.target);
  });
});

// Maths Quiz
const mathsQuestionEl = document.getElementById("maths-question");
const mathsOptionsEl = document.getElementById("maths-options");
const mathsFeedbackEl = document.getElementById("maths-feedback");
const mathsNextBtn = document.getElementById("maths-next");

let mathsAnswer = null;
let mathsAnswered = 0;
const SESSION_HINT_EVERY = 5;

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function loadMathsQuestion() {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  const correct = a + b;
  mathsAnswer = correct;

  const options = shuffle([correct, correct + 1, correct + 2, correct - 1]);
  mathsQuestionEl.textContent = `What is ${a} + ${b}?`;
  mathsOptionsEl.innerHTML = "";
  mathsFeedbackEl.textContent = "";

  options.forEach((option) => {
    const optionBtn = document.createElement("button");
    optionBtn.textContent = String(option);
    optionBtn.addEventListener("click", () => {
      if (option === mathsAnswer) {
        mathsAnswered += 1;
        let hint =
          mathsAnswered >= SESSION_HINT_EVERY && mathsAnswered % SESSION_HINT_EVERY === 0
            ? ` (${mathsAnswered} solved — tap Back when you're ready to bank hub XP.)`
            : "";
        mathsFeedbackEl.textContent = `Correct!${hint}`;
        hubScore += 8;
      } else {
        mathsFeedbackEl.textContent = `Nope. Correct answer: ${mathsAnswer}`;
        hubScore = Math.max(0, hubScore - 3);
      }
      hubScoreEl.textContent = `Session Score: ${hubScore}`;
    });
    mathsOptionsEl.appendChild(optionBtn);
  });
}

mathsNextBtn.addEventListener("click", loadMathsQuestion);

// Tap Frenzy (replaces Reaction Game)
const reactionStartBtn = document.getElementById("reaction-start");
const reactionArea = document.getElementById("reaction-area");
const reactionResult = document.getElementById("reaction-result");

let frenzyTaps = 0;
let frenzyTimeLeft = 5;
let frenzyTimerId = null;
let frenzyActive = false;

function resetReaction() {
  clearInterval(frenzyTimerId);
  frenzyTaps = 0;
  frenzyTimeLeft = 5;
  frenzyActive = false;
  reactionArea.disabled = true;
  reactionArea.classList.remove("go");
  reactionArea.textContent = "Tap!";
  reactionResult.textContent = "Press start to begin a 5-second round.";
}

reactionStartBtn.addEventListener("click", () => {
  clearInterval(frenzyTimerId);
  frenzyTaps = 0;
  frenzyTimeLeft = 5;
  frenzyActive = true;

  reactionArea.disabled = false;
  reactionArea.classList.add("go");
  reactionArea.textContent = "TAP FAST!";
  reactionResult.textContent = `Time left: ${frenzyTimeLeft}s | Taps: ${frenzyTaps}`;

  frenzyTimerId = setInterval(() => {
    frenzyTimeLeft -= 1;
    if (frenzyTimeLeft > 0) {
      reactionResult.textContent = `Time left: ${frenzyTimeLeft}s | Taps: ${frenzyTaps}`;
      return;
    }

    clearInterval(frenzyTimerId);
    frenzyActive = false;
    reactionArea.disabled = true;
    reactionArea.classList.remove("go");
    reactionArea.textContent = "Round Over";
    reactionResult.textContent = `Final score: ${frenzyTaps} taps in 5 seconds.`;
    hubScore += frenzyTaps;
    hubScoreEl.textContent = `Session Score: ${hubScore}`;
  }, 1000);
});

reactionArea.addEventListener("click", () => {
  if (!frenzyActive) return;
  frenzyTaps += 1;
  reactionResult.textContent = `Time left: ${frenzyTimeLeft}s | Taps: ${frenzyTaps}`;
});

// Flag Quiz
const flagImage = document.getElementById("flag-image");
const flagOptionsEl = document.getElementById("flag-options");
const flagFeedbackEl = document.getElementById("flag-feedback");
const flagNextBtn = document.getElementById("flag-next");

const flagQuestions = [
  {
    country: "Japan",
    image: "https://flagcdn.com/w320/jp.png",
    options: ["Japan", "South Korea", "Bangladesh", "China"]
  },
  {
    country: "Brazil",
    image: "https://flagcdn.com/w320/br.png",
    options: ["Argentina", "Brazil", "Mexico", "Colombia"]
  },
  {
    country: "France",
    image: "https://flagcdn.com/w320/fr.png",
    options: ["Italy", "Netherlands", "France", "Russia"]
  },
  {
    country: "Germany",
    image: "https://flagcdn.com/w320/de.png",
    options: ["Belgium", "Germany", "Spain", "Poland"]
  },
  {
    country: "Canada",
    image: "https://flagcdn.com/w320/ca.png",
    options: ["Canada", "Austria", "Denmark", "Switzerland"]
  },
  {
    country: "India",
    image: "https://flagcdn.com/w320/in.png",
    options: ["Niger", "Ireland", "India", "Ivory Coast"]
  },
  {
    country: "United Kingdom",
    image: "https://flagcdn.com/w320/gb.png",
    options: ["Australia", "New Zealand", "United Kingdom", "Iceland"]
  },
  {
    country: "Italy",
    image: "https://flagcdn.com/w320/it.png",
    options: ["Mexico", "Hungary", "Italy", "Bulgaria"]
  },
  {
    country: "United States",
    image: "https://flagcdn.com/w320/us.png",
    options: ["Liberia", "United States", "Malaysia", "Cuba"]
  },
  {
    country: "South Africa",
    image: "https://flagcdn.com/w320/za.png",
    options: ["South Africa", "Kenya", "Namibia", "Ethiopia"]
  },
  {
    country: "Sweden",
    image: "https://flagcdn.com/w320/se.png",
    options: ["Norway", "Finland", "Iceland", "Sweden"]
  },
  {
    country: "Argentina",
    image: "https://flagcdn.com/w320/ar.png",
    options: ["Uruguay", "Argentina", "Paraguay", "El Salvador"]
  },
  {
    country: "South Korea",
    image: "https://flagcdn.com/w320/kr.png",
    options: ["Japan", "South Korea", "Taiwan", "Singapore"]
  },
  {
    country: "Nigeria",
    image: "https://flagcdn.com/w320/ng.png",
    options: ["Nigeria", "Pakistan", "Algeria", "Ghana"]
  },
  {
    country: "Spain",
    image: "https://flagcdn.com/w320/es.png",
    options: ["Portugal", "Romania", "Spain", "Serbia"]
  }
];

let currentFlag = null;

function loadFlagQuestion() {
  currentFlag = flagQuestions[Math.floor(Math.random() * flagQuestions.length)];
  flagImage.src = currentFlag.image;
  flagImage.alt = `${currentFlag.country} flag`;
  flagOptionsEl.innerHTML = "";
  flagFeedbackEl.textContent = "";

  shuffle(currentFlag.options).forEach((choice) => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.addEventListener("click", () => {
      if (choice === currentFlag.country) {
        flagFeedbackEl.textContent = "Correct country!";
        hubScore += 10;
      } else {
        flagFeedbackEl.textContent = `Not quite. It is ${currentFlag.country}.`;
        hubScore = Math.max(0, hubScore - 3);
      }
      hubScoreEl.textContent = `Session Score: ${hubScore}`;
    });
    flagOptionsEl.appendChild(button);
  });
}

flagNextBtn.addEventListener("click", loadFlagQuestion);

// Typing Game
const typingWordEl = document.getElementById("typing-word");
const typingInput = document.getElementById("typing-input");
const typingStartBtn = document.getElementById("typing-start");
const typingFeedbackEl = document.getElementById("typing-feedback");

const typingWords = [
  "planet",
  "victory",
  "yellow",
  "academy",
  "future",
  "creative",
  "journey",
  "science",
  "thunder",
  "diamond",
  "library",
  "captain",
  "sunlight",
  "explorer",
  "computer",
  "brilliant",
  "mountain",
  "keyboard",
  "teamwork",
  "adventure",
  "champion",
  "powerful",
  "learning",
  "imagine",
  "discover",
  "velocity",
  "strategy",
  "notebook",
  "challenge",
  "galaxy"
];
let activeWord = "";
let typingStartTime = 0;

function prepareTypingRound() {
  activeWord = typingWords[Math.floor(Math.random() * typingWords.length)];
  typingWordEl.textContent = activeWord;
  typingInput.value = "";
  typingInput.focus();
  typingFeedbackEl.textContent = "Type the word and press Enter.";
  typingStartTime = performance.now();
}

typingStartBtn.addEventListener("click", prepareTypingRound);

typingInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const typed = typingInput.value.trim().toLowerCase();
  if (!activeWord) return;

  if (typed === activeWord) {
    const elapsed = ((performance.now() - typingStartTime) / 1000).toFixed(2);
    typingFeedbackEl.textContent = `Nice! You typed it in ${elapsed}s.`;
    hubScore += 12;
  } else {
    typingFeedbackEl.textContent = "Try again, not a match.";
    hubScore = Math.max(0, hubScore - 4);
  }
  hubScoreEl.textContent = `Session Score: ${hubScore}`;
});

function renderLeaderboard() {
  if (!platformLeaderboard || !window.TAPlatform) return;
  const best = window.TAPlatform.getPersonalBest("Mini Games Hub");
  platformLeaderboard.textContent = `Your best score: ${best}. Beat it next time!`;
}

renderLeaderboard();
skipIntroBtn.addEventListener("click", skipIntro);
if (window.TASkipIntro && window.TASkipIntro()) {
  skipIntro();
} else {
  runIntro();
}
