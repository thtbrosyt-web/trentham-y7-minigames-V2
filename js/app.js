import {
  getPlayer,
  savePlayer,
  setOnboardingProfile,
  setBriefingProfile,
  needsBriefing,
  isValidPlayDevice
} from "./core/player.js";
import { grantRewards, calculateLevel, XP_PER_LEVEL } from "./core/progression.js";
import { getBestScore } from "./core/leaderboards.js";
import { ensurePersonalBestsMigrated } from "./core/personal-bests.js";
import { HUB_GAMES } from "./core/games-list.js";
import { buildUnlockContext, isGameUnlocked, formatUnlockRequirement } from "./core/unlocks.js";
import { playHubSfx } from "./core/hub-audio.js";
import { trackGameLaunch, getMostPlayed, getTotalLaunches } from "./core/usage.js";
import { saveProjectReview, rateGame, gameHasHubLike, getMostLikedGame, getReviewCount } from "./core/reviews.js";
import { applyDailyStreak, getStreakState, markStreakFreshResetToday } from "./core/streak.js";
import { isFavourite, toggleFavourite } from "./core/favourites.js";
import { initTheme, toggleTheme, getTheme, setAccent, getAccent } from "./core/theme.js";
import { showToast } from "./core/toasts.js";
import { ACHIEVEMENT_DEFS, evaluateAchievements, getAchievementProgress, getUnlockedIds, rewardSummary } from "./core/achievements.js";
import { showAchievementCorner } from "./core/achievement-popup.js";
import { clearAllLocalGameData } from "./core/reset-storage.js";
import { REVIEW_FORM_URL } from "./core/config.js";
import { loadHubSettings, saveHubSettings } from "./core/settings.js";
import { runBootSplash } from "./core/boot-splash.js";
import { CONSUMABLE_ITEMS, buyConsumable } from "./core/consumables.js";
import { redeemCodeTyped, REDEEMED_CODES_KEY, REDEEM_HISTORY_KEY } from "./core/redeem-codes.js";
import { encodeSaveCode, decodeSaveCode, applySaveKeys, collectHubLocalStorage, stripTeacherOnlyKeys } from "./core/save-code.js";
import { isHubDevUnlocked, hubDevUnlockStorageKey } from "./core/dev-mode.js";

const games = HUB_GAMES;

/** When set (Play from hub), next hub load skips the boot splash unless cold-open policy changes. */
const HUB_SKIP_BOOT_ONCE_KEY = "ta_hub_skip_boot_once";

const app = document.getElementById("app");
const gamesGrid = document.getElementById("gamesGrid");
const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const hubGuideChip = document.getElementById("hubGuideChip");
const canteenItems = document.getElementById("canteenItems");
const boostItemsEl = document.getElementById("boostItems");
const achievementsGrid = document.getElementById("achievementsGrid");
const mostPlayed = document.getElementById("mostPlayed");
const mostLiked = document.getElementById("mostLiked");
const gameSearchInput = document.getElementById("gameSearch");
const favOnlyFilter = document.getElementById("favOnlyFilter");
const themeToggle = document.getElementById("themeToggle");

const DEV_NAME_TRIGGER = "devModeTHT";
const DEV_PASSWORD = "THTLabs";

const SHOP_TAB_STORAGE_KEY = "ta_shop_tab";
const SHOP_TAB_IDS = new Set(["canteen", "boost"]);

const SHOP_TAB_TITLES = {
  canteen: "Shop · Canteen",
  boost: "Shop · Boosts"
};

const SHOP_TAB_LEADS = {
  canteen: "Cheap snacks with small XP or coin bumps. They apply on your next game score only.",
  boost: "Stronger one-shot effects — queue one boost at a time for your next game score."
};

/** Hub section URL fragments (shareable deep links). */
const VIEW_SLUGS = {
  "view-home": "home",
  "view-games": "games",
  "view-achievements": "badges",
  "view-customise": "shop",
  "view-settings": "settings",
  "view-rate": "feedback"
};

const SLUG_TO_VIEW = Object.fromEntries(Object.entries(VIEW_SLUGS).map(([viewId, slug]) => [slug, viewId]));

let hubHashSync = false;

function readStoredShopTab() {
  try {
    const v = sessionStorage.getItem(SHOP_TAB_STORAGE_KEY);
    if (v && SHOP_TAB_IDS.has(v)) return v;
  } catch {
    /* ignore */
  }
  return "canteen";
}

/** Hub feedback rating (0.5–5); null until user picks. */
let hubFeedbackRating = null;
let gameQuery = "";
let favOnly = false;
let shopTab = readStoredShopTab();

