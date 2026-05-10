import { loadJson, saveJson } from "./storage.js";
import { getPlayer, savePlayer } from "./player.js";
import { ACHIEVEMENT_DEFS } from "./achievements.js";
import { HUB_GAMES } from "./games-list.js";

const VALID_GAME_NAMES = new Set(HUB_GAMES.map((g) => g.name));

const ACHIEVEMENTS_STORAGE_KEY = "ta_achievements_unlocked";

export const REDEEMED_CODES_KEY = "ta_redeemed_codes";
/** Distinct codes redeemed successfully (any type) — for achievements; must match achievements.js usage. */
export const REDEEM_HISTORY_KEY = "ta_redeem_history";

export function getRedeemedSet() {
  return new Set(loadJson(REDEEMED_CODES_KEY, []));
}

function addRedeemed(codeNorm) {
  const arr = [...getRedeemedSet()];
  arr.push(codeNorm);
  saveJson(REDEEMED_CODES_KEY, arr);
}

function recordRedeemHistory(codeNorm) {
  const hist = loadJson(REDEEM_HISTORY_KEY, []);
  if (!hist.includes(codeNorm)) {
    hist.push(codeNorm);
    saveJson(REDEEM_HISTORY_KEY, hist);
  }
}

/**
 * @returns {{ unknown: string[] }}
 */
function mergeUnlockGames(player, rawList) {
  const unknown = [];
  if (!Array.isArray(rawList)) return { unknown };
  if (!Array.isArray(player.gamesUnlockedByCode)) player.gamesUnlockedByCode = [];
  rawList.forEach((raw) => {
    const name = String(raw || "").trim();
    if (!name) return;
    if (!VALID_GAME_NAMES.has(name)) {
      unknown.push(name);
      return;
    }
    if (!player.gamesUnlockedByCode.includes(name)) player.gamesUnlockedByCode.push(name);
  });
  return { unknown };
}

/**
 * @param {unknown} raw
 * @returns {Promise<{ ok: boolean; message: string }>}
 */
export async function redeemCodeTyped(codeRaw, fetchDefinitions) {
  const codeNorm = String(codeRaw || "")
    .trim()
    .toUpperCase();
  if (!codeNorm) return { ok: false, message: "Enter a code." };

  let defs = [];
  try {
    defs = (await fetchDefinitions()) || [];
  } catch {
    return { ok: false, message: "Could not load codes file." };
  }
  if (!Array.isArray(defs)) return { ok: false, message: "Invalid codes file." };

  const entry = defs.find((d) => String(d.code || "").toUpperCase() === codeNorm);
  if (!entry) return { ok: false, message: "That code is not valid." };

  if (entry.oncePerDevice) {
    if (getRedeemedSet().has(codeNorm)) {
      return { ok: false, message: "This code was already used on this device." };
    }
  }

  const player = getPlayer();
  let extraMsg = "";
  if (entry.grantEverything) {
    player.coins += 99999;
    player.xp += 99999;
    const allIds = ACHIEVEMENT_DEFS.map((d) => d.id);
    saveJson(ACHIEVEMENTS_STORAGE_KEY, allIds);
    if (!Array.isArray(player.gamesUnlockedByCode)) player.gamesUnlockedByCode = [];
    HUB_GAMES.forEach((g) => {
      if (!player.gamesUnlockedByCode.includes(g.name)) player.gamesUnlockedByCode.push(g.name);
    });
  } else {
    if (typeof entry.coins === "number") player.coins += Math.max(0, Math.floor(entry.coins));
    if (typeof entry.xp === "number") player.xp += Math.max(0, Math.floor(entry.xp));
    if (Array.isArray(entry.unlockGames)) {
      const { unknown } = mergeUnlockGames(player, entry.unlockGames);
      if (unknown.length) {
        extraMsg = ` Note: unknown game name(s) skipped: ${unknown.join(", ")}.`;
      }
    }
  }
  savePlayer(player);
  recordRedeemHistory(codeNorm);
  if (entry.oncePerDevice) addRedeemed(codeNorm);
  return { ok: true, message: (entry.message || "Reward applied!") + extraMsg };
}
