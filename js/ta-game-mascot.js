/**
 * In-game tips buddy: large character + speech bubble (no framed panel).
 * Optional chime: ../../assets/audio/mascot-tip.mp3 (respects hub sound toggle).
 */
(function () {
  var PE_GAMES = {
    "Hallway Dash": true,
    "Times Table Rush": true,
    "Bell Break": true,
    "Bonus Class": true
  };

  var TIPS = {
    "School Survival Day": ["Tap choices quickly — confidence adds up.", "There is often no perfect answer; pick kind.", "You can replay scenes from the summary."],
    "School Reaction Trainer": ["Warm up with a slow breath before GO.", "Green means tap once — don’t double-tap.", "Late taps still count as misses — stay ready."],
    "Pack Your Bag": ["Read each category before dragging.", "Wrong shelf costs time — plan the route.", "Finish lists in order for a cleaner score."],
    "Your First Day": ["Explore options — different paths teach different lessons.", "Confidence rises with thoughtful picks.", "Use Skip Intro if you’ve seen the splash."],
    "Mini Games Hub": ["Try each mini-game once to learn the pace.", "Session score stacks — aim for steady wins.", "Pick your strongest mode and repeat."],
    "Hallway Dash": ["Sidestep early — obstacles spawn faster over time.", "Use both thumbs on tablets for smoother lanes.", "Small movements beat big swipes."],
    "Times Table Rush": ["Say answers aloud to lock memory.", "Skip hardest gaps — come back if there’s time.", "Patterns repeat — spot the anchor row."],
    "Homework Rush": ["Batch similar tasks — rhythm beats rushing.", "Watch the timer on bonus streaks.", "Pause mentally between waves."],
    "Classroom Chaos": ["Prioritise the biggest distractions first.", "Happy meter crashes lose faster than noise.", "Tap clusters when several icons overlap."],
    "iPad Rush": ["Memorise the lane colours early.", "Don’t chase edges — stay centred until boost.", "Power-ups are optional insurance."],
    "Bell Break": ["Rhythm helps — match the bell pulse.", "Chains multiply — avoid greedy taps.", "Miss once, reset calm — panic loses combos."],
    "Spell Sprint": ["Sound out syllables before locking letters.", "Use hints sparingly — they eat streak.", "Short words first buys thinking time."],
    "Corridor Signals": ["Watch the full pattern once before tapping.", "Count aloud during playback.", "Long rounds reward patience over speed."],
    "Science Snippets": ["Read both columns before pairing.", "Eliminate obvious mismatches first.", "Wrong pairs flicker — learn that cue."],
    "Geography Snap": ["Capital-first guesses beat country vibes.", "Eliminate continents mentally.", "Close calls still grant partial XP."],
    "Year 7 Gauntlet": ["Each micro-game uses different muscles — reset mindset.", "Bank safe scores before risky streaks.", "Hydrate between rounds on long runs."],
    "Bonus Class": ["Quick quiz — trust first instincts.", "Play again stacks hub XP gently.", "Good warm-up before heavier titles."]
  };

  function metaGameName() {
    var m = document.querySelector('meta[name="ta-hub-game"]');
    return m && m.getAttribute("content") ? String(m.getAttribute("content")).trim() : "";
  }

  function genderFromPlayer() {
    try {
      var p = window.TAPlatform && window.TAPlatform.getPlayer ? window.TAPlatform.getPlayer() : {};
      var g = p.guideGender;
      return g === "girl" ? "girl" : "boy";
    } catch (e) {
      return "boy";
    }
  }

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

  function tryPlayMascotChime() {
    if (!hubSoundEnabled()) return;
    try {
      var a = new Audio("../../assets/audio/mascot-tip.mp3");
      a.volume = 0.32;
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {
      /* missing file or autoplay policy — ignore */
    }
  }

  function assetUrl(gameName) {
    var name = gameName || metaGameName();
    var g = genderFromPlayer();
    var pe = !!PE_GAMES[name];
    if (pe) {
      return "../../assets/character/guide/pe_" + g + ".png";
    }
    return "../../assets/character/base/base_" + g + ".png";
  }

  function buildWidget(gameName) {
    var resolvedName = gameName || metaGameName();
    var pe = !!PE_GAMES[resolvedName];
    var tips =
      TIPS[resolvedName] || ["Have fun!", "Use pauses if you need a breath.", "Every score feeds hub XP when you return."];

    var tipRotate = 0;

    var wrap = document.createElement("aside");
    wrap.className = "ta-game-mascot";
    wrap.setAttribute("aria-label", "Tips buddy");

    var inner = document.createElement("div");
    inner.className = "ta-game-mascot-inner";

    var bubble = document.createElement("div");
    bubble.className = "ta-game-mascot-bubble";
    bubble.setAttribute("role", "status");

    var lead = document.createElement("p");
    lead.className = "ta-game-mascot-lead";
    lead.textContent = "Hey — need a hand with " + resolvedName + "?";

    var bucket = document.createElement("div");
    bucket.className = "ta-game-mascot-tip-bucket";

    function renderBucket() {
      bucket.innerHTML = "";
      var count = Math.min(3, tips.length);
      for (var i = 0; i < count; i++) {
        var pEl = document.createElement("p");
        pEl.className = "ta-game-mascot-utterance";
        pEl.textContent = tips[(tipRotate + i) % tips.length];
        bucket.appendChild(pEl);
      }
    }

    renderBucket();

    var tipMore = document.createElement("button");
    tipMore.type = "button";
    tipMore.className = "ta-game-mascot-tip-more";
    tipMore.textContent = "Another tip";
    tipMore.setAttribute("aria-label", "Show another tip");
    if (tips.length <= 1) {
      tipMore.hidden = true;
      tipMore.setAttribute("aria-hidden", "true");
    }
    tipMore.addEventListener("click", function () {
      tipRotate = (tipRotate + 1) % tips.length;
      renderBucket();
    });

    var codesLine = document.createElement("p");
    codesLine.className = "ta-game-mascot-utterance ta-game-mascot-codes";
    codesLine.textContent =
      "On the hub, tap Codes for bonus coins and XP — not the same as Backup & restore.";

    bubble.appendChild(lead);
    bubble.appendChild(bucket);
    bubble.appendChild(tipMore);
    bubble.appendChild(codesLine);

    var side = document.createElement("div");
    side.className = "ta-game-mascot-side";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ta-game-mascot-toggle";
    toggle.textContent = "Hide tips";
    toggle.addEventListener("click", function () {
      wrap.classList.toggle("ta-game-mascot--collapsed");
      toggle.textContent = wrap.classList.contains("ta-game-mascot--collapsed") ? "Show tips" : "Hide tips";
    });

    var figure = document.createElement("div");
    figure.className = "ta-game-mascot-character";

    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = assetUrl(resolvedName);
    img.onerror = function () {
      if (pe && img.dataset.peFallback !== "1") {
        img.dataset.peFallback = "1";
        img.src = "../../assets/character/base/base_" + genderFromPlayer() + ".png";
        img.style.display = "";
        return;
      }
      img.style.display = "none";
      var fb = document.createElement("div");
      fb.className = "ta-game-mascot-avatar-fallback";
      fb.textContent = pe ? "🏃" : "🎓";
      figure.appendChild(fb);
    };
    figure.appendChild(img);

    side.appendChild(toggle);
    side.appendChild(figure);

    inner.appendChild(bubble);
    inner.appendChild(side);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);

    tryPlayMascotChime();
  }

  function init() {
    var gameName = metaGameName();
    if (!gameName) return;
    buildWidget(gameName);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
