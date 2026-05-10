const TIPS = [
  "Star your favourite games so you can filter the list quickly.",
  "Daily streak gives you a small XP and coin bonus when you return.",
  "The tiny Codes link at the bottom can unlock small extras — look around the site for hints.",
  "Badges often give both XP and coins — check the Badges tab after playing.",
  "Canteen boosts apply once on your next game score — buy before you play.",
  "Made with care by Matei · THTLabs."
];

/**
 * @param {HTMLElement | null} el
 * @param {{ (): { reduceMotion?: boolean } }} getSettings
 */
export function runBootSplash(el, getSettings) {
  if (!el) return Promise.resolve();

  const reduce = !!getSettings?.()?.reduceMotion;
  const minMs = reduce ? 400 : 2500 + Math.random() * 1500;
  const tipEl = el.querySelector("[data-boot-tip]");
  const barEl = el.querySelector("[data-boot-bar]");
  const pctEl = el.querySelector("[data-boot-pct]");
  let tipIx = 0;

  el.classList.remove("hidden");
  el.setAttribute("aria-busy", "true");

  const tipTimer = setInterval(() => {
    if (!tipEl) return;
    tipIx = (tipIx + 1) % TIPS.length;
    tipEl.textContent = TIPS[tipIx];
  }, reduce ? 99999 : 1600);

  const start = performance.now();
  let raf = 0;
  function tick(now) {
    const t = Math.min(1, (now - start) / minMs);
    if (barEl) barEl.style.width = `${Math.round(t * 100)}%`;
    if (pctEl) pctEl.textContent = `${Math.round(t * 100)}%`;
    if (t < 1) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return new Promise((resolve) => {
    setTimeout(() => {
      cancelAnimationFrame(raf);
      clearInterval(tipTimer);
      el.classList.add("hidden");
      el.setAttribute("aria-busy", "false");
      resolve();
    }, minMs);
  });
}
