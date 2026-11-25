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
// Wired on every page load, including pages swapped in by the router below.
function waInitPage() {
  var f = document.getElementById("suggest");
  if (!f || f.dataset.wired) return;
  f.dataset.wired = "1";
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var el = f.elements, type = el["type"].value, msg = el["msg"].value.trim(), name = el["name"].value.trim();
    if (!msg) return;
    var body = msg + (name ? "\n\n- " + name : "");
    location.href = "mailto:" + f.getAttribute("data-to") +
      "?subject=" + encodeURIComponent("Site suggestion: " + type) +
      "&body=" + encodeURIComponent(body);
  });
}
document.addEventListener("DOMContentLoaded", waInitPage);

// Seamless page changes: internal links swap only <main>, the title and the nav state,
// so the header, settings and fidget toy keep running without a reload.
(function () {
  if (!window.fetch || !history.pushState) return;
  var busy = null;
  function internal(a) {
    if (!a || a.target && a.target !== "_self" || a.hasAttribute("download")) return false;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return false;
    if (/\.(pdf|jpg|jpeg|png|svg|gif|mp4|zip|xml|txt|json|css|js)$/i.test(u.pathname)) return false;
    return u;
  }
  function setNav(path) {
    document.querySelectorAll(".nav a").forEach(function (a) {
      var h = new URL(a.href).pathname, on = h === "/" ? path === "/" : path.indexOf(h) === 0;
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  function go(url, push) {
    if (busy) busy.abort();
    var ctl = busy = new AbortController();
    document.documentElement.classList.add("is-loading");
    fetch(url.href, { signal: ctl.signal, headers: { "X-Requested-With": "wa-router" } })
      .then(function (r) {
        if (!r.ok || !/text\/html/.test(r.headers.get("content-type") || "")) throw new Error("bad");
        return r.text().then(function (t) { return { t: t, final: new URL(r.url) }; });
      })
      .then(function (res) {
        var doc = new DOMParser().parseFromString(res.t, "text/html");
        var nm = doc.querySelector("main"), om = document.querySelector("main");
        if (!nm || !om) throw new Error("no main");
        var final = res.final; final.hash = url.hash;
        if (push) history.pushState({ wa: 1 }, "", final.pathname + final.search + final.hash);
        document.title = doc.title;
        var d = doc.querySelector('meta[name="description"]'), cd = document.querySelector('meta[name="description"]');
        if (d && cd) cd.setAttribute("content", d.getAttribute("content"));
        om.replaceWith(nm);
        setNav(final.pathname);
        if (final.hash) { var t = document.getElementById(decodeURIComponent(final.hash.slice(1))); t ? t.scrollIntoView() : scrollTo(0, 0); }
        else if (push) scrollTo(0, 0);
        waInitPage();
        nm.setAttribute("tabindex", "-1"); nm.focus({ preventScroll: true });
      })
      .catch(function (e) { if (e.name !== "AbortError") location.href = url.href; })
      .finally(function () { if (busy === ctl) { busy = null; document.documentElement.classList.remove("is-loading"); } });
  }
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    var u = internal(a);
    if (!u) return;
    if (u.pathname === location.pathname && u.search === location.search && u.hash) return; // same-page jump
    e.preventDefault();
    go(u, true);
  });
  history.scrollRestoration = "manual";
  var saveScroll = function () { history.replaceState(Object.assign({}, history.state, { y: scrollY, wa: 1 }), ""); };
  addEventListener("scroll", function () { clearTimeout(saveScroll.t); saveScroll.t = setTimeout(saveScroll, 150); }, { passive: true });
  addEventListener("popstate", function (e) {
    var y = e.state && e.state.y;
    var u = new URL(location.href);
    go(u, false);
    if (y != null) setTimeout(function () { scrollTo(0, y); }, 60);
  });
})();
