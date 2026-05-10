import { getPlayer, savePlayer } from "./player.js";
import { getItemById } from "./catalog.js";

export function equipItem(itemId) {
  const player = getPlayer();
  if (!player.unlockedItems.includes(itemId)) {
    return { ok: false, reason: "Item is locked." };
  }
  const item = getItemById(itemId);
  if (!item) {
    return { ok: false, reason: "Item missing." };
  }
  if (item.category === "bundle") {
    return { ok: false, reason: "Equip pieces from the kit separately." };
  }
  player.equipped[item.category] = itemId;
  savePlayer(player);
  return { ok: true, player };
}
