import { loadHubSettings, saveHubSettings } from "./settings.js";

const KEY = "ta_theme";

const VALID_ACCENTS = new Set(["gold", "ocean", "violet", "emerald", "rose"]);

export function getTheme() {
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function getAccent() {
  const a = loadHubSettings().accent;
  return VALID_ACCENTS.has(a) ? a : "gold";
}

export function applyAppearance() {
  const m = getTheme();
  document.documentElement.dataset.theme = m;
  document.documentElement.dataset.accent = getAccent();
}

export function setTheme(mode) {
  const m = mode === "light" ? "light" : "dark";
  localStorage.setItem(KEY, m);
  applyAppearance();
}

export function initTheme() {
  applyAppearance();
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
  try {
    localStorage.setItem("ta_theme_toggled", JSON.stringify(true));
  } catch {
    /* ignore */
  }
}

export function setAccent(accent) {
  const a = VALID_ACCENTS.has(accent) ? accent : "gold";
  saveHubSettings({ accent: a });
  applyAppearance();
}
