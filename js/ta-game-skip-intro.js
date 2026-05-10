(function () {
  function hubSettingsSkip() {
    try {
      var raw = localStorage.getItem("ta_hub_settings");
      if (!raw) return false;
      return !!JSON.parse(raw).skipGameIntros;
    } catch (e) {
      return false;
    }
  }

  function paramSkip() {
    try {
      return new URLSearchParams(window.location.search).get("taNoIntro") === "1";
    } catch (e) {
      return false;
    }
  }

  window.TASkipIntro = function TASkipIntro() {
    return paramSkip() || hubSettingsSkip();
  };
})();
