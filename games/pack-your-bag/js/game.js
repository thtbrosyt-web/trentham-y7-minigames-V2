import { LESSON_ROUNDS } from "./data.js";
import { renderItems, updateHud, setFeedback } from "./ui.js";

export class PackYourBagGame {
  constructor(elements) {
    this.el = elements;
    this.rounds = LESSON_ROUNDS;
    this.roundIndex = 0;
    this.score = 0;
    this.timeLeft = 0;
    this.timerId = null;
    this.dragState = null;
    this.packedItems = new Set();
    this.itemById = new Map();
  }

  start() {
    this.roundIndex = 0;
    this.score = 0;
    this.renderLeaderboard();
    this.beginRound();
  }

  beginRound() {
    const round = this.rounds[this.roundIndex];
    this.timeLeft = round.timeLimit;
    this.packedItems.clear();
    this.itemById = new Map(round.items.map((item) => [item.id, item]));

    renderItems(round.items, this.el.itemsGrid);
    this.el.bagItems.innerHTML = "";
    this.attachItemInteractions();

    updateHud(this.el, this.getState(), this.rounds.length);
    setFeedback(this.el.feedback, "Drag the right items into the bag.");
    this.startTimer();
  }

  getState() {
    return {
      roundIndex: this.roundIndex,
      round: this.rounds[this.roundIndex],
      score: this.score,
      timeLeft: this.timeLeft
    };
  }

  startTimer() {
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      updateHud(this.el, this.getState(), this.rounds.length);
      if (this.timeLeft <= 0) {
        this.finishRound(true);
      }
    }, 1000);
  }

  attachItemInteractions() {
    const cards = this.el.itemsGrid.querySelectorAll(".item-card");
    cards.forEach((card) => {
      card.addEventListener("pointerdown", (event) => this.onPointerDown(event, card));
      card.addEventListener("click", () => this.togglePack(card));
    });
  }

  onPointerDown(event, card) {
    event.preventDefault();
    card.setPointerCapture(event.pointerId);

    const rect = card.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    this.dragState = { card, pointerId: event.pointerId, offsetX, offsetY };
    card.classList.add("dragging");

    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.left = `${event.clientX - offsetX}px`;
    card.style.top = `${event.clientY - offsetY}px`;

    const moveHandler = (moveEvent) => this.onPointerMove(moveEvent);
    const upHandler = (upEvent) => this.onPointerUp(upEvent, moveHandler, upHandler);

    card.addEventListener("pointermove", moveHandler);
    card.addEventListener("pointerup", upHandler);
    card.addEventListener("pointercancel", upHandler);
  }

  onPointerMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
      return;
    }

    const { card, offsetX, offsetY } = this.dragState;
    card.style.left = `${event.clientX - offsetX}px`;
    card.style.top = `${event.clientY - offsetY}px`;

    const inBag = this.isPointInsideBag(event.clientX, event.clientY);
    this.el.bagDropzone.classList.toggle("active", inBag);
  }

  onPointerUp(event, moveHandler, upHandler) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
      return;
    }

    const { card } = this.dragState;
    card.releasePointerCapture(event.pointerId);
    card.removeEventListener("pointermove", moveHandler);
    card.removeEventListener("pointerup", upHandler);
    card.removeEventListener("pointercancel", upHandler);

    const droppedInBag = this.isPointInsideBag(event.clientX, event.clientY);
    this.el.bagDropzone.classList.remove("active");
    this.dragState = null;

    card.classList.remove("dragging");
    card.style.width = "";
    card.style.height = "";
    card.style.left = "";
    card.style.top = "";

    if (droppedInBag) {
      this.packItem(card);
    } else if (card.classList.contains("in-bag")) {
      this.unpackItem(card);
    }
  }

  isPointInsideBag(x, y) {
    const rect = this.el.bagDropzone.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  togglePack(card) {
    if (card.classList.contains("in-bag")) {
      this.unpackItem(card);
    } else {
      this.packItem(card);
    }
  }

  packItem(card) {
    const id = card.dataset.itemId;
    if (this.packedItems.has(id)) {
      return;
    }
    this.packedItems.add(id);
    card.classList.add("in-bag");
    this.el.bagItems.appendChild(card);
    setFeedback(this.el.feedback, "Item packed.", "ok");
  }

  unpackItem(card) {
    const id = card.dataset.itemId;
    this.packedItems.delete(id);
    card.classList.remove("in-bag");
    this.el.itemsGrid.appendChild(card);
    setFeedback(this.el.feedback, "Item removed from bag.", "warn");
  }

  finishRound(fromTimeout = false) {
    clearInterval(this.timerId);
    this.timerId = null;

    const round = this.rounds[this.roundIndex];
    const requiredIds = round.items.filter((item) => item.required).map((item) => item.id);
    const packed = Array.from(this.packedItems);

    const correctPacked = packed.filter((id) => requiredIds.includes(id)).length;
    const wrongPacked = packed.filter((id) => !requiredIds.includes(id)).length;
    const missing = requiredIds.length - correctPacked;

    const accuracyScore = correctPacked * 100 - wrongPacked * 50 - Math.max(0, missing) * 30;
    const speedBonus = this.timeLeft > 0 ? this.timeLeft * 5 : 0;
    const roundScore = Math.max(0, accuracyScore + speedBonus);
    this.score += roundScore;

    updateHud(this.el, this.getState(), this.rounds.length);

    const reason = fromTimeout ? "Time's up!" : "Round submitted!";
    const summary = `${reason} Correct: ${correctPacked}, Wrong: ${wrongPacked}, Missing: ${Math.max(
      0,
      missing
    )}, +${roundScore} points.`;
    setFeedback(this.el.feedback, summary, wrongPacked > 0 || missing > 0 ? "warn" : "ok");

    setTimeout(() => {
      this.roundIndex += 1;
      if (this.roundIndex >= this.rounds.length) {
        this.endGame();
      } else {
        this.beginRound();
      }
    }, 1650);
  }

  endGame() {
    setFeedback(this.el.feedback, `Game complete! Final score: ${this.score}`, "ok");
    if (window.TAPlatform) {
      window.TAPlatform.submitScore("Pack Your Bag", this.score, 30 + this.score / 15, 8 + this.score / 20);
      this.renderLeaderboard();
    }
    this.el.submitRoundBtn.disabled = true;
    this.el.submitRoundBtn.textContent = "Finished";
    this.el.lessonNameEl.textContent = "All Lessons Done";
    this.el.timerEl.textContent = "0";
    this.el.roundEl.textContent = `${this.rounds.length}/${this.rounds.length}`;
  }

  renderLeaderboard() {
    if (!window.TAPlatform || !this.el.platformLeaderboard) {
      return;
    }
    const best = window.TAPlatform.getPersonalBest("Pack Your Bag");
    this.el.platformLeaderboard.textContent = `Your best score: ${best}. Beat it next time!`;
  }
}