function syncShopPanels() {
  document.querySelectorAll("[data-shop-panel]").forEach((el) => {
    const on = el.getAttribute("data-shop-panel") === shopTab;
    el.hidden = !on;
    el.setAttribute("aria-hidden", on ? "false" : "true");
  });
  const title = document.getElementById("shopSectionTitle");
  const lead = document.getElementById("shopSectionLead");
  if (title) title.textContent = SHOP_TAB_TITLES[shopTab] || "Shop";
  if (lead) lead.textContent = SHOP_TAB_LEADS[shopTab] || "";
  document.querySelectorAll("[data-shop-tab]").forEach((btn) => {
    const t = btn.getAttribute("data-shop-tab");
    if (t === shopTab) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}

function openShop(tab) {
  if (!SHOP_TAB_IDS.has(tab)) return;
  shopTab = tab;
  try {
    sessionStorage.setItem(SHOP_TAB_STORAGE_KEY, shopTab);
  } catch {
    /* ignore */
  }
  syncShopPanels();
  showView("view-customise");
  const shopDd = document.getElementById("shopNavDropdown");
  if (shopDd && shopDd.tagName === "DETAILS") {
    shopDd.open = false;
  }
  const shopSummary = document.getElementById("shopNavSummary");
  if (shopSummary) shopSummary.setAttribute("aria-expanded", "false");
}

function setDevUnlocked(on) {
  const k = hubDevUnlockStorageKey();
  if (on) localStorage.setItem(k, "1");
  else localStorage.removeItem(k);
}

function syncReduceMotionClass() {
  document.body.classList.toggle("hub-reduce-motion", !!loadHubSettings().reduceMotion);
}

function needsOnboarding(player) {
  return !player.name?.trim() || !isValidPlayDevice(player.playDevice);
}

function syncNameModalFromPlayer() {
  const p = getPlayer();
  if (nameInput) nameInput.value = p.name?.trim() || "";
  document.querySelectorAll('input[name="playDevice"]').forEach((radio) => {
    radio.checked = radio.value === p.playDevice;
  });
}

function buildGameHref(baseHref) {
  let href = baseHref;
  if (loadHubSettings().skipGameIntros) {
    href += (baseHref.includes("?") ? "&" : "?") + "taNoIntro=1";
  }
  return href;
}

function showView(viewId) {
  document.querySelectorAll(".hub-panel").forEach((panel) => {
    const on = panel.id === viewId;
    panel.classList.toggle("active", on);
    panel.hidden = !on;
  });
  document.querySelectorAll(".hub-nav-btn").forEach((btn) => {
    const on = btn.getAttribute("data-view") === viewId;
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
  const shopDd = document.getElementById("shopNavDropdown");
  if (shopDd && shopDd.tagName === "DETAILS" && viewId !== "view-customise") {
    shopDd.open = false;
  }
  const shopSummary = document.getElementById("shopNavSummary");
  if (shopSummary) {
    if (viewId === "view-customise") shopSummary.setAttribute("aria-current", "page");
    else shopSummary.removeAttribute("aria-current");
  }
  if (viewId === "view-customise") {
    syncShopPanels();
  }
  if (viewId === "view-settings") {
    const el = document.getElementById("saveCodeExportArea");
    if (el) {
      try {
        el.value = encodeSaveCode({ excludeTeacher: true });
      } catch {
        /* ignore */
      }
    }
  }

  const slug = VIEW_SLUGS[viewId];
  if (slug && !hubHashSync) {
    const next = `#${slug}`;
    if ((window.location.hash || "").toLowerCase() !== next) {
      hubHashSync = true;
      try {
        const url = `${window.location.pathname}${window.location.search}${next}`;
        window.history.replaceState(null, "", url);
      } finally {
        hubHashSync = false;
      }
    }
  }
}

function applyHubHashRoute() {
  const raw = (window.location.hash || "").replace(/^#/, "").toLowerCase().trim();
  if (!raw) {
    showView("view-home");
    return;
  }
  const viewId = SLUG_TO_VIEW[raw];
  if (viewId) showView(viewId);
  else showView("view-home");
}

function burstLevelUp() {
  if (loadHubSettings().reduceMotion) return;
  const host = document.getElementById("levelUpBurst");
  if (!host) return;
  host.innerHTML = "";
  host.classList.remove("hidden");
  const count = loadHubSettings().reduceMotion ? 8 : 40;
  for (let i = 0; i < count; i += 1) {
    const s = document.createElement("span");
    s.className = "confetti-bit";
    s.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    s.style.setProperty("--dy", `${100 + Math.random() * 200}px`);
    s.style.setProperty("--rot", `${Math.random() * 540}deg`);
    const hue = 38 + Math.random() * 50;
    s.style.background = `hsl(${hue}, 88%, 58%)`;
    host.appendChild(s);
  }
  setTimeout(() => {
    host.classList.add("hidden");
    host.innerHTML = "";
  }, 1500);
}

function handleLevelUp(grantResult) {
  if (grantResult?.leveledUp) {
    playHubSfx("level-up");
    burstLevelUp();
    showToast(`Level up! You are now level ${grantResult.newLevel}.`);
  }
}

function pumpAchievements() {
  evaluateAchievements((def, grantResult) => {
    showAchievementCorner(def, { rewardXp: def.rewardXp, rewardCoins: def.rewardCoins });
    handleLevelUp(grantResult);
  });
  renderProfile();
  renderAchievements();
  renderStatsStrip();
}

function renderStatsStrip() {
  const el = document.getElementById("statsStrip");
  if (!el) return;
  const launches = getTotalLaunches();
  const reviews = getReviewCount();
  const { unlocked, total } = getAchievementProgress();
  el.innerHTML = `
    <span class="stat-chip" title="Times you opened a game from this page"><span class="stat-chip-label">Game opens</span><span class="stat-chip-value">${launches}</span></span>
    <span class="stat-chip" title="Reviews saved from this page"><span class="stat-chip-label">Reviews</span><span class="stat-chip-value">${reviews}</span></span>
    <span class="stat-chip" title="Achievements unlocked"><span class="stat-chip-label">Badges</span><span class="stat-chip-value">${unlocked} / ${total}</span></span>
  `;
}

function renderBoostLine() {
  const el = document.getElementById("boostLine");
  if (!el) return;
  const player = getPlayer();
  const b = player.pendingBoost;
  if (!b) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  let text = "Boost ready: ";
  if (b.kind === "xp_pct") text += `+${b.value}% XP on next score.`;
  else if (b.kind === "coins_flat") text += `+${b.value} coins on next score.`;
  else if (b.kind === "coins_pct") text += `+${b.value}% coins on next score.`;
  else if (b.kind === "flat_xp") text += `+${b.value} XP on next score.`;
  else if (b.kind === "combo") text += `+${b.valueXP}% XP and +${b.valueCoins} coins on next score.`;
  else if (b.kind === "megamix") text += `+${b.valueXP}% XP and +${b.valueCoinsPct}% coins on next score.`;
  else if (b.kind === "ultra")
    text += `+${b.valueXP}% XP, +${b.valueCoins} coins, +${b.flatXp} XP on next score.`;
  el.textContent = text;
  el.classList.remove("hidden");
}

function renderStreakLine() {
  const el = document.getElementById("streakLine");
  if (!el) return;
  const st = getStreakState();
  const n = st.streak || 0;
  el.textContent = `Daily streak: ${n} day${n === 1 ? "" : "s"} · tomorrow check-in stacks bonus XP/coins`;
}

function renderAchievements() {
  if (!achievementsGrid) return;
  const unlocked = new Set(getUnlockedIds());
  achievementsGrid.innerHTML = "";
  ACHIEVEMENT_DEFS.forEach((def) => {
    const article = document.createElement("article");
    const ok = unlocked.has(def.id);
    article.className = `ach-card${ok ? " unlocked" : ""}`;
    article.innerHTML = `
      <div class="ach-card-head">
        <span class="ach-icon" aria-hidden="true">${def.icon}</span>
        <div class="ach-card-titles">
          <strong class="ach-name">${def.label}</strong>
          <span class="ach-status ${ok ? "ach-status--unlocked" : "ach-status--locked"}">${ok ? "Unlocked" : "Locked"}</span>
        </div>
      </div>
      <p class="ach-desc subtext">${def.desc}</p>
      <p class="ach-reward-line"><span class="meta-label">Reward</span> <span class="ach-reward-value">${rewardSummary(def)}</span></p>
    `;
    achievementsGrid.appendChild(article);
  });
}

function syncThemeButton() {
  if (!themeToggle) return;
  themeToggle.textContent = getTheme() === "dark" ? "Light mode" : "Dark mode";
}

function renderProfile() {
  const player = getPlayer();
  document.getElementById("playerName").textContent = player.name?.trim() || "—";
  document.getElementById("playerLevel").textContent = String(calculateLevel(player.xp));
  document.getElementById("playerCoins").textContent = String(player.coins);

  const xpProgress = player.xp % XP_PER_LEVEL;
  document.getElementById("xpText").textContent = `${xpProgress} / ${XP_PER_LEVEL} XP`;
  document.getElementById("xpBar").style.width = `${(xpProgress / XP_PER_LEVEL) * 100}%`;
  renderBoostLine();
  syncDevPanel();
}

function syncDevPanel() {
  const panel = document.getElementById("devToolsPanel");
  if (panel) panel.classList.toggle("hidden", !isHubDevUnlocked());
}

function renderGames() {
  gamesGrid.innerHTML = "";
  const uctx = buildUnlockContext();
  const briefingOk = !!getPlayer().briefingComplete;
  const filteredGames = games.filter((game) => {
    const q = gameQuery.toLowerCase();
    const nameOk = game.name.toLowerCase().includes(q);
    const favOk = !favOnly || isFavourite(game.name);
    return nameOk && favOk;
  });
  if (!filteredGames.length) {
    const p = document.createElement("p");
    p.className = "subtext";
    p.textContent = favOnly ? "No favourites match. Star a game or turn off the filter." : "No games match your search.";
    gamesGrid.appendChild(p);
    return;
  }
  filteredGames.forEach((game) => {
    const card = document.createElement("article");
    card.className = "game-card";
    const best = getBestScore(game.name);
    const fav = isFavourite(game.name);
    const liked = gameHasHubLike(game.name);
    const unlocked = isGameUnlocked(game, uctx);
    const req = formatUnlockRequirement(game);
    const likeFav = unlocked && briefingOk
      ? `<div class="game-card-icon-row" role="group" aria-label="Reactions for ${game.name}">
        <button type="button" class="game-card-icon game-card-icon--thumb ${liked ? "game-card-icon--lit" : ""}" data-like="${game.name}" aria-label="Like ${game.name}" aria-pressed="${liked}" title="Like">👍</button>
        <button type="button" class="game-card-icon game-card-icon--star ${fav ? "game-card-icon--lit" : ""}" data-fav="${game.name}" aria-label="${fav ? `Remove ${game.name} from favourites` : `Favourite ${game.name}`}" aria-pressed="${fav}" title="Favourite"><span class="game-card-icon-star" aria-hidden="true">${fav ? "★" : "☆"}</span></button>
      </div>`
      : "";
    const playHref = unlocked && briefingOk ? buildGameHref(game.href) : "";
    const playCell =
      unlocked && briefingOk
        ? `<a class="play-btn" href="${playHref}">Play</a>`
        : unlocked && !briefingOk
          ? `<span class="play-btn play-btn-locked" role="button" aria-disabled="true">Briefing</span>`
          : `<span class="play-btn play-btn-locked" role="button" aria-disabled="true">Locked</span>`;
    let unlockLine = "";
    if (!unlocked) unlockLine = `<p class="game-unlock-hint"><span class="meta-label">Unlock</span> ${req}</p>`;
    else if (!briefingOk)
      unlockLine = `<p class="game-unlock-hint"><span class="meta-label">Briefing</span> Finish the popup on first load.</p>`;
    const rule = game.unlock;
    const devHint =
      isHubDevUnlocked() && rule && rule.type !== "always"
        ? `<p class="subtext dev-unlock-hint"><span class="meta-label">Dev</span> ${JSON.stringify(rule)}</p>`
        : "";
    const actionsClass = unlocked && briefingOk ? "game-actions" : "game-actions game-actions--locked";
    card.innerHTML = `
      <h3 class="game-title">${game.name}</h3>
      <ul class="game-meta-list">
        <li><span class="meta-label">Your best</span> <span class="meta-value">${best}</span></li>
        <li><span class="meta-label">XP tier</span> <span class="meta-value">${game.xpText}</span></li>
      </ul>
      ${unlockLine}
      ${devHint}
      <div class="${actionsClass}">
        ${playCell}
        ${likeFav}
      </div>
    `;
    const playEl = card.querySelector(".play-btn");
    if (unlocked && briefingOk && playEl.matches("a")) {
      playEl.addEventListener("click", () => {
        try {
          sessionStorage.setItem(HUB_SKIP_BOOT_ONCE_KEY, "1");
        } catch {
          /* ignore */
        }
        playHubSfx("game-start");
        trackGameLaunch(game.name);
        pumpAchievements();
      });
    }
    const likeBtn = card.querySelector("[data-like]");
    if (likeBtn) {
      likeBtn.addEventListener("click", () => {
        rateGame(game.name, 5);
        renderGames();
        renderHubFeatures();
        pumpAchievements();
      });
    }
    const favBtn = card.querySelector("[data-fav]");
    if (favBtn) {
      favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const wasFav = fav;
        toggleFavourite(game.name);
        renderGames();
        pumpAchievements();
        showToast(!wasFav ? `Favourited ${game.name}.` : `Removed ${game.name} from favourites.`);
      });
    }
    gamesGrid.appendChild(card);
  });
}

function renderHubGuide() {
  if (!hubGuideChip) return;
  const player = getPlayer();
  const g = player.guideGender === "girl" ? "girl" : "boy";
  const src = `./assets/character/base/base_${g}.png`;
  const sub = player.briefingComplete
    ? "Your buddy appears in the corner of each game with tips. Tap Codes on this hub for bonus coins and XP (not Backup)."
    : "Finish the briefing popup to unlock Play buttons.";
  hubGuideChip.innerHTML = `
    <div class="hub-guide-inner">
      <div class="hub-guide-avatar-wrap">
        <img class="hub-guide-img" src="${src}" alt="" width="56" height="56" loading="lazy"
          onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'hub-guide-fallback\\' aria-hidden=\\'true\\'>🎓</span>';" />
      </div>
      <div class="hub-guide-copy">
        <strong class="hub-guide-title">Tips buddy</strong>
        <p class="subtext hub-guide-sub">${sub}</p>
      </div>
    </div>`;
}

function renderConsumableShelf(targetEl, shelfId) {
  if (!targetEl) return;
  targetEl.innerHTML = "";
  const player = getPlayer();
  const list = CONSUMABLE_ITEMS.filter((item) => item.shelf === shelfId);
  list.forEach((item) => {
    const card = document.createElement("article");
    card.className = "shop-item canteen-item";
    const disabled = !!player.pendingBoost;
    const thumb = `./assets/shop/consumables/${item.id}.png`;
    card.innerHTML = `
      <div class="consumable-thumb-wrap"><img class="consumable-thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></div>
      <h3>${item.label}</h3>
      <p class="subtext">${item.description}</p>
      <p class="subtext">Price: ${item.price} coins</p>
      <button type="button" class="gold-btn" ${disabled ? "disabled" : ""}>${disabled ? "Boost already queued" : "Buy"}</button>
    `;
    const btn = card.querySelector("button");
    btn.addEventListener("click", () => {
      const res = buyConsumable(item.id);
      if (!res.ok) {
        showToast(res.reason || "Cannot buy.");
        return;
      }
      renderProfile();
      renderConsumableShelves();
      pumpAchievements();
    });
    targetEl.appendChild(card);
  });
}

function renderConsumableShelves() {
  renderConsumableShelf(canteenItems, "canteen");
  renderConsumableShelf(boostItemsEl, "boost");
}

function renderHubFeatures() {
  mostPlayed.textContent = getMostPlayed() || "No games played yet.";
  mostLiked.textContent = getMostLikedGame() || "No ratings yet.";
}

function setupReviews() {
  const starRow = document.getElementById("starRow");
  starRow.innerHTML = "";
  starRow.classList.add("star-rating-row");

  const widget = document.createElement("div");
  widget.className = "star-rating-widget";
  widget.setAttribute("role", "slider");
  widget.setAttribute("aria-valuemin", "0.5");
  widget.setAttribute("aria-valuemax", "5");
  widget.setAttribute("aria-valuenow", "");
  widget.setAttribute("aria-valuetext", "No rating selected");
  widget.setAttribute("tabindex", "0");
  widget.setAttribute("aria-label", "Rating from half a star to five stars");

  const inner = document.createElement("div");
  inner.className = "star-rating-inner";

  const clips = [];

  function syncGlyphs() {
    const r = hubFeedbackRating;
    for (let i = 1; i <= 5; i += 1) {
      const portion =
        r == null ? 0 : Math.min(1, Math.max(0, r - (i - 1)));
      const pct = `${portion * 100}%`;
      clips[i - 1].style.width = pct;
    }
    if (r == null) {
      widget.setAttribute("aria-valuenow", "");
      widget.setAttribute("aria-valuetext", "No rating selected");
    } else {
      widget.setAttribute("aria-valuenow", String(r));
      widget.setAttribute("aria-valuetext", `${r} out of 5 stars`);
    }
  }

  for (let i = 1; i <= 5; i += 1) {
    const cell = document.createElement("div");
    cell.className = "star-rating-cell";

    const stack = document.createElement("div");
    stack.className = "star-rating-stack";

    const bg = document.createElement("span");
    bg.className = "star-rating-bg";
    bg.textContent = "★";
    bg.setAttribute("aria-hidden", "true");

    const clip = document.createElement("div");
    clip.className = "star-rating-fg-clip";
    const fg = document.createElement("span");
    fg.className = "star-rating-fg";
    fg.textContent = "★";
    fg.setAttribute("aria-hidden", "true");
    clip.appendChild(fg);
    clips.push(clip);

    stack.appendChild(bg);
    stack.appendChild(clip);

    const hitLayer = document.createElement("div");
    hitLayer.className = "star-rating-hit-layer";

    const leftHit = document.createElement("button");
    leftHit.type = "button";
    leftHit.className = "star-rating-half";
    leftHit.title = `${i - 0.5} stars`;
    leftHit.setAttribute("aria-label", `${i - 0.5} stars`);
    leftHit.addEventListener("click", (e) => {
      e.preventDefault();
      hubFeedbackRating = i - 0.5;
      syncGlyphs();
    });

    const rightHit = document.createElement("button");
    rightHit.type = "button";
    rightHit.className = "star-rating-half";
    rightHit.title = `${i} stars`;
    rightHit.setAttribute("aria-label", `${i} stars`);
    rightHit.addEventListener("click", (e) => {
      e.preventDefault();
      hubFeedbackRating = i;
      syncGlyphs();
    });

    hitLayer.appendChild(leftHit);
    hitLayer.appendChild(rightHit);

    cell.appendChild(stack);
    cell.appendChild(hitLayer);
    inner.appendChild(cell);
  }

  widget.appendChild(inner);

  widget.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = 0.5;
    if (hubFeedbackRating == null) {
      hubFeedbackRating = 3;
    }
    if (e.key === "ArrowRight") {
      hubFeedbackRating = Math.min(5, hubFeedbackRating + step);
    } else {
      hubFeedbackRating = Math.max(0.5, hubFeedbackRating - step);
    }
    syncGlyphs();
  });

  starRow.appendChild(widget);
  syncGlyphs();

  document.getElementById("submitReviewBtn").addEventListener("click", async () => {
    const text = document.getElementById("reviewText").value.trim();
    const statusEl = document.getElementById("reviewStatus");
    if (hubFeedbackRating == null || hubFeedbackRating < 0.5) {
      statusEl.textContent = "Select a star rating first.";
      return;
    }
    const starsValue = hubFeedbackRating;
    saveProjectReview({ stars: starsValue, text });
    const grantResult = grantRewards({ xp: 8, coins: 3 });
    handleLevelUp(grantResult);
    renderProfile();
    pumpAchievements();

    const endpoint = (REVIEW_FORM_URL || "").trim();
    if (endpoint) {
      statusEl.textContent = "Sending…";
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            _subject: "Trentham Minigames review",
            stars: starsValue,
            stars_out_of_five: `${starsValue} / 5`,
            rating_label: `${starsValue} star${starsValue === 1 ? "" : "s"} out of 5`,
            message: text,
            text,
            name: getPlayer().name || "Player",
            source: "Trentham Academy Minigames hub"
          })
        });
        if (!res.ok) {
          throw new Error("Bad response");
        }
        statusEl.textContent = "Thank you! Review saved and sent.";
      } catch {
        statusEl.textContent = "Review saved on this device; email could not be sent. Try again later.";
      }
    } else {
      statusEl.textContent = "Review saved on this device. Add a Formspree URL in js/core/config.js to email reviews.";
    }
    document.getElementById("reviewText").value = "";
    hubFeedbackRating = null;
    syncGlyphs();
  });
}

