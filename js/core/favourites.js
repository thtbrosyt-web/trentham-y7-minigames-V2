import { loadJson, saveJson } from "./storage.js";

const KEY = "ta_favourites";

export function getFavourites() {
  return loadJson(KEY, []);
}

export function isFavourite(gameName) {
  return getFavourites().includes(gameName);
}

export function toggleFavourite(gameName) {
  const list = [...getFavourites()];
  const i = list.indexOf(gameName);
  if (i >= 0) {
    list.splice(i, 1);
  } else {
    list.push(gameName);
  }
  saveJson(KEY, list);
  return list;
}
