import { getPlayer, savePlayer } from "./player.js";
import { showToast } from "./toasts.js";

/**
 * shelf: "canteen" (cheap snacks) | "boost" (pricier one-shot bonuses)
 * boost kinds (processed in bridge submitScore): xp_pct, coins_flat, combo, coins_pct, flat_xp
 */
export const CONSUMABLE_ITEMS = [
  // Canteen — small effects, low prices
  { id: "ct_apple", shelf: "canteen", label: "Apple", description: "+5% XP on your next score.", price: 8, boost: { kind: "xp_pct", value: 5 } },
  { id: "ct_crisps", shelf: "canteen", label: "Crisps", description: "+3 bonus coins on your next score.", price: 10, boost: { kind: "coins_flat", value: 3 } },
  { id: "ct_water", shelf: "canteen", label: "Water bottle", description: "+6% XP on your next score.", price: 12, boost: { kind: "xp_pct", value: 6 } },
  { id: "ct_banana", shelf: "canteen", label: "Banana", description: "+4 bonus coins on your next score.", price: 11, boost: { kind: "coins_flat", value: 4 } },
  { id: "ct_yogurt", shelf: "canteen", label: "Yogurt pot", description: "+4% XP and +2 coins on your next score.", price: 16, boost: { kind: "combo", valueXP: 4, valueCoins: 2 } },
  { id: "ct_toast", shelf: "canteen", label: "Toast", description: "+7% XP on your next score.", price: 14, boost: { kind: "xp_pct", value: 7 } },
  { id: "ct_juice", shelf: "canteen", label: "Fruit juice", description: "+12% XP on your next score.", price: 18, boost: { kind: "xp_pct", value: 12 } },
  { id: "ct_cookie", shelf: "canteen", label: "Cookie", description: "+8 bonus coins on your next score.", price: 22, boost: { kind: "coins_flat", value: 8 } },
  { id: "ct_sandwich", shelf: "canteen", label: "Half sandwich", description: "+5% bonus coins from your next score.", price: 20, boost: { kind: "coins_pct", value: 5 } },
  { id: "ct_wrap", shelf: "canteen", label: "Veg wrap", description: "+6% XP and +3 coins on your next score.", price: 24, boost: { kind: "combo", valueXP: 6, valueCoins: 3 } },
  { id: "ct_hot_choc", shelf: "canteen", label: "Hot chocolate", description: "+5 flat XP on your next score (after multipliers).", price: 17, boost: { kind: "flat_xp", value: 5 } },
  { id: "ct_flapjack", shelf: "canteen", label: "Flapjack", description: "+9% XP on your next score.", price: 21, boost: { kind: "xp_pct", value: 9 } },
  { id: "ct_cheese", shelf: "canteen", label: "Cheese roll", description: "+6 bonus coins on your next score.", price: 15, boost: { kind: "coins_flat", value: 6 } },
  { id: "ct_soup", shelf: "canteen", label: "Soup cup", description: "+8 flat XP on your next score (after multipliers).", price: 23, boost: { kind: "flat_xp", value: 8 } },
  { id: "ct_muffin", shelf: "canteen", label: "Muffin", description: "+7% bonus coins from your next score.", price: 26, boost: { kind: "coins_pct", value: 7 } },
  { id: "ct_combo_meal", shelf: "canteen", label: "Meal deal", description: "+8% XP and +5 coins on your next score.", price: 38, boost: { kind: "combo", valueXP: 8, valueCoins: 5 } },

  // Boosts — bigger punch, higher prices
  { id: "bs_energy", shelf: "boost", label: "Energy drink", description: "+18% XP on your next score.", price: 55, boost: { kind: "xp_pct", value: 18 } },
  { id: "bs_protein", shelf: "boost", label: "Protein bar", description: "+18 bonus coins on your next score.", price: 58, boost: { kind: "coins_flat", value: 18 } },
  { id: "bs_study_pack", shelf: "boost", label: "Study pack", description: "+12% XP and +10 coins on your next score.", price: 85, boost: { kind: "combo", valueXP: 12, valueCoins: 10 } },
  { id: "bs_coin_magnet", shelf: "boost", label: "Coin magnet", description: "+22% bonus coins from your next score.", price: 72, boost: { kind: "coins_pct", value: 22 } },
  { id: "bs_xp_amp", shelf: "boost", label: "XP amplifier", description: "+25% XP on your next score.", price: 95, boost: { kind: "xp_pct", value: 25 } },
  { id: "bs_brain_fuel", shelf: "boost", label: "Brain fuel", description: "+15 flat XP on your next score (after multipliers).", price: 68, boost: { kind: "flat_xp", value: 15 } },
  { id: "bs_lunch_premium", shelf: "boost", label: "Chef special", description: "+18% XP and +14 bonus coins on your next score.", price: 120, boost: { kind: "combo", valueXP: 18, valueCoins: 14 } },
  { id: "bs_mega_mult", shelf: "boost", label: "Mega multi", description: "+15% XP and +20% coins from your next score.", price: 140, boost: { kind: "megamix", valueXP: 15, valueCoinsPct: 20 } },
  { id: "bs_ultra_combo", shelf: "boost", label: "Ultra combo", description: "+22% XP, +18 coins, +25 flat XP.", price: 175, boost: { kind: "ultra", valueXP: 22, valueCoins: 18, flatXp: 25 } }
];

/** @deprecated use CONSUMABLE_ITEMS filtered by shelf */
export const CANTEEN_ITEMS = CONSUMABLE_ITEMS.filter((c) => c.shelf === "canteen");

export function buyConsumable(itemId) {
  const def = CONSUMABLE_ITEMS.find((c) => c.id === itemId);
  if (!def) return { ok: false, reason: "Unknown item." };
  const player = getPlayer();
  if (player.pendingBoost) {
    return { ok: false, reason: "Use your current boost in a game first." };
  }
  if (player.coins < def.price) {
    return { ok: false, reason: "Not enough coins." };
  }
  player.coins -= def.price;
  player.pendingBoost = { ...def.boost, consumableId: def.id };
  savePlayer(player);
  showToast(`${def.label} ready — play a game to use it.`);
  return { ok: true, player };
}

/** @deprecated use buyConsumable */
export function buyCanteenItem(itemId) {
  return buyConsumable(itemId);
}