function openNameModal() {
  syncNameModalFromPlayer();
  nameModal.classList.remove("hidden");
}

function refreshHubIdentity() {
  renderProfile();
  renderHubGuide();
  renderGames();
  pumpAchievements();
}

function openBriefingModal() {
  const modal = document.getElementById("briefingModal");
  const p = getPlayer();
  document.querySelectorAll('input[name="briefingGender"]').forEach((radio) => {
    radio.checked = radio.value === (p.guideGender === "girl" ? "girl" : "boy");
  });
  modal?.classList.remove("hidden");
}

function setupBriefing() {
  document.getElementById("briefingSaveBtn")?.addEventListener("click", () => {
    const sel = document.querySelector('input[name="briefingGender"]:checked');
    const g = sel?.value === "girl" ? "girl" : "boy";
    setBriefingProfile({ guideGender: g });
    document.getElementById("briefingModal")?.classList.add("hidden");
    refreshHubIdentity();
  });
}

function setupName() {
  const player = getPlayer();
  if (needsOnboarding(player)) {
    openNameModal();
  }

  saveNameBtn.addEventListener("click", () => {
    const candidate = nameInput.value.trim();
    const deviceEl = document.querySelector('input[name="playDevice"]:checked');
    const playDevice = deviceEl ? deviceEl.value : "";
    if (!candidate) {
      return;
    }
    if (!isValidPlayDevice(playDevice)) {
      showToast("Pick what device you are using.");
      return;
    }
    if (candidate === DEV_NAME_TRIGGER) {
      nameInput.value = "";
      document.getElementById("devPassErr").textContent = "";
      document.getElementById("devPassModal").classList.remove("hidden");
      return;
    }
    nameModal.classList.add("hidden");
    setOnboardingProfile({ name: candidate, playDevice });
    if (needsBriefing(getPlayer())) {
      openBriefingModal();
      return;
    }
    refreshHubIdentity();
  });

  const devPassModal = document.getElementById("devPassModal");
  const devPassInput = document.getElementById("devPassInput");
  const devPassErr = document.getElementById("devPassErr");
  document.getElementById("devPassSubmit").addEventListener("click", () => {
    if (devPassInput.value !== DEV_PASSWORD) {
      devPassErr.textContent = "Wrong password.";
      return;
    }
    setDevUnlocked(true);
    devPassInput.value = "";
    devPassErr.textContent = "";
    devPassModal.classList.add("hidden");
    syncDevPanel();
    document.getElementById("devNameModal").classList.remove("hidden");
    document.getElementById("devNameInput").value = "Dev";
    document.getElementById("devNameInput").focus();
  });
  document.getElementById("devPassCancel").addEventListener("click", () => {
    devPassModal.classList.add("hidden");
    devPassInput.value = "";
    devPassErr.textContent = "";
  });

  document.getElementById("devNameSave").addEventListener("click", () => {
    const n = document.getElementById("devNameInput").value.trim() || "Dev";
    const cur = getPlayer();
    setOnboardingProfile({ name: n, playDevice: isValidPlayDevice(cur.playDevice) ? cur.playDevice : "other" });
    document.getElementById("devNameModal").classList.add("hidden");
    if (needsBriefing(getPlayer())) {
      openBriefingModal();
    } else {
      refreshHubIdentity();
    }
    showToast("Developer tools enabled in Settings.");
  });
}

