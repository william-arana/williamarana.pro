// Settings panel (header cog) and theme. Light is the default; the choice is saved per browser.
(function () {
  var KEY = "wa-theme", root = document.documentElement;
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked, still works for this visit */ } }
  function apply(t) { if (t === "dark") root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme"); }
  document.addEventListener("DOMContentLoaded", function () {
    var cur = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    document.querySelectorAll('input[name="site-theme"]').forEach(function (r) {
      r.checked = r.value === cur;
      r.addEventListener("change", function () { if (r.checked) { apply(r.value); save(r.value); } });
    });
    var cog = document.getElementById("settings-cog"), panel = document.getElementById("settings-panel");
    if (!cog || !panel) return;
    function open() { panel.hidden = false; cog.setAttribute("aria-expanded", "true"); }
    function close() { panel.hidden = true; cog.setAttribute("aria-expanded", "false"); }
    cog.addEventListener("click", function (e) { e.stopPropagation(); panel.hidden ? open() : close(); });
    document.addEventListener("click", function (e) { if (!panel.hidden && !panel.contains(e.target) && !cog.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { close(); cog.focus(); } });
  });
})();

// Suggestions box: opens the visitor's email app with the note filled in.
document.addEventListener("DOMContentLoaded", function () {
  var f = document.getElementById("suggest");
  if (!f) return;
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var el = f.elements, type = el["type"].value, msg = el["msg"].value.trim(), name = el["name"].value.trim();
    if (!msg) return;
    var body = msg + (name ? "\n\n- " + name : "");
    location.href = "mailto:" + f.getAttribute("data-to") +
      "?subject=" + encodeURIComponent("Site suggestion: " + type) +
      "&body=" + encodeURIComponent(body);
  });
});
