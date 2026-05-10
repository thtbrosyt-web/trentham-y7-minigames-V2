/**
 * Hub developer unlock (same key as onboarding dev flow in app.js).
 */
const DEV_LS = "ta_dev_unlocked";

export function isHubDevUnlocked() {
  try {
    return localStorage.getItem(DEV_LS) === "1";
  } catch {
    return false;
  }
}

export function hubDevUnlockStorageKey() {
  return DEV_LS;
}
