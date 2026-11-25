// Theme toggle. Light is the default; the choice is saved per browser.
(function () {
  var KEY = "wa-theme";
  var root = document.documentElement;

  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage blocked, toggle still works for this visit */ }
  }

  function apply(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      var dark = theme === "dark";
      btn.textContent = dark ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    apply(current);
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      current = current === "dark" ? "light" : "dark";
      apply(current);
      save(current);
    });
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
