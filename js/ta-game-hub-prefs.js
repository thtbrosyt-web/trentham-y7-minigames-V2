(function () {
  function hubReduceMotion() {
    try {
      var raw = localStorage.getItem("ta_hub_settings");
      if (!raw) return false;
      return !!JSON.parse(raw).reduceMotion;
    } catch (e) {
      return false;
    }
  }

  function prefersReduce() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  if (hubReduceMotion() || prefersReduce()) {
    document.documentElement.classList.add("ta-reduce-motion");
  }
})();
