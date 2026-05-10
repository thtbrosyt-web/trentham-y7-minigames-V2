import { loadJson, saveJson } from "./storage.js";

export const HUB_SETTINGS_KEY = "ta_hub_settings";

const defaults = {
  skipGameIntros: false,
  skipHubLoading: false,
  reduceMotion: false,
  accent: "gold",
  soundEffectsEnabled: true
};

export function loadHubSettings() {
  const merged = { ...defaults, ...loadJson(HUB_SETTINGS_KEY, {}) };
  return merged;
}

export function saveHubSettings(partial) {
  const next = { ...loadHubSettings(), ...partial };
  saveJson(HUB_SETTINGS_KEY, next);
  return next;
}

export function shouldSkipGameIntroFromStorage() {
  return !!loadHubSettings().skipGameIntros;
}
