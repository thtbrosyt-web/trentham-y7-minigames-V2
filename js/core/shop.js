import { getPlayer, savePlayer } from "./player.js";

import { getItemById } from "./catalog.js";



export function unlockItem(itemId) {

  const item = getItemById(itemId);

  if (!item) {

    return { ok: false, reason: "Unknown item." };

  }

  if (item.category === "bundle") {

    return { ok: false, reason: "Use Unlock kit for bundles." };

  }

  const player = getPlayer();

  if (player.unlockedItems.includes(itemId)) {

    return { ok: false, reason: "Already unlocked." };

  }

  if (item.codeExclusive) {

    return { ok: false, reason: "Redeem a code to unlock this item." };

  }

  if (player.coins < item.price) {

    return { ok: false, reason: "Not enough coins." };

  }

  player.coins -= item.price;

  player.unlockedItems.push(itemId);

  savePlayer(player);

  return { ok: true, player };

}



export function unlockBundle(bundleId) {

  const item = getItemById(bundleId);

  if (!item || item.category !== "bundle" || !Array.isArray(item.bundleContents)) {

    return { ok: false, reason: "Unknown kit." };

  }

  const player = getPlayer();

  const missing = item.bundleContents.filter((id) => !player.unlockedItems.includes(id));

  if (!missing.length) {

    return { ok: false, reason: "Kit already owned." };

  }

  if (item.codeExclusive) {

    return { ok: false, reason: "Redeem a code to unlock this kit." };

  }

  if (player.coins < item.price) {

    return { ok: false, reason: "Not enough coins." };

  }

  player.coins -= item.price;

  item.bundleContents.forEach((id) => {

    if (!player.unlockedItems.includes(id)) player.unlockedItems.push(id);

  });

  savePlayer(player);

  return { ok: true, player };

}


