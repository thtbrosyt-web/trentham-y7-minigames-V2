// School Survival Day
// Decision rounds with immediate right/wrong outcomes; answers shuffled each run.

const scoreValueEl = document.getElementById("scoreValue");
const introOverlayEl = document.getElementById("introOverlay");
const gameAppEl = document.getElementById("gameApp");
const traceMainEl = document.getElementById("traceMain");
const traceSubEl = document.getElementById("traceSub");
const introMottoEl = document.getElementById("introMotto");
const skipIntroBtn = document.getElementById("skipIntroBtn");
const questionCounterEl = document.getElementById("questionCounter");
const progressFillEl = document.getElementById("progressFill");
const sceneContainerEl = document.getElementById("sceneContainer");
const sceneTextEl = document.getElementById("sceneText");
const choicesEl = document.getElementById("choices");

const feedbackContainerEl = document.getElementById("feedbackContainer");
const feedbackTitleEl = document.getElementById("feedbackTitle");
const feedbackTextEl = document.getElementById("feedbackText");
const nextButtonEl = document.getElementById("nextButton");

const endingContainerEl = document.getElementById("endingContainer");
const endingTextEl = document.getElementById("endingText");
const restartButtonEl = document.getElementById("restartButton");
const platformLeaderboardEl = document.getElementById("platformLeaderboard");

const TOTAL_QUESTIONS = 20;

const sceneTemplates = [
  {
    text: "You're late and the school gate is closing.",
    correct: "A) Go straight to reception and explain honestly.",
    wrongA: "B) Jump the side fence so no one notices.",
    wrongB: "C) Hide in the toilets until first period ends.",
    rightOutcome: "Reception logs your reason, and your tutor appreciates your honesty.",
    wrongOutcome: "A teacher spots you, and you lose trust points for poor choices."
  },
  {
    text: "You forgot your homework in a rush.",
    correct: "A) Admit it and ask for a lunchtime catch-up.",
    wrongA: "B) Pretend your dog shredded the pages.",
    wrongB: "C) Copy from someone five minutes before class.",
    rightOutcome: "Your teacher sets a fair plan and respects your responsibility.",
    wrongOutcome: "The excuse falls apart and you get a behavior note."
  },
  {
    text: "Teacher asks a question and picks you.",
    correct: "A) Try your best answer, even if unsure.",
    wrongA: "B) Laugh it off and distract the class.",
    wrongB: "C) Refuse to answer and fold your arms.",
    rightOutcome: "You earn participation credit and a useful hint to improve.",
    wrongOutcome: "Class time is lost and you get a warning."
  },
  {
    text: "A classmate is being teased near the cloakroom corridor.",
    correct: "A) Check on them and tell a teacher quietly.",
    wrongA: "B) Join in so others think you're funny.",
    wrongB: "C) Record it and post it to a group chat.",
    rightOutcome: "Pastoral staff step in and your classmate feels supported.",
    wrongOutcome: "The situation escalates and serious consequences follow."
  },
  {
    text: "You see a phone out during a test.",
    correct: "A) Focus on your own paper and keep working.",
    wrongA: "B) Ask to look at their screen for answers.",
    wrongB: "C) Whisper answers across the room.",
    rightOutcome: "You keep your integrity and avoid any cheating issues.",
    wrongOutcome: "Both students are flagged and marks are reduced."
  },
  {
    text: "Lunch queue is huge and you are starving.",
    correct: "A) Queue properly and use the wait to chat politely.",
    wrongA: "B) Push to the front before staff notice.",
    wrongB: "C) Grab someone else's tray by mistake.",
    rightOutcome: "Staff notice your patience and service moves quickly.",
    wrongOutcome: "You are sent to the back and lose lunchtime minutes."
  },
  {
    text: "Fire drill alarm rings during science.",
    correct: "A) Leave calmly with your class in silence.",
    wrongA: "B) Run back to grab your bag first.",
    wrongB: "C) Joke around while exiting the lab.",
    rightOutcome: "Your class exits safely and returns quickly.",
    wrongOutcome: "Safety rules are broken and detention is assigned."
  },
  {
    text: "You borrowed a calculator and forgot to return it.",
    correct: "A) Return it with an apology before next lesson.",
    wrongA: "B) Keep it and hope they forget.",
    wrongB: "C) Say you never borrowed it.",
    rightOutcome: "Trust stays strong and your classmate thanks you.",
    wrongOutcome: "Your classmate reports it and trust drops."
  }
];

let score = 0;
let questionIndex = 0;
let questions = [];
let introFinished = false;
let introTimerId = null;

function stripLetterPrefix(label) {
  return String(label).replace(/^[A-C]\)\s*/i, "").trim();
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoicesFromTemplate(template) {
  const raw = [
    { bareText: stripLetterPrefix(template.correct), isCorrect: true },
    { bareText: stripLetterPrefix(template.wrongA), isCorrect: false },
    { bareText: stripLetterPrefix(template.wrongB), isCorrect: false }
  ];
  const shuffled = shuffleArray(raw);
  return shuffled.map((c, idx) => ({
    label: `${String.fromCharCode(65 + idx)}) ${c.bareText}`,
    isCorrect: c.isCorrect
  }));
}

