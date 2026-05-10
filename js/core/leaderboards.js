import { getPersonalBest } from "./personal-bests.js";

export function getBestScore(gameName) {
  return getPersonalBest(gameName);
}
