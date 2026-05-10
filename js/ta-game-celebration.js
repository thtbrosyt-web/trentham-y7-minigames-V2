/**
 * Full-screen completion celebration after TAPlatform.submitScore, or dev preview from hub.
 * Load ./js/ta-game-ui.css on hub too if triggering from Settings → Developer tools.
 * Audio optional — see assets/audio/README.txt. Paths resolve from this script’s URL.
 */
(function () {
  var BASE = "../../assets/audio/";
  try {
    var cs = document.currentScript;
    if (cs && cs.src) {
      BASE = new URL("../assets/audio/", cs.src).href;
    }
  } catch (e0) {
    /* keep fallback for older browsers */
  }
  var DEDUP_MS = 1400;
  var last = { t: 0, g: "" };

  function hubSoundEnabled() {
    try {
      var raw = localStorage.getItem("ta_hub_settings");
      if (!raw) return true;
      var o = JSON.parse(raw);
      return o.soundEffectsEnabled !== false;
    } catch (e) {
      return true;
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function playSfx(file, volume) {
    if (!hubSoundEnabled()) return;
    try {
      var a = new Audio(BASE + file);
      a.volume = typeof volume === "number" ? volume : 0.45;
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {
      /* missing file */
    }
  }

  var root;
  var canvas;
  var ctx;
  var fireworksEl;
  var closeBtn;
  var rafId = null;
  var particles = [];
  var startedAt = 0;

  function ensureDom() {
    if (root) return;
    root = document.createElement("div");
    root.id = "ta-celeb-root";
    root.className = "ta-celeb-root ta-celeb-hidden";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="ta-celeb-backdrop" aria-hidden="true"></div>' +
      '<canvas class="ta-celeb-confetti" aria-hidden="true"></canvas>' +
      '<div class="ta-celeb-fireworks" aria-hidden="true"></div>' +
      '<div class="ta-celeb-card ta-panel" role="dialog" aria-modal="true" aria-labelledby="ta-celeb-title">' +
      '<h2 id="ta-celeb-title" class="ta-celeb-heading">Well done!</h2>' +
      '<p class="ta-celeb-lead">Did you enjoy this game?</p>' +
      "<p class=\"ta-celeb-copy\">Head back to the <strong>hub</strong> when you're ready &mdash; open <strong>Badges</strong> to track rewards and collect your <strong>certificate of completion</strong> as you unlock them.</p>" +
      '<button type="button" class="gold-btn ta-celeb-close">Continue</button>' +
      "</div>";
    document.body.appendChild(root);
    canvas = root.querySelector(".ta-celeb-confetti");
    ctx = canvas.getContext("2d");
    fireworksEl = root.querySelector(".ta-celeb-fireworks");
    closeBtn = root.querySelector(".ta-celeb-close");

    closeBtn.addEventListener("click", hide);
    root.querySelector(".ta-celeb-backdrop").addEventListener("click", hide);
  }

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticles(w, h) {
    particles = [];
    var colors = ["#ffe14f", "#ffbf00", "#ff8c42", "#7cdbff", "#d896ff", "#fff", "#9fff9f"];
    var n = prefersReducedMotion() ? 28 : 130;
    var i;
    for (i = 0; i < n; i += 1) {
      particles.push({
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.5,
        vy: 2.2 + Math.random() * 4.5,
        vx: -3 + Math.random() * 6,
        r: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vr: -0.18 + Math.random() * 0.36,
        c: colors[i % colors.length],
        sway: Math.random() * Math.PI * 2
      });
    }
  }

  function spawnFireworks() {
    fireworksEl.innerHTML = "";
    if (prefersReducedMotion()) return;
    var i;
    for (i = 0; i < 12; i += 1) {
      var el = document.createElement("span");
      el.className = "ta-celeb-burst";
      el.style.setProperty("--x", 8 + Math.random() * 84 + "%");
      el.style.setProperty("--y", 12 + Math.random() * 58 + "%");
      el.style.animationDelay = Math.random() * 1.1 + "s";
      fireworksEl.appendChild(el);
    }
  }

  function tick() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var t = Date.now() - startedAt;
    ctx.clearRect(0, 0, w, h);
    var active = false;
    var i;
    var p;
    for (i = 0; i < particles.length; i += 1) {
      p = particles[i];
      p.sway += 0.04;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y < h + 40) active = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r * 0.6, -p.r * 0.6, p.r * 1.2, p.r * 1.2);
      ctx.restore();
    }
    if (active && t < 5500) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function onResize() {
    if (!root || root.classList.contains("ta-celeb-hidden")) return;
    resizeCanvas();
  }

  function hide() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKey);
    root.classList.add("ta-celeb-hidden");
    root.setAttribute("aria-hidden", "true");
    root.classList.remove("ta-celeb-open");
  }

  function onKey(e) {
    if (e.key === "Escape") hide();
  }

  function show(opts) {
    opts = opts || {};
    var g = opts.gameName ? String(opts.gameName) : "";
    var force = opts.force === true;
    var now = Date.now();
    if (!force && g && last.g === g && now - last.t < DEDUP_MS) return;
    last = { t: now, g: g };

    ensureDom();

    var reduced = prefersReducedMotion();
    root.classList.toggle("ta-celeb-reduced", reduced);

    root.classList.remove("ta-celeb-hidden");
    root.setAttribute("aria-hidden", "false");
    root.classList.add("ta-celeb-open");

    playSfx("game-complete.mp3", 0.52);
    if (!reduced) {
      window.setTimeout(function () {
        playSfx("celebration-fireworks.mp3", 0.38);
      }, 240);
    }

    resizeCanvas();
    spawnParticles(window.innerWidth, window.innerHeight);
    spawnFireworks();
    startedAt = Date.now();

    if (!reduced) {
      rafId = window.requestAnimationFrame(tick);
    }

    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);

    window.setTimeout(function () {
      try {
        closeBtn.focus();
      } catch (e2) {
        /* ignore */
      }
    }, 80);
  }

  window.TAGameCelebration = { show: show, hide: hide };
})();
