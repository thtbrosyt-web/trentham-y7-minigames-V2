/**
 * Optional help (?): include after bridge-global.js on game pages.
 * Add <body class="ta-game-page"> and meta name="ta-game-help" content="Short how-to line."
 */
(function () {
  var meta = document.querySelector('meta[name="ta-game-help"]');
  var text = meta && meta.getAttribute("content") ? String(meta.getAttribute("content")).trim() : "";
  if (!text) return;

  document.body.classList.add("ta-game-page");

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ta-help-trigger";
  btn.setAttribute("aria-label", "How to play");
  btn.textContent = "?";

  var backdrop = document.createElement("div");
  backdrop.className = "ta-help-backdrop ta-help-hidden";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "How to play");

  var modal = document.createElement("div");
  modal.className = "ta-help-modal";

  var h = document.createElement("h2");
  h.textContent = "How to play";

  var p = document.createElement("p");
  p.textContent = text;

  var close = document.createElement("button");
  close.type = "button";
  close.className = "gold-btn ta-help-close";
  close.textContent = "Got it";

  var prevFocus = null;

  function focusablesInModal() {
    return Array.prototype.slice
      .call(
        modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === close;
      });
  }

  function onDocKeydown(e) {
    if (backdrop.classList.contains("ta-help-hidden")) return;

    if (e.key === "Escape") {
      shut();
      e.preventDefault();
      return;
    }

    if (e.key !== "Tab") return;

    var list = focusablesInModal();
    if (!list.length) return;

    if (!modal.contains(document.activeElement)) {
      e.preventDefault();
      list[0].focus();
      return;
    }

    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open() {
    prevFocus = document.activeElement;
    backdrop.classList.remove("ta-help-hidden");
    document.addEventListener("keydown", onDocKeydown, true);
    window.setTimeout(function () {
      close.focus();
    }, 0);
  }

  function shut() {
    backdrop.classList.add("ta-help-hidden");
    document.removeEventListener("keydown", onDocKeydown, true);
    if (prevFocus && typeof prevFocus.focus === "function") {
      try {
        prevFocus.focus();
      } catch (err) {
        /* ignore */
      }
    }
    prevFocus = null;
  }

  btn.addEventListener("click", open);
  close.addEventListener("click", shut);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) shut();
  });

  modal.appendChild(h);
  modal.appendChild(p);
  modal.appendChild(close);
  backdrop.appendChild(modal);
  document.body.appendChild(btn);
  document.body.appendChild(backdrop);
})();
