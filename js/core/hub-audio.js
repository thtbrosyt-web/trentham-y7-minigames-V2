import { loadHubSettings } from "./settings.js";

const FILES = {
  "game-start": "./assets/audio/game-start.mp3",
  "level-up": "./assets/audio/level-up.mp3"
};

const cache = {};

function makeAudio(url) {
  try {
    const a = new Audio(url);
    a.preload = "auto";
    return a;
  } catch {
    return null;
  }
}

export function playHubSfx(name) {
  if (!loadHubSettings().soundEffectsEnabled) return;
  const url = FILES[name];
  if (!url) return;
  let inst = cache[name];
  if (!inst) {
    inst = makeAudio(url);
    cache[name] = inst;
  }
  if (!inst) return;
  try {
    inst.currentTime = 0;
    const p = inst.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* ignore */
  }
}
