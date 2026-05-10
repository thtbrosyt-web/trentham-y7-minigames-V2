export function clearAllLocalGameData() {
  const prefixes = ["leaderboard_", "ta_"];
  const exact = new Set([
    "playerData",
    "schoolReactionTrainerBestMs",
    "ta_pb_legacy_migrated",
    "ta_hub_settings",
    "ta_dev_unlocked",
    "ta_redeemed_codes"
  ]);
  const toRemove = [];
  let i;
  let k;
  // Snapshot keys first — removing during iteration skips keys (length/index shift bug).
  for (i = 0; i < localStorage.length; i += 1) {
    k = localStorage.key(i);
    if (!k) continue;
    if (exact.has(k)) {
      toRemove.push(k);
      continue;
    }
    if (prefixes.some((p) => k.startsWith(p))) {
      toRemove.push(k);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
}
