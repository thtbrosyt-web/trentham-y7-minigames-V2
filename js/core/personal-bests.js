import { loadJson, saveJson } from "./storage.js";

export const PERSONAL_BESTS_KEY = "ta_personal_bests";
const LEGACY_MIGRATED_KEY = "ta_pb_legacy_migrated";

export function ensurePersonalBestsMigrated() {
  if (loadJson(LEGACY_MIGRATED_KEY, false)) return;
  const bests = loadJson(PERSONAL_BESTS_KEY, {});
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith("leaderboard_")) {
      const rows = loadJson(k, []);
      const gameName = k.slice("leaderboard_".length);
      const top = rows[0];
      const sc = top ? top.score : 0;
      if (sc > (bests[gameName] || 0)) bests[gameName] = sc;
    }
  }
  saveJson(PERSONAL_BESTS_KEY, bests);
  saveJson(LEGACY_MIGRATED_KEY, true);
}

export function getPersonalBest(gameName) {
  ensurePersonalBestsMigrated();
  const bests = loadJson(PERSONAL_BESTS_KEY, {});
  let v = bests[gameName];
  if ((v === undefined || v === 0) && gameName === "Corridor Signals") {
    v = bests["Locker Memory"];
  }
  return Math.max(0, Math.floor(Number(v) || 0));
}
