/**
 * Portable single-line save codes for Settings (student-safe: no teacher flags).
 * Format: THTSAVE1_ + base64url(JSON { v, c checksum, k: { storageKey: rawString } })
 */

export const SAVE_CODE_MAGIC = "THTSAVE1_";
export const SAVE_CODE_VERSION = 1;

export const SAVE_BLOB_KEYS = [
  "playerData",
  "ta_achievements_unlocked",
  "ta_usageStats",
  "ta_gameRatings",
  "ta_reviews",
  "ta_reviewQueue",
  "ta_favourites",
  "ta_personal_bests",
  "ta_streak",
  "ta_pb_legacy_migrated",
  "ta_hub_settings",
  "ta_redeemed_codes",
  "ta_redeem_history"
];

const TEACHER_ONLY_KEYS = new Set(["ta_dev_unlocked"]);

function fnv1aHex(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function canonicalKeyBlob(keysObj) {
  const sorted = {};
  Object.keys(keysObj)
    .sort()
    .forEach((k) => {
      sorted[k] = keysObj[k];
    });
  return JSON.stringify(sorted);
}

/**
 * @param {{ excludeTeacher?: boolean }} opts
 * @returns {Record<string, string>}
 */
export function collectHubLocalStorage(opts = {}) {
  const excludeTeacher = !!opts.excludeTeacher;
  const out = {};
  SAVE_BLOB_KEYS.forEach((k) => {
    if (excludeTeacher && TEACHER_ONLY_KEYS.has(k)) return;
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  });
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("ta_") || SAVE_BLOB_KEYS.includes(k)) continue;
    if (excludeTeacher && TEACHER_ONLY_KEYS.has(k)) continue;
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

function toBase64Url(jsonStr) {
  const bytes = new TextEncoder().encode(jsonStr);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * @param {{ excludeTeacher?: boolean }} opts
 */
export function encodeSaveCode(opts = {}) {
  const k = collectHubLocalStorage(opts);
  const canon = canonicalKeyBlob(k);
  const c = fnv1aHex(canon);
  const inner = JSON.stringify({ v: SAVE_CODE_VERSION, c, k });
  return SAVE_CODE_MAGIC + toBase64Url(inner);
}

/**
 * @returns {{ ok: true, data: { v: number, k: Record<string, string> } } | { ok: false, error: string }}
 */
export function decodeSaveCode(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed.startsWith(SAVE_CODE_MAGIC)) {
    return { ok: false, error: "Not a save code (wrong prefix)." };
  }
  let inner;
  try {
    inner = fromBase64Url(trimmed.slice(SAVE_CODE_MAGIC.length));
  } catch {
    return { ok: false, error: "Could not read code (damaged Base64)." };
  }
  let parsed;
  try {
    parsed = JSON.parse(inner);
  } catch {
    return { ok: false, error: "Could not read code (bad JSON)." };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "Invalid payload." };
  if (parsed.v !== SAVE_CODE_VERSION) return { ok: false, error: "This code is for a different hub version." };
  if (typeof parsed.c !== "string" || typeof parsed.k !== "object" || !parsed.k) {
    return { ok: false, error: "Invalid save structure." };
  }
  const canon = canonicalKeyBlob(parsed.k);
  if (fnv1aHex(canon) !== parsed.c) return { ok: false, error: "Code checksum failed — try copying again." };
  Object.keys(parsed.k).forEach((key) => {
    if (typeof parsed.k[key] !== "string") delete parsed.k[key];
  });
  return { ok: true, data: { v: parsed.v, k: parsed.k } };
}

/** Remove keys that must not be applied from student-shared saves. */
export function stripTeacherOnlyKeys(k) {
  const out = { ...k };
  TEACHER_ONLY_KEYS.forEach((tk) => {
    delete out[tk];
  });
  return out;
}

/** @param {Record<string, string>} k */
export function applySaveKeys(k) {
  Object.entries(k).forEach(([key, val]) => {
    if (typeof val === "string") localStorage.setItem(key, val);
  });
}