function queueDevBoost(boostObj) {
  if (!isHubDevUnlocked()) return;
  const p = getPlayer();
  if (p.pendingBoost) {
    showToast("Clear boost first.");
    return;
  }
  p.pendingBoost = { ...boostObj, consumableId: boostObj.consumableId || "dev_test" };
  savePlayer(p);
  renderProfile();
  renderConsumableShelves();
  showToast("Boost queued.");
}

function fillDevConsumableSelect() {
  const sel = document.getElementById("devConsumableSelect");
  if (!sel) return;
  sel.innerHTML = "";
  CONSUMABLE_ITEMS.forEach((item) => {
    const o = document.createElement("option");
    o.value = item.id;
    o.textContent = `${item.label} (${item.shelf})`;
    sel.appendChild(o);
  });
}

function setupSaveBackup() {
  let pendingRestoreKeys = null;

  function refreshSaveCodeExport() {
    const el = document.getElementById("saveCodeExportArea");
    if (el) el.value = encodeSaveCode({ excludeTeacher: true });
  }

  refreshSaveCodeExport();

  document.getElementById("saveCodeRefreshBtn")?.addEventListener("click", () => {
    refreshSaveCodeExport();
    const st = document.getElementById("saveCodeStatus");
    if (st) st.textContent = "";
    showToast("Save code refreshed.");
  });

  document.getElementById("saveCodeCopyBtn")?.addEventListener("click", async () => {
    refreshSaveCodeExport();
    const text = document.getElementById("saveCodeExportArea")?.value || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Save code copied.");
    } catch {
      showToast("Copy manually from the save code box.");
    }
  });

  document.getElementById("saveCodeRestoreBtn")?.addEventListener("click", () => {
    const raw = document.getElementById("saveCodeImportArea")?.value.trim() || "";
    const status = document.getElementById("saveCodeStatus");
    if (!raw) {
      if (status) status.textContent = "Paste a code first.";
      return;
    }
    const dec = decodeSaveCode(raw);
    if (!dec.ok) {
      if (status) status.textContent = dec.error;
      return;
    }
    if (status) status.textContent = "";
    pendingRestoreKeys = dec.data.k;
    document.getElementById("restoreSaveModal")?.classList.remove("hidden");
  });

  document.getElementById("restoreSaveCancel")?.addEventListener("click", () => {
    pendingRestoreKeys = null;
    document.getElementById("restoreSaveModal")?.classList.add("hidden");
  });

  document.getElementById("restoreSaveConfirm")?.addEventListener("click", () => {
    if (!pendingRestoreKeys) return;
    applySaveKeys(stripTeacherOnlyKeys(pendingRestoreKeys));
    pendingRestoreKeys = null;
    document.getElementById("restoreSaveModal")?.classList.add("hidden");
    showToast("Restored — reloading…");
    window.location.reload();
  });
}

