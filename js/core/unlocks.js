import { calculateLevel } from "./progression.js";
import { getPlayer } from "./player.js";
import { getLaunchCount } from "./usage.js";
import { isHubDevUnlocked } from "./dev-mode.js";

export function buildUnlockContext() {
  const player = getPlayer();
  const level = calculateLevel(player.xp);
  return { player, level };
}

export function isGameUnlocked(game, ctx) {
  if (isHubDevUnlocked()) return true;
  const codeNames = ctx.player.gamesUnlockedByCode || [];
  if (codeNames.includes(game.name)) return true;
  const rule = game.unlock;
  if (!rule || rule.type === "always") return true;
  if (rule.type === "code") return false;
  if (rule.type === "level") return ctx.level >= rule.min;
  if (rule.type === "played") return getLaunchCount(rule.game) >= 1;
  return true;
}

export function formatUnlockRequirement(game) {
  const rule = game.unlock;
  if (!rule || rule.type === "always") return "";
  if (rule.type === "code") return "Redeem a secret code";
  if (rule.type === "level") return `Reach level ${rule.min}`;
  if (rule.type === "played") return `Play “${rule.game}” once`;
  return "";
}

export function countUnlockedGames(games, ctx) {
  return games.filter((g) => isGameUnlocked(g, ctx)).length;
}
