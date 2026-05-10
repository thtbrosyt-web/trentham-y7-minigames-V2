import { loadJson, saveJson } from "./storage.js";
import { getPlayer } from "./player.js";
import { grantRewards, calculateLevel } from "./progression.js";
import { getTotalLaunches, getLaunchCount, countDistinctGamesLaunched } from "./usage.js";
import { getReviewCount } from "./reviews.js";
import { HUB_GAMES } from "./games-list.js";
import { isGameUnlocked, buildUnlockContext, countUnlockedGames } from "./unlocks.js";
import { getStreakState } from "./streak.js";
import { getFavourites } from "./favourites.js";
import { getPersonalBest } from "./personal-bests.js";
import { loadHubSettings } from "./settings.js";

const STORAGE_KEY = "ta_achievements_unlocked";
/** Distinct redeemed codes tracked for badges — keep in sync with REDEEM_HISTORY_KEY in redeem-codes.js */
const REDEEM_HISTORY_LS = "ta_redeem_history";

function r(xp, coins) {
  return { rewardXp: xp, rewardCoins: coins };
}

export const ACHIEVEMENT_DEFS = [
  { id: "hello", label: "Introductions", desc: "Save your player name", icon: "👋", ...r(8, 3) },
  { id: "briefing_done", label: "Briefing star", desc: "Finish your day-one briefing", icon: "📋", ...r(10, 4) },
  { id: "gamer", label: "First bell", desc: "Launch any game once", icon: "🎮", ...r(10, 4) },
  { id: "regular", label: "Hall regular", desc: "Launch games 10 times total", icon: "🏫", ...r(15, 5) },
  { id: "launcher25", label: "Busy bee", desc: "Launch games 25 times total", icon: "🐝", ...r(20, 6) },
  { id: "launcher50", label: "Non-stop", desc: "Launch games 50 times total", icon: "⚡", ...r(30, 10) },
  { id: "launcher75", label: "Power user", desc: "Launch games 75 times total", icon: "🚀", ...r(35, 12) },
  { id: "launcher100", label: "Super fan", desc: "Launch games 100 times total", icon: "💫", ...r(45, 16) },
  { id: "critic", label: "Reviewer", desc: "Save a project review", icon: "⭐", ...r(12, 4) },
  { id: "critic3", label: "Film club", desc: "Save 3 project reviews", icon: "🎬", ...r(22, 8) },
  { id: "critic5", label: "Critic's choice", desc: "Save 5 project reviews", icon: "📝", ...r(30, 10) },
  { id: "newbie", label: "First steps", desc: "Reach level 1", icon: "🌱", ...r(10, 3) },
  { id: "rising", label: "Rising star", desc: "Reach level 2", icon: "📈", ...r(14, 5) },
  { id: "scholar3", label: "Scholar", desc: "Reach level 3", icon: "📚", ...r(18, 6) },
  { id: "grade4", label: "Year 7 pro", desc: "Reach level 4", icon: "📖", ...r(22, 7) },
  { id: "veteran", label: "Senior", desc: "Reach level 5", icon: "🎓", ...r(26, 8) },
  { id: "grade6", label: "Top set", desc: "Reach level 6", icon: "🧠", ...r(30, 9) },
  { id: "master8", label: "Honours", desc: "Reach level 8", icon: "🏆", ...r(36, 12) },
  { id: "master10", label: "Head student", desc: "Reach level 10", icon: "🎖️", ...r(45, 16) },
  { id: "grade12", label: "Expert", desc: "Reach level 12", icon: "📜", ...r(50, 18) },
  { id: "grade15", label: "Legend", desc: "Reach level 15", icon: "👑", ...r(60, 22) },
  { id: "saver", label: "Piggy bank", desc: "Hold 50 coins", icon: "🪙", ...r(12, 5) },
  { id: "rich", label: "Big saver", desc: "Hold 100 coins", icon: "💰", ...r(20, 8) },
  { id: "tycoon", label: "Tycoon", desc: "Hold 200 coins", icon: "🏦", ...r(30, 12) },
  { id: "collector", label: "Variety seeker", desc: "Try 6 different hub games", icon: "🎯", ...r(18, 6) },
  { id: "wardrobe", label: "Wide explorer", desc: "Try 10 different hub games", icon: "🧭", ...r(24, 8) },
  { id: "stylist", label: "Almost everywhere", desc: "Try 14 different hub games", icon: "🗂️", ...r(35, 12) },
  { id: "streak3", label: "Week heart", desc: "Build a 3-day streak", icon: "🔥", ...r(16, 5) },
  { id: "streak7", label: "Dedicated", desc: "Build a 7-day streak", icon: "🌟", ...r(28, 10) },
  { id: "streak14", label: "Unstoppable", desc: "Build a 14-day streak", icon: "🌅", ...r(40, 14) },
  { id: "explorer", label: "Explorer", desc: "Play every game on the hub at least once", icon: "🗺️", ...r(55, 18) },
  { id: "gatecrash", label: "Hall marathon", desc: "Launch games from the hub 30 times in one day-event", icon: "🔓", ...r(35, 12) },
  { id: "favourite", label: "Picked a fave", desc: "Favourite a game on the hub", icon: "❤️", ...r(12, 4) },
  { id: "fav3", label: "Collector of faves", desc: "Favourite 3 different games", icon: "💕", ...r(18, 6) },
  { id: "dashfan", label: "Hallway hero", desc: "Launch Hallway Dash 10 times", icon: "🏃", ...r(20, 7) },
  { id: "survivor", label: "Survival expert", desc: "Launch School Survival Day 10 times", icon: "🛡️", ...r(20, 7) },
  { id: "bellmaster", label: "Bell master", desc: "Score 40 or more in Bell Break (personal best)", icon: "🔔", ...r(25, 8) },
  { id: "theme_split", label: "Lights on", desc: "Switch light or dark theme once", icon: "🌓", ...r(6, 2) },
  { id: "redeem_first", label: "Secret handshake", desc: "Redeem a code successfully once", icon: "🎟️", ...r(10, 4) },
  { id: "redeem_trio", label: "Code collector", desc: "Redeem 3 different codes", icon: "📮", ...r(18, 7) },
  { id: "gauntlet_run", label: "Gauntlet starter", desc: "Play Year 7 Gauntlet once", icon: "🎯", ...r(14, 5) },
  { id: "gauntlet_star", label: "Gauntlet star", desc: "Score 70 or more in Year 7 Gauntlet (personal best)", icon: "🏅", ...r(30, 12) },
  { id: "accent_fan", label: "Colour splash", desc: "Pick a non-gold accent in Settings", icon: "🎨", ...r(8, 3) }
];

