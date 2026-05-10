export function showToast(message, duration = 2800) {
  let host = document.getElementById("toastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "toastHost";
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add("toast-visible");
  });
  setTimeout(() => {
    el.classList.remove("toast-visible");
    setTimeout(() => el.remove(), 320);
  }, duration);
}