async function fetchRedeemDefinitions() {
  const res = await fetch("./redeem-codes.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("fetch");
  return res.json();
}

function setupDevTools() {
  fillDevConsumableSelect();

  document.getElementById("devAddCoins")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.coins += 100;
    savePlayer(p);
    renderProfile();
    showToast("+100 coins");
  });
  document.getElementById("devAddXp")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const gr = grantRewards({ xp: 50, coins: 0 });
    handleLevelUp(gr);
    pumpAchievements();
    showToast("+50 XP");
  });
  document.getElementById("devPumpAch")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    pumpAchievements();
    showToast("Achievements re-checked");
  });
  document.getElementById("devFinishCelebration")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    if (window.TAGameCelebration && typeof window.TAGameCelebration.show === "function") {
      window.TAGameCelebration.show({ gameName: "__dev_finish_preview__", force: true });
      showToast("Finish celebration (preview)");
    }
  });
  document.getElementById("devExportSave")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const out = collectHubLocalStorage({ excludeTeacher: false });
    document.getElementById("devImportArea").value = JSON.stringify(out, null, 2);
    showToast("JSON placed in import box.");
  });
  document.getElementById("devImportSave")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    try {
      const raw = document.getElementById("devImportArea").value.trim();
      const obj = JSON.parse(raw);
      if (typeof obj !== "object" || !obj) throw new Error("bad");
      Object.entries(obj).forEach(([k, v]) => {
        if (typeof v === "string") localStorage.setItem(k, v);
      });
      showToast("Imported — reloading");
      window.location.reload();
    } catch {
      showToast("Invalid JSON");
    }
  });
  document.getElementById("devClearBoost")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.pendingBoost = null;
    savePlayer(p);
    renderProfile();
    renderConsumableShelves();
    showToast("Pending boost cleared.");
  });
  document.getElementById("devPresetBoost")?.addEventListener("click", () => {
    queueDevBoost({ kind: "xp_pct", value: 15 });
  });
  document.getElementById("devBoostCoinsPct")?.addEventListener("click", () => {
    queueDevBoost({ kind: "coins_pct", value: 12 });
  });
  document.getElementById("devBoostFlatXp")?.addEventListener("click", () => {
    queueDevBoost({ kind: "flat_xp", value: 10 });
  });
  document.getElementById("devBoostMegamix")?.addEventListener("click", () => {
    queueDevBoost({ kind: "megamix", valueXP: 10, valueCoinsPct: 15 });
  });
  document.getElementById("devBoostUltra")?.addEventListener("click", () => {
    queueDevBoost({ kind: "ultra", valueXP: 15, valueCoins: 12, flatXp: 10 });
  });
  document.getElementById("devQueueConsumable")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const id = document.getElementById("devConsumableSelect")?.value;
    const def = CONSUMABLE_ITEMS.find((c) => c.id === id);
    if (!def) return;
    const p = getPlayer();
    if (p.pendingBoost) {
      showToast("Clear boost first.");
      return;
    }
    p.pendingBoost = { ...def.boost, consumableId: def.id };
    savePlayer(p);
    renderProfile();
    renderConsumableShelves();
    showToast(`${def.label} queued (dev).`);
  });
  document.getElementById("devRedeemApply")?.addEventListener("click", async () => {
    if (!isHubDevUnlocked()) return;
    const result = await redeemCodeTyped(document.getElementById("devRedeemInput")?.value, fetchRedeemDefinitions);
    showToast(result.message);
    if (result.ok) {
      pumpAchievements();
      renderHubGuide();
      renderConsumableShelves();
      renderProfile();
    }
  });
  document.getElementById("devClearRedeemed")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    localStorage.removeItem(REDEEMED_CODES_KEY);
    localStorage.removeItem(REDEEM_HISTORY_KEY);
    showToast("Redeemed codes and redeem history cleared.");
  });
  document.getElementById("devLevel5")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.xp = 5 * XP_PER_LEVEL;
    p.level = calculateLevel(p.xp);
    savePlayer(p);
    pumpAchievements();
    showToast("XP set for level 5.");
  });
  document.getElementById("devLevel10")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.xp = 10 * XP_PER_LEVEL;
    p.level = calculateLevel(p.xp);
    savePlayer(p);
    pumpAchievements();
    showToast("XP set for level 10.");
  });
  document.getElementById("devLevelMax")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.xp = 50 * XP_PER_LEVEL;
    p.level = calculateLevel(p.xp);
    savePlayer(p);
    pumpAchievements();
    showToast("XP set for level 50.");
  });
  document.getElementById("devCoins500")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.coins = 500;
    savePlayer(p);
    renderProfile();
    pumpAchievements();
    showToast("Coins set to 500.");
  });
  document.getElementById("devCoins5000")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.coins = 5000;
    savePlayer(p);
    renderProfile();
    pumpAchievements();
    showToast("Coins set to 5000.");
  });
  document.getElementById("devCoinsZero")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.coins = 0;
    savePlayer(p);
    renderProfile();
    pumpAchievements();
    showToast("Coins set to 0.");
  });
  document.getElementById("devXpZero")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    p.xp = 0;
    savePlayer(p);
    pumpAchievements();
    showToast("XP set to 0.");
  });
  document.getElementById("devCopySaveCode")?.addEventListener("click", async () => {
    if (!isHubDevUnlocked()) return;
    const code = encodeSaveCode({ excludeTeacher: true });
    try {
      await navigator.clipboard.writeText(code);
      showToast("Student save code copied.");
    } catch {
      showToast("Could not copy — use Settings backup box.");
    }
  });
  document.getElementById("devDumpStorage")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith("ta_")) keys.push(k);
    }
    keys.sort();
    const lines = keys.map((k) => {
      const v = localStorage.getItem(k) || "";
      const snippet = v.length > 140 ? `${v.slice(0, 140)}…` : v;
      return `${k} (${v.length} chars): ${snippet}`;
    });
    const ta = document.getElementById("devDebugOut");
    if (ta) ta.value = lines.length ? lines.join("\n") : "(no ta_* keys)";
    showToast("Dump in debug box.");
  });
  document.getElementById("devRevokeSelf")?.addEventListener("click", () => {
    if (!isHubDevUnlocked()) return;
    setDevUnlocked(false);
    syncDevPanel();
    showToast("Dev unlock cleared on this device.");
  });
  document.getElementById("devCopyDebug")?.addEventListener("click", async () => {
    if (!isHubDevUnlocked()) return;
    const p = getPlayer();
    const snap = {
      name: p.name,
      playDevice: p.playDevice,
      level: calculateLevel(p.xp),
      coins: p.coins,
      xp: p.xp,
      pendingBoost: p.pendingBoost,
      at: new Date().toISOString()
    };
    const text = JSON.stringify(snap, null, 2);
    const ta = document.getElementById("devDebugOut");
    if (ta) ta.value = text;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Debug snapshot copied.");
    } catch {
      showToast("Snapshot in debug box — copy manually.");
    }
  });
}