function buildQuestions() {
  const generated = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i += 1) {
    const template = sceneTemplates[i % sceneTemplates.length];
    const period = Math.floor(i / sceneTemplates.length) + 1;
    generated.push({
      text: `${template.text} (Period ${period})`,
      choices: buildChoicesFromTemplate(template),
      rightOutcome: template.rightOutcome,
      wrongOutcome: template.wrongOutcome
    });
  }
  return shuffleArray(generated);
}

function updateHeader() {
  scoreValueEl.textContent = String(score);
  questionCounterEl.textContent = `Situation ${questionIndex + 1} of ${TOTAL_QUESTIONS}`;
  const percentage = (questionIndex / TOTAL_QUESTIONS) * 100;
  progressFillEl.style.width = `${percentage}%`;
}

function showQuestion() {
  if (questionIndex >= questions.length) {
    finishGame();
    return;
  }

  const question = questions[questionIndex];
  updateHeader();

  sceneTextEl.textContent = question.text;
  choicesEl.innerHTML = "";

  question.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.label;
    button.addEventListener("pointerdown", () => handleChoice(choice));
    choicesEl.appendChild(button);
  });

  sceneContainerEl.classList.remove("hidden");
  feedbackContainerEl.classList.add("hidden");
  endingContainerEl.classList.add("hidden");
}

function handleChoice(choice) {
  const buttons = choicesEl.querySelectorAll(".choice-button");
  buttons.forEach((button) => {
    button.disabled = true;
  });

  const wasCorrect = choice.isCorrect;
  score += wasCorrect ? 2 : -1;
  scoreValueEl.textContent = String(score);

  const current = questions[questionIndex];
  feedbackContainerEl.classList.remove("hidden", "correct", "wrong");
  feedbackContainerEl.classList.add(wasCorrect ? "correct" : "wrong");
  feedbackTitleEl.textContent = wasCorrect ? "Correct Choice" : "Wrong Choice";
  feedbackTextEl.textContent = wasCorrect ? current.rightOutcome : current.wrongOutcome;
}

function goNext() {
  questionIndex += 1;
  showQuestion();
}

function finishGame() {
  updateHeader();
  progressFillEl.style.width = "100%";

  sceneContainerEl.classList.add("hidden");
  feedbackContainerEl.classList.add("hidden");
  endingContainerEl.classList.remove("hidden");

  const maxScore = TOTAL_QUESTIONS * 2;
  const percent = Math.round((score / maxScore) * 100);
  let gradeMessage = "";

  if (percent >= 85) {
    gradeMessage = "Outstanding day. You made smart decisions all day long.";
  } else if (percent >= 65) {
    gradeMessage = "Solid performance. You handled most situations well.";
  } else if (percent >= 45) {
    gradeMessage = "Decent effort, but there is room to improve your choices.";
  } else {
    gradeMessage = "Rough school day. Next run, make calmer and safer choices.";
  }

  endingTextEl.textContent = `Final Score: ${score}/${maxScore} (${percent}%). ${gradeMessage}`;
  if (window.TAPlatform) {
    window.TAPlatform.submitScore("School Survival Day", score, 35 + percent / 2, 10 + percent / 8);
    renderPlatformLeaderboard();
  }
}

function restartGame() {
  score = 0;
  questionIndex = 0;
  questions = buildQuestions();
  showQuestion();
}

function renderPlatformLeaderboard() {
  if (!platformLeaderboardEl || !window.TAPlatform) {
    return;
  }
  const best = window.TAPlatform.getPersonalBest("School Survival Day");
  platformLeaderboardEl.textContent = `Your best score: ${best}. Beat it next time!`;
}

nextButtonEl.addEventListener("pointerdown", goNext);
restartButtonEl.addEventListener("pointerdown", restartGame);

function finishIntro() {
  if (introFinished) {
    return;
  }
  introFinished = true;
  clearTimeout(introTimerId);
  introOverlayEl.classList.add("fade-out");
  gameAppEl.classList.remove("app-hidden");
  gameAppEl.classList.add("app-ready");
}

function typeMotto(text, startDelayMs) {
  setTimeout(() => {
    if (introFinished) {
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (introFinished) {
        clearInterval(interval);
        return;
      }
      introMottoEl.textContent = text.slice(0, i);
      i += 1;
      if (i > text.length) {
        clearInterval(interval);
      }
    }, 70);
  }, startDelayMs);
}

function startIntroAnimation() {
  traceMainEl.style.setProperty("--trace-delay", "0s");
  traceSubEl.style.setProperty("--trace-delay", "1.75s");
  traceMainEl.classList.add("trace-animate");
  traceSubEl.classList.add("trace-animate");

  typeMotto("Innovation is key.", 2650);

  // Auto-finish intro after all intro effects complete.
  introTimerId = setTimeout(finishIntro, 6200);
}

introOverlayEl.addEventListener("pointerdown", finishIntro);
skipIntroBtn.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  finishIntro();
});

restartGame();
if (window.TASkipIntro && window.TASkipIntro()) {
  finishIntro();
} else {
  startIntroAnimation();
}
