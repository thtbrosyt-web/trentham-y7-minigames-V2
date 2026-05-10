import { loadJson, saveJson } from "./storage.js";

/** Keep in sync with XP_PER_LEVEL in progression.js */
const XP_PER_LEVEL_SYNC = 42;

export const PLAYER_KEY = "playerData";

export const PLAY_DEVICE_VALUES = ["ipad", "phone", "laptop", "other"];

const defaultPlayer = {
  name: "",
  playDevice: "",
  xp: 0,
  level: 0,
  coins: 0,
  pendingBoost: null,
  /** @type {"" | "boy" | "girl"} */
  guideGender: "",
  briefingComplete: false,
  gamesUnlockedByCode: []
};

export function getPlayer() {
  const merged = { ...defaultPlayer, ...loadJson(PLAYER_KEY, {}) };
  if (merged.pendingBoost === undefined) merged.pendingBoost = null;
  if (merged.playDevice === undefined) merged.playDevice = "";
  if (!Array.isArray(merged.gamesUnlockedByCode)) merged.gamesUnlockedByCode = [];
  if (merged.guideGender !== "boy" && merged.guideGender !== "girl") merged.guideGender = "";
  if (typeof merged.briefingComplete !== "boolean") merged.briefingComplete = false;

  delete merged.unlockedItems;
  delete merged.equipped;
  delete merged.form_god;

  return merged;
}

export function isValidPlayDevice(v) {
  return typeof v === "string" && PLAY_DEVICE_VALUES.includes(v);
}

export function savePlayer(player) {
  player.level = Math.floor(Math.max(0, Number(player.xp) || 0) / XP_PER_LEVEL_SYNC);
  saveJson(PLAYER_KEY, player);
}

export function ensurePlayerName(name) {
  const player = getPlayer();
  player.name = name.trim();
  savePlayer(player);
  return player;
}

/**
 * @param {{ name: string; playDevice: string }} profile
 */
export function setOnboardingProfile(profile) {
  const player = getPlayer();
  player.name = String(profile.name || "").trim();
  player.playDevice = isValidPlayDevice(profile.playDevice) ? profile.playDevice : "";
  savePlayer(player);
  return player;
}

/**
 * @param {{ guideGender: "boy" | "girl" }} briefing
 */
export function setBriefingProfile(briefing) {
  const player = getPlayer();
  const g = briefing.guideGender;
  player.guideGender = g === "boy" || g === "girl" ? g : player.guideGender;
  player.briefingComplete = player.guideGender === "boy" || player.guideGender === "girl";
  savePlayer(player);
  return player;
}

export function needsBriefing(player) {
  return !!(player.name?.trim() && isValidPlayDevice(player.playDevice) && !player.briefingComplete);
}