function setupRedeem() {
  const modal = document.getElementById("redeemModal");
  const input = document.getElementById("redeemInput");
  const status = document.getElementById("redeemStatus");
  document.getElementById("redeemSubmit").addEventListener("click", async () => {
    status.textContent = "…";
    const result = await redeemCodeTyped(input.value, fetchRedeemDefinitions);
    status.textContent = result.message;
    if (result.ok) {
      input.value = "";
      pumpAchievements();
      renderHubGuide();
      renderConsumableShelves();
    }
  });
  document.getElementById("redeemClose").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  document.getElementById("openCodesBtn").addEventListener("click", () => {
    status.textContent = "";
    modal.classList.remove("hidden");
    input.focus();
  });
}

function syncAccentSwatches() {
  const cur = getAccent();
  document.querySelectorAll(".accent-picker [data-accent]").forEach((btn) => {
    const on = btn.getAttribute("data-accent") === cur;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function syncSettingsCheckboxes() {
  const s = loadHubSettings();
  const a = document.getElementById("setSkipIntros");
  const b = document.getElementById("setSkipBoot");
  const c = document.getElementById("setReduceMotion");
  const sfx = document.getElementById("setSoundEffects");
  if (a) a.checked = !!s.skipGameIntros;
  if (b) b.checked = !!s.skipHubLoading;
  if (c) c.checked = !!s.reduceMotion;
  if (sfx) sfx.checked = s.soundEffectsEnabled !== false;
  syncAccentSwatches();
}

function setupSettingsToggles() {
  document.getElementById("setSkipIntros")?.addEventListener("change", (e) => {
    saveHubSettings({ skipGameIntros: e.target.checked });
    renderGames();
  });
  document.getElementById("setSkipBoot")?.addEventListener("change", (e) => {
    saveHubSettings({ skipHubLoading: e.target.checked });
  });
  document.getElementById("setReduceMotion")?.addEventListener("change", (e) => {
    saveHubSettings({ reduceMotion: e.target.checked });
    syncReduceMotionClass();
  });
  document.getElementById("setSoundEffects")?.addEventListener("change", (e) => {
    saveHubSettings({ soundEffectsEnabled: e.target.checked });
    showToast(e.target.checked ? "Sound effects on." : "Sound effects off.");
  });
  document.querySelectorAll(".accent-picker [data-accent]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-accent");
      if (id) setAccent(id);
      syncAccentSwatches();
      showToast(`Accent: ${id}.`);
      pumpAchievements();
    });
  });
}