export function rewardSummary(def) {
  return `+${def.rewardXp} XP · +${def.rewardCoins} coins`;
}

export function getUnlockedIds() {
  return loadJson(STORAGE_KEY, []);
}

function persistUnlock(id) {
  const u = getUnlockedIds();
  if (u.includes(id)) {
    return false;
  }
  u.push(id);
  saveJson(STORAGE_KEY, u);
  return true;
}

function everyGamePlayedOnce() {
  return HUB_GAMES.every((g) => getLaunchCount(g.name) >= 1);
}

function allGamesUnlockableNow(ctx) {
  return HUB_GAMES.every((g) => isGameUnlocked(g, ctx));
}

function hasFavourite() {
  return getFavourites().length > 0;
}

function getFavouriteCount() {
  return getFavourites().length;
}

function themeWasToggled() {
  return loadJson("ta_theme_toggled", false) === true;
}

function redeemHistoryCount() {
  const arr = loadJson(REDEEM_HISTORY_LS, []);
  return Array.isArray(arr) ? arr.length : 0;
}

function hasNonGoldAccent() {
  const a = loadHubSettings().accent;
  return typeof a === "string" && a.length > 0 && a !== "gold";
}

function buildContext() {
  const player = getPlayer();
  const levelFromXp = calculateLevel(player.xp);
  const uctx = buildUnlockContext();
  return {
    player,
    totalLaunches: getTotalLaunches(),
    reviewCount: getReviewCount(),
    levelFromXp,
    streak: getStreakState().streak || 0,
    uctx,
    distinctGames: countDistinctGamesLaunched()
  };
}

