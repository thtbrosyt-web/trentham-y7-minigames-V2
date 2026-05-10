function createItemCard(item) {
  const card = document.createElement("div");
  card.className = "item-card";
  card.dataset.itemId = item.id;
  card.innerHTML = `
    <div class="emoji">${item.emoji}</div>
    <div class="name">${item.name}</div>
  `;
  return card;
}

export function renderItems(items, itemsGrid) {
  itemsGrid.innerHTML = "";
  items.forEach((item) => {
    itemsGrid.appendChild(createItemCard(item));
  });
}

export function updateHud({ lessonNameEl, timerEl, scoreEl, roundEl }, state, totalRounds) {
  lessonNameEl.textContent = state.round.lesson;
  timerEl.textContent = String(state.timeLeft);
  scoreEl.textContent = String(state.score);
  roundEl.textContent = `${state.roundIndex + 1}/${totalRounds}`;
}

export function setFeedback(feedbackEl, text, tone = "neutral") {
  feedbackEl.textContent = text;
  feedbackEl.classList.remove("ok", "warn");
  if (tone === "ok") {
    feedbackEl.classList.add("ok");
  } else if (tone === "warn") {
    feedbackEl.classList.add("warn");
  }
}

export function typeLine(text, targetEl, speedMs = 45) {
  targetEl.textContent = "";
  let index = 0;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      targetEl.textContent += text[index];
      index += 1;
      if (index >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speedMs);
  });
}
