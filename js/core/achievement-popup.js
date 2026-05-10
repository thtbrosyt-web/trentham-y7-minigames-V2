let queue = [];
let showing = false;
const DISPLAY_MS = 4200;

function ensureHost() {
  let host = document.getElementById("achievementCornerHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "achievementCornerHost";
    host.className = "achievement-corner-host";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  return host;
}

function showNext() {
  if (showing || queue.length === 0) return;
  showing = true;
  const { def, rewardXp, rewardCoins } = queue.shift();
  const host = ensureHost();
  const card = document.createElement("div");
  card.className = "achievement-corner";
  card.innerHTML = `
    <div class="achievement-corner-icon">${def.icon}</div>
    <div class="achievement-corner-body">
      <strong class="achievement-corner-title">Achievement</strong>
      <p class="achievement-corner-name">${def.label}</p>
      <p class="achievement-corner-reward">+${rewardXp} XP · +${rewardCoins} coins</p>
    </div>
  `;
  host.appendChild(card);
  requestAnimationFrame(() => {
    card.classList.add("achievement-corner-visible");
  });
  setTimeout(() => {
    card.classList.remove("achievement-corner-visible");
    setTimeout(() => {
      card.remove();
      showing = false;
      showNext();
    }, 280);
  }, DISPLAY_MS);
}

export function showAchievementCorner(def, { rewardXp, rewardCoins }) {
  queue.push({
    def,
    rewardXp: rewardXp ?? 0,
    rewardCoins: rewardCoins ?? 0
  });
  showNext();
}