function check(def, ctx) {
  switch (def.id) {
    case "hello":
      return !!ctx.player.name?.trim();
    case "briefing_done":
      return ctx.player.briefingComplete === true && (ctx.player.guideGender === "boy" || ctx.player.guideGender === "girl");
    case "gamer":
      return ctx.totalLaunches >= 1;
    case "regular":
      return ctx.totalLaunches >= 10;
    case "launcher25":
      return ctx.totalLaunches >= 25;
    case "launcher50":
      return ctx.totalLaunches >= 50;
    case "launcher75":
      return ctx.totalLaunches >= 75;
    case "launcher100":
      return ctx.totalLaunches >= 100;
    case "critic":
      return ctx.reviewCount >= 1;
    case "critic3":
      return ctx.reviewCount >= 3;
    case "critic5":
      return ctx.reviewCount >= 5;
    case "newbie":
      return ctx.levelFromXp >= 1;
    case "rising":
      return ctx.levelFromXp >= 2;
    case "scholar3":
      return ctx.levelFromXp >= 3;
    case "grade4":
      return ctx.levelFromXp >= 4;
    case "veteran":
      return ctx.levelFromXp >= 5;
    case "grade6":
      return ctx.levelFromXp >= 6;
    case "master8":
      return ctx.levelFromXp >= 8;
    case "master10":
      return ctx.levelFromXp >= 10;
    case "grade12":
      return ctx.levelFromXp >= 12;
    case "grade15":
      return ctx.levelFromXp >= 15;
    case "saver":
      return ctx.player.coins >= 50;
    case "rich":
      return ctx.player.coins >= 100;
    case "tycoon":
      return ctx.player.coins >= 200;
    case "collector":
      return ctx.distinctGames >= 6;
    case "wardrobe":
      return ctx.distinctGames >= 10;
    case "stylist":
      return ctx.distinctGames >= 14;
    case "streak3":
      return ctx.streak >= 3;
    case "streak7":
      return ctx.streak >= 7;
    case "streak14":
      return ctx.streak >= 14;
    case "explorer":
      return everyGamePlayedOnce();
    case "gatecrash":
      return ctx.totalLaunches >= 30 && allGamesUnlockableNow(ctx.uctx) && countUnlockedGames(HUB_GAMES, ctx.uctx) === HUB_GAMES.length;
    case "favourite":
      return hasFavourite();
    case "fav3":
      return getFavouriteCount() >= 3;
    case "dashfan":
      return getLaunchCount("Hallway Dash") >= 10;
    case "survivor":
      return getLaunchCount("School Survival Day") >= 10;
    case "bellmaster":
      return getPersonalBest("Bell Break") >= 40;
    case "theme_split":
      return themeWasToggled();
    case "redeem_first":
      return redeemHistoryCount() >= 1;
    case "redeem_trio":
      return redeemHistoryCount() >= 3;
    case "gauntlet_run":
      return getLaunchCount("Year 7 Gauntlet") >= 1;
    case "gauntlet_star":
      return getPersonalBest("Year 7 Gauntlet") >= 70;
    case "accent_fan":
      return hasNonGoldAccent();
    default:
      return false;
  }
}

export function evaluateAchievements(onNewUnlock) {
  const newly = [];
  while (true) {
    const ctx = buildContext();
    let progressed = false;
    for (const def of ACHIEVEMENT_DEFS) {
      if (check(def, ctx) && persistUnlock(def.id)) {
        const grantResult = grantRewards({
          xp: def.rewardXp ?? 0,
          coins: def.rewardCoins ?? 0
        });
        newly.push({ def, grantResult });
        onNewUnlock?.(def, grantResult);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return newly;
}

export function getAchievementProgress() {
  const n = getUnlockedIds().length;
  return { unlocked: n, total: ACHIEVEMENT_DEFS.length };
}