function setupSettings() {
  const settingsTheme = document.getElementById("settingsThemeBtn");
  if (settingsTheme) {
    settingsTheme.addEventListener("click", () => {
      toggleTheme();
      syncThemeButton();
      showToast(getTheme() === "light" ? "Light theme on." : "Dark theme on.");
      pumpAchievements();
    });
  }
  const resetBtn = document.getElementById("resetAllBtn");
  const resetInput = document.getElementById("resetConfirmInput");
  const resetStatus = document.getElementById("resetStatus");
  if (resetBtn && resetInput) {
    resetBtn.addEventListener("click", () => {
      const expected = (getPlayer().name || "").trim().toLowerCase();
      const typed = resetInput.value.trim().toLowerCase();
      if (!expected || typed !== expected) {
        if (resetStatus) resetStatus.textContent = "Type your display name exactly (same spelling as the hub header).";
        return;
      }
      clearAllLocalGameData();
      try {
        sessionStorage.removeItem(SHOP_TAB_STORAGE_KEY);
        sessionStorage.removeItem(HUB_SKIP_BOOT_ONCE_KEY);
      } catch {
        /* ignore */
      }
      markStreakFreshResetToday();
      if (resetStatus) resetStatus.textContent = "";
      window.location.reload();
    });
  }
}

