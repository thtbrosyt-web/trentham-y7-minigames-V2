(function () {
  var PERSONAL_BESTS_KEY = "ta_personal_bests";
  var LEGACY_MIGRATED_KEY = "ta_pb_legacy_migrated";
  var XP_PER_LEVEL = 42;
  var DAY_EVENT_XP_MULT = 1.5;

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isDevUnlocked() {
    try {
      return localStorage.getItem("ta_dev_unlocked") === "1";
    } catch (e) {
      return false;
    }
  }

  function ensurePersonalBestsMigrated() {
    if (loadJson(LEGACY_MIGRATED_KEY, false)) return;
    var bests = loadJson(PERSONAL_BESTS_KEY, {});
    var i;
    var k;
    for (i = 0; i < localStorage.length; i += 1) {
      k = localStorage.key(i);
      if (k && k.indexOf("leaderboard_") === 0) {
        var rows = loadJson(k, []);
        var gameName = k.slice("leaderboard_".length);
        var top = rows[0];
        var sc = top ? top.score : 0;
        if (sc > (bests[gameName] || 0)) bests[gameName] = sc;
      }
    }
    saveJson(PERSONAL_BESTS_KEY, bests);
    saveJson(LEGACY_MIGRATED_KEY, true);
  }

  function normalizeGameKey(gameName) {
    var g = String(gameName || "");
    if (g === "Locker Memory") return "Corridor Signals";
    return g;
  }

  function getPlayer() {
    return loadJson("playerData", {
      name: "Player",
      xp: 0,
      level: 0,
      coins: 0,
      pendingBoost: null,
      guideGender: "",
      briefingComplete: false,
      gamesUnlockedByCode: []
    });
  }

  function savePlayer(player) {
    player.level = Math.floor(Math.max(0, Number(player.xp) || 0) / XP_PER_LEVEL);
    saveJson("playerData", player);
  }

  function getPersonalBest(gameName) {
    ensurePersonalBestsMigrated();
    var g = normalizeGameKey(gameName);
    var bests = loadJson(PERSONAL_BESTS_KEY, {});
    var v = bests[g];
    if (v === undefined && g === "Corridor Signals") v = bests["Locker Memory"];
    return Math.max(0, Math.floor(Number(v) || 0));
  }

  function recordPersonalBest(gameName, score) {
    ensurePersonalBestsMigrated();
    var g = normalizeGameKey(gameName);
    var safe = Math.max(0, Math.floor(score || 0));
    var bests = loadJson(PERSONAL_BESTS_KEY, {});
    var prev = bests[g] || 0;
    if (safe > prev) {
      bests[g] = safe;
      saveJson(PERSONAL_BESTS_KEY, bests);
    }
  }

  function submitScore(gameName, score, xpReward, coinReward) {
    var g = normalizeGameKey(gameName);
    var xpMultipliers = {
      "School Survival Day": 2,
      "Pack Your Bag": 2,
      "Your First Day": 1.95,
      "Homework Rush": 1.85,
      "School Reaction Trainer": 1.15,
      "Hallway Dash": 1.15,
      "Classroom Chaos": 1.1,
      "iPad Rush": 1.1,
      "Mini Games Hub": 1.25,
      "Bell Break": 1.25,
      "Times Table Rush": 1.5,
      "Spell Sprint": 1.45,
      "Corridor Signals": 1.35,
      "Science Snippets": 1.4,
      "Geography Snap": 1.4,
      "Year 7 Gauntlet": 2,
      "Bonus Class": 1.35
    };
    var multiplier = xpMultipliers[g] || 1.2;
    var player = getPlayer();
    var boost = player.pendingBoost || null;
    var xpAdd = Math.max(0, Math.floor((xpReward || 0) * multiplier * DAY_EVENT_XP_MULT));
    var coinAdd = Math.max(0, Math.floor((coinReward || 0) * DAY_EVENT_XP_MULT));
    if (isDevUnlocked()) {
      xpAdd = Math.floor(xpAdd * 2.35);
      coinAdd = Math.floor(coinAdd * 2.35);
    }
    if (boost) {
      if (boost.kind === "xp_pct") {
        xpAdd = Math.floor(xpAdd * (1 + Math.max(0, Number(boost.value) || 0) / 100));
      } else if (boost.kind === "coins_flat") {
        coinAdd += Math.max(0, Math.floor(Number(boost.value) || 0));
      } else if (boost.kind === "coins_pct") {
        coinAdd = Math.floor(coinAdd * (1 + Math.max(0, Number(boost.value) || 0) / 100));
      } else if (boost.kind === "flat_xp") {
        xpAdd += Math.max(0, Math.floor(Number(boost.value) || 0));
      } else if (boost.kind === "combo") {
        xpAdd = Math.floor(xpAdd * (1 + Math.max(0, Number(boost.valueXP) || 0) / 100));
        coinAdd += Math.max(0, Math.floor(Number(boost.valueCoins) || 0));
      } else if (boost.kind === "megamix") {
        xpAdd = Math.floor(xpAdd * (1 + Math.max(0, Number(boost.valueXP) || 0) / 100));
        coinAdd = Math.floor(coinAdd * (1 + Math.max(0, Number(boost.valueCoinsPct) || 0) / 100));
      } else if (boost.kind === "ultra") {
        xpAdd = Math.floor(xpAdd * (1 + Math.max(0, Number(boost.valueXP) || 0) / 100));
        coinAdd += Math.max(0, Math.floor(Number(boost.valueCoins) || 0));
        xpAdd += Math.max(0, Math.floor(Number(boost.flatXp) || 0));
      }
      player.pendingBoost = null;
    }
    var prevBest = getPersonalBest(g);
    player.xp += xpAdd;
    player.coins += coinAdd;
    savePlayer(player);
    recordPersonalBest(g, score);
    try {
      var sFloor = Math.max(0, Math.floor(Number(score) || 0));
      if (sFloor > prevBest) {
        document.body.classList.add("ta-ui-pb-flash");
        window.setTimeout(function () {
          document.body.classList.remove("ta-ui-pb-flash");
        }, 900);
      }
    } catch (eBr) {
      /* ignore */
    }
    try {
      if (window.TAGameCelebration && typeof window.TAGameCelebration.show === "function") {
        window.TAGameCelebration.show({ gameName: g });
      }
    } catch (eCeleb) {
      /* ignore */
    }
  }

  function getLeaderboard(gameName) {
    void gameName;
    return [];
  }

  window.TAPlatform = {
    submitScore,
    getLeaderboard,
    getPersonalBest,
    getPlayer
  };
})();
