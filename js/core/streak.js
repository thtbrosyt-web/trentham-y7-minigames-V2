import { loadJson, saveJson } from "./storage.js";
import { grantRewards } from "./progression.js";

const KEY = "ta_streak";

function localDayString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDayString(d);
}

export function getStreakState() {
  return loadJson(KEY, { lastClaim: "", streak: 0 });
}

/**
 * After a full data wipe, avoid showing "daily check-in" again the same calendar day.
 * Does not grant XP/coins — only marks today so applyDailyStreak() returns alreadyToday.
 */
export function markStreakFreshResetToday() {
  saveJson(KEY, { lastClaim: localDayString(), streak: 0 });
}

export function applyDailyStreak() {
  const today = localDayString();
  const data = getStreakState();
  if (data.lastClaim === today) {
    return {
      alreadyToday: true,
      streak: data.streak || 0,
      bonusXp: 0,
      bonusCoins: 0,
      grantResult: null
    };
  }
  let streak = 1;
  const last = data.lastClaim;
  if (last && last === localYesterdayString()) {
    streak = (data.streak || 0) + 1;
  }
  const bonusXp = Math.min(6 + streak * 2, 28);
  const bonusCoins = Math.min(2 + Math.floor(streak / 2), 14);
  const grantResult = grantRewards({ xp: bonusXp, coins: bonusCoins });
  saveJson(KEY, { lastClaim: today, streak });
  return { alreadyToday: false, streak, bonusXp, bonusCoins, grantResult };
}
