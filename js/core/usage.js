import { loadJson, saveJson } from "./storage.js";

const KEY = "ta_usageStats";

export function trackGameLaunch(gameName) {
  const stats = loadJson(KEY, {});
  stats[gameName] = (stats[gameName] || 0) + 1;
  saveJson(KEY, stats);
}

export function getMostPlayed() {
  const stats = loadJson(KEY, {});
  let winner = "";
  let top = -1;
  Object.entries(stats).forEach(([name, count]) => {
    if (count > top) {
      top = count;
      winner = name;
    }
  });
  return winner ? `${winner} (${top} plays)` : "";
}

export function getTotalLaunches() {
  const stats = loadJson(KEY, {});
  return Object.values(stats).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function getLaunchCount(gameName) {
  const stats = loadJson(KEY, {});
  let n = Number(stats[gameName]) || 0;
  if (gameName === "Corridor Signals") {
    n += Number(stats["Locker Memory"]) || 0;
  }
  return n;
}

export function getUsageStats() {
  return loadJson(KEY, {});
}

/** How many different hub games have been opened at least once. */
export function countDistinctGamesLaunched() {
  const stats = loadJson(KEY, {});
  return Object.entries(stats).filter(([, n]) => Number(n) >= 1).length;
}