function syncGameSearchClearVisibility() {
  const clearBtn = document.getElementById("gameSearchClear");
  if (!clearBtn || !gameSearchInput) return;
  clearBtn.classList.toggle("hidden", !(gameSearchInput.value && gameSearchInput.value.trim()));
}

function setupQolActions() {
  gameSearchInput.addEventListener("input", () => {
    gameQuery = gameSearchInput.value;
    syncGameSearchClearVisibility();
    renderGames();
  });
  syncGameSearchClearVisibility();
  document.getElementById("gameSearchClear")?.addEventListener("click", () => {
    gameSearchInput.value = "";
    gameQuery = "";
    syncGameSearchClearVisibility();
    renderGames();
    gameSearchInput.focus();
  });
  if (favOnlyFilter) {
    favOnlyFilter.addEventListener("change", () => {
      favOnly = favOnlyFilter.checked;
      renderGames();
    });
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      toggleTheme();
      syncThemeButton();
      showToast(getTheme() === "light" ? "Light theme on." : "Dark theme on.");
      pumpAchievements();
    });
  }
}

function setupHubNav() {
  document.querySelectorAll(".hub-nav-btn[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-view");
      if (id) showView(id);
    });
  });
}

function setupHubHashRouting() {
  window.addEventListener("hashchange", () => {
    if (hubHashSync) return;
    applyHubHashRoute();
  });
}

/** Escape closes hub modals that map cleanly to Cancel/Close (not onboarding). */
function setupHubModalEscape() {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const redeemModal = document.getElementById("redeemModal");
    if (redeemModal && !redeemModal.classList.contains("hidden")) {
      document.getElementById("redeemClose")?.click();
      e.preventDefault();
      return;
    }
    const restoreModal = document.getElementById("restoreSaveModal");
    if (restoreModal && !restoreModal.classList.contains("hidden")) {
      document.getElementById("restoreSaveCancel")?.click();
      e.preventDefault();
      return;
    }
    const devPassModal = document.getElementById("devPassModal");
    if (devPassModal && !devPassModal.classList.contains("hidden")) {
      document.getElementById("devPassCancel")?.click();
      e.preventDefault();
    }
  });
}

function setupShopNav() {
  const shopDd = document.getElementById("shopNavDropdown");
  const shopSummary = document.getElementById("shopNavSummary");
  if (shopDd && shopDd.tagName === "DETAILS" && shopSummary) {
    shopDd.addEventListener("toggle", () => {
      shopSummary.setAttribute("aria-expanded", shopDd.open ? "true" : "false");
    });
  }
  document.querySelectorAll("[data-shop-tab]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = btn.getAttribute("data-shop-tab");
      if (tab) openShop(tab);
    });
  });
  document.addEventListener(
    "click",
    (e) => {
      if (!shopDd || !shopDd.open) return;
      if (!shopDd.contains(e.target)) shopDd.open = false;
    },
    true
  );
}

async function init() {
  const bootEl = document.getElementById("bootSplash");
  let resume = false;
  try {
    resume = new URLSearchParams(window.location.search).get("resume") === "1";
    if (resume) {
      history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
    }
  } catch {
    /* ignore */
  }
  let skipBootOnce = false;
  try {
    skipBootOnce = sessionStorage.getItem(HUB_SKIP_BOOT_ONCE_KEY) === "1";
    if (skipBootOnce) sessionStorage.removeItem(HUB_SKIP_BOOT_ONCE_KEY);
  } catch {
    /* ignore */
  }
  const skipBoot = !!loadHubSettings().skipHubLoading || resume || skipBootOnce;
  if (skipBoot) {
    bootEl?.classList.add("hidden");
  } else {
    await runBootSplash(bootEl, loadHubSettings);
  }

  app.classList.remove("hidden");

  ensurePersonalBestsMigrated();
  initTheme();
  syncThemeButton();
  syncSettingsCheckboxes();
  syncReduceMotionClass();
  setupSettingsToggles();

  const streakResult = applyDailyStreak();
  if (!streakResult.alreadyToday) {
    showToast(
      `Daily check-in: +${streakResult.bonusXp} XP, +${streakResult.bonusCoins} coins. ${streakResult.streak}-day streak!`
    );
    handleLevelUp(streakResult.grantResult);
  }

  setupHubNav();
  setupShopNav();
  setupHubHashRouting();
  setupHubModalEscape();
  applyHubHashRoute();

  setupName();
  setupBriefing();
  setupReviews();
  setupSettings();
  setupSaveBackup();
  setupDevTools();
  setupRedeem();
  setupQolActions();

  renderProfile();
  renderStreakLine();
  renderGames();
  renderHubGuide();
  renderConsumableShelves();
  renderHubFeatures();
  pumpAchievements();

  const pl = getPlayer();
  if (!needsOnboarding(pl) && needsBriefing(pl)) {
    openBriefingModal();
  }
}

init();
