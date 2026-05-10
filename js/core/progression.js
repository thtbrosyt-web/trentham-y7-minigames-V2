import { getPlayer, savePlayer } from "./player.js";
import { isHubDevUnlocked } from "./dev-mode.js";

/** Event-day pacing — faster levels than legacy /100. */
export const XP_PER_LEVEL = 42;

export function calculateLevel(xp) {
  return Math.floor(Math.max(0, Number(xp) || 0) / XP_PER_LEVEL);
}

export function grantRewards({ xp = 0, coins = 0 }) {
  const player = getPlayer();
  const prevLevel = calculateLevel(player.xp);
  let xpAdd = Math.max(0, Math.floor(xp));
  let coinAdd = Math.max(0, Math.floor(coins));
  if (isHubDevUnlocked()) {
    xpAdd = Math.floor(xpAdd * 2.75);
    coinAdd = Math.floor(coinAdd * 2.75);
  }
  player.xp += xpAdd;
  player.coins += coinAdd;
  const newLevel = calculateLevel(player.xp);
  player.level = newLevel;
  savePlayer(player);
  return { player, prevLevel, newLevel, leveledUp: newLevel > prevLevel };
}
