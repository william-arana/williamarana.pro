// Fidget toy: a kaleidoscope parked in the bottom-left corner of the window.
// Settings live behind the cog in the header: version (1 Shards, 2 Julia mirror),
// gravity (drag and throw anywhere, it slows down and stays where it stops), on/off.
(function () {
  "use strict";
  var KEY = "wa-fidget";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ } }
  var state = Object.assign({ style: "shards", gravity: false, on: true, auto: false, x: null, y: null }, load());
  if (state.style !== "julia") state.style = "shards";

  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  // ---------- Toy ----------
  var root = document.createElement("div");
  root.className = "fidget";
  root.innerHTML = '<div class="fidget-toy" role="button" tabindex="0" aria-label="Fidget toy. Click to change the pattern."><canvas></canvas></div>';
  var toy = root.firstChild, canvas = toy.firstChild, ctx = canvas.getContext("2d");

  var size = 112, dpr = 1, M = 16;
  function measure() {
    size = window.innerWidth < 700 ? 72 : 104;
    M = window.innerWidth < 700 ? 12 : 18;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    root.style.setProperty("--fidget-size", size + "px");
    canvas.width = canvas.height = Math.round(size * dpr);
    juliaRes = size < 100 ? 96 : 132;
  }

  // ---------- Position ----------
  var pos = { x: 0, y: 0, vx: 0, vy: 0 }, moving = false, dragging = false;
  function home() { return { x: M, y: window.innerHeight - size - M }; }
  function bounds() { return { minX: 4, minY: 4, maxX: window.innerWidth - size - 4, maxY: window.innerHeight - size - 4 }; }
  function clamp() { var b = bounds(); pos.x = Math.max(b.minX, Math.min(b.maxX, pos.x)); pos.y = Math.max(b.minY, Math.min(b.maxY, pos.y)); }
  function place() { root.style.transform = "translate3d(" + pos.x.toFixed(1) + "px," + pos.y.toFixed(1) + "px,0)"; }
  function setHome(animate) {
    var h = home();
    if (animate) { root.classList.add("returning"); setTimeout(function () { root.classList.remove("returning"); }, 520); }
    pos.x = h.x; pos.y = h.y; pos.vx = pos.vy = 0; moving = false; place();
  }

  // Throw physics: friction slows it down, edges bounce, it stays where it stops.
  function physics(dt) {
    if (!state.gravity || dragging || !moving) return;
    var k = dt / 16.67, f = Math.pow(0.955, k), b = bounds();
    pos.vx *= f; pos.vy *= f;
    pos.x += pos.vx * k; pos.y += pos.vy * k;
    if (pos.x < b.minX) { pos.x = b.minX; pos.vx = -pos.vx * 0.7; }
    if (pos.x > b.maxX) { pos.x = b.maxX; pos.vx = -pos.vx * 0.7; }
    if (pos.y < b.minY) { pos.y = b.minY; pos.vy = -pos.vy * 0.7; }
    if (pos.y > b.maxY) { pos.y = b.maxY; pos.vy = -pos.vy * 0.7; }
    place();
    if (Math.hypot(pos.vx, pos.vy) < 0.05) { moving = false; state.x = pos.x; state.y = pos.y; save(); }
  }

  var start = null, last = null, moved = false;
  toy.addEventListener("pointerdown", function (e) {
    toy.setPointerCapture(e.pointerId);
    dragging = true; moved = false; moving = false;
    start = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    last = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
  });
  toy.addEventListener("pointermove", function (e) {
    if (!dragging || !state.gravity) return;
    var dx = e.clientX - start.px, dy = e.clientY - start.py;
    if (!moved && Math.hypot(dx, dy) > 5) { moved = true; root.classList.add("is-dragging"); }
    if (!moved) return;
    pos.x = start.x + dx; pos.y = start.y + dy; clamp(); place();
    var now = performance.now(), dt = Math.max(1, now - last.t);
    last.vx = 0.5 * last.vx + 0.5 * ((e.clientX - last.x) / dt) * 16.67;
    last.vy = 0.5 * last.vy + 0.5 * ((e.clientY - last.y) / dt) * 16.67;
    last.x = e.clientX; last.y = e.clientY; last.t = now;
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false; root.classList.remove("is-dragging");
    if (!moved) { trigger(); return; }
    var stale = performance.now() - last.t > 80;
    pos.vx = stale ? 0 : Math.max(-45, Math.min(45, last.vx));
    pos.vy = stale ? 0 : Math.max(-45, Math.min(45, last.vy));
    moving = true; state.x = pos.x; state.y = pos.y; save();
  }
  toy.addEventListener("pointerup", endDrag);
  toy.addEventListener("pointercancel", endDrag);
  toy.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); } });

  // ---------- Header settings ----------
  function buildSettings() {
    var panel = document.getElementById("settings-panel");
    if (!panel) return;
    var on = panel.querySelector('[name="fidget-on"]'), grav = panel.querySelector('[name="fidget-gravity"]'), auto = panel.querySelector('[name="fidget-auto"]');
    var radios = panel.querySelectorAll('[name="fidget-style"]');
    function sync() {
      on.checked = !!state.on; grav.checked = !!state.gravity; auto.checked = !!state.auto;
      radios.forEach(function (r) { r.checked = r.value === state.style; r.disabled = !state.on; });
      grav.disabled = auto.disabled = !state.on;
      panel.classList.toggle("toy-off", !state.on);
    }
    sync();
    on.addEventListener("change", function () { state.on = on.checked; save(); applyOn(); sync(); });
    radios.forEach(function (r) { r.addEventListener("change", function () { if (r.checked) { state.style = r.value; save(); } }); });
    auto.addEventListener("change", function () { setAuto(auto.checked); });
    grav.addEventListener("change", function () {
      state.gravity = grav.checked;
      if (!state.gravity) { state.x = state.y = null; setHome(true); }
      root.classList.toggle("is-free", state.gravity);
      save();
    });
  }
  function applyOn() { root.classList.toggle("is-off", !state.on); }

  // ---------- Colors ----------
  var colors = [], rgb = [];
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function readColors() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    colors = dark ? ["#86BC98", "#B5DCC1", "#E2895A", "#9DBB8A", "#E9EFE7"] : ["#2B5140", "#6F8F5E", "#B5481A", "#1F3D30", "#97B486"];
    rgb = colors.map(hex);
    [cur, nxt, zoomers].forEach(function (P) { if (P) P.forEach(function (x) { x.col = rgb[x.c].slice(); }); });
    buildLut(dark);
  }

  // ---------- Version 1: Shards ----------
  // The original morph: every shape glides to its new spot, size and angle.
  // Colors blend through RGB and each shape dips small at the midpoint, where it swaps form.
  var cur, nxt, t1 = 1, n1 = 8, spin = 0;
  function pattern() {
    return Array.from({ length: 6 }, function () {
      var c = Math.floor(Math.random() * 5);
      return { k: pick(["tri", "dia", "circ", "bar", "ring"]), r: 18 + Math.random() * 100, a: Math.random(), z: 7 + Math.random() * 16, c: c, col: rgb[c].slice(), rot: Math.random() * Math.PI };
    });
  }
  // What is on screen at progress t. Clicking mid-morph starts from exactly this, so nothing jumps.
  function mix(p, q, t) {
    var dip = 1 - 0.55 * Math.sin(Math.PI * t);
    return p.map(function (s, i) {
      var o = q[i];
      return {
        k: t < .5 ? s.k : o.k, c: t < .5 ? s.c : o.c,
        r: s.r + (o.r - s.r) * t, a: s.a + (o.a - s.a) * t, rot: s.rot + (o.rot - s.rot) * t,
        z: (s.z + (o.z - s.z) * t) * dip,
        col: [0, 1, 2].map(function (j) { return s.col[j] + (o.col[j] - s.col[j]) * t; })
      };
    });
  }
  function shardsClick() {
    cur = mix(cur, nxt, easeIO(t1));
    nxt = pattern(); n1 = pick([6, 8, 10, 12]); t1 = 0;
  }
  // Auto mode for Shards: an endless zoom. Shapes drift outward and grow; when one
  // leaves the edge it is reborn tiny at the center as a new shape, so the zoom never ends.
  var zoomers = [], zSpeed = 0, zBoost = 0;
  function zoomer(r) {
    var c = Math.floor(Math.random() * 5);
    return { k: pick(["tri", "dia", "circ", "bar", "ring"]), r: r, a: Math.random(), q: 0.12 + Math.random() * 0.1, c: c, col: rgb[c].slice(), rot: Math.random() * Math.PI, vr: (Math.random() - .5) * 0.0008 };
  }
  function startZoom() {
    zoomers = [];
    var shown = mix(cur, nxt, easeIO(t1));
    shown.forEach(function (s) { zoomers.push({ k: s.k, r: Math.max(8, s.r), a: s.a, q: Math.max(.08, s.z / Math.max(8, s.r)), c: s.c, col: s.col.slice(), rot: s.rot, vr: (Math.random() - .5) * 0.0008 }); });
    for (var i = 0; i < 10; i++) zoomers.push(zoomer(6 * Math.pow(1.38, i)));
  }
  function stopZoom() {
    var byR = zoomers.filter(function (z) { return z.r > 14 && z.r < 140; }).slice(0, 6);
    while (byR.length < 6) byR.push(zoomer(30 + Math.random() * 80));
    cur = byR.map(function (z) { return { k: z.k, r: z.r, a: z.a, z: Math.min(24, z.r * z.q), c: z.c, col: z.col.slice(), rot: z.rot }; });
    nxt = cur; t1 = 1;
  }
  function drawZoom(dt) {
    spin += (reduce ? 0 : 0.00012) * dt;
    zBoost *= Math.pow(0.97, dt / 16.67);
    var grow = Math.pow(1 + (reduce ? 0.0001 : 0.00028) * (1 + zBoost), dt);
    var S = canvas.width, wedge = Math.PI / n1;
    for (var i = 0; i < zoomers.length; i++) {
      var Z = zoomers[i]; Z.r *= grow; Z.rot += Z.vr * dt;
      if (Z.r > 190) zoomers[i] = zoomer(4 + Math.random() * 3);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    ctx.translate(S / 2, S / 2); ctx.scale(S / 300, S / 300); ctx.rotate(spin);
    for (var k = 0; k < n1; k++) for (var m = -1; m <= 1; m += 2) {
      ctx.save(); ctx.rotate(k * 2 * wedge); ctx.scale(1, m);
      for (var j = 0; j < zoomers.length; j++) {
        var s = zoomers[j], ang = s.a * wedge, zz = Math.min(40, s.r * s.q);
        ctx.save(); ctx.translate(s.r * Math.cos(ang), s.r * Math.sin(ang)); ctx.rotate(ang + s.rot);
        shape({ k: s.k, z: zz, col: s.col }); ctx.restore();
      }
      ctx.restore();
    }
  }
  function shape(s) {
    var z = s.z, col = "rgb(" + (s.col[0] | 0) + "," + (s.col[1] | 0) + "," + (s.col[2] | 0) + ")"; ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath();
    if (s.k === "circ") ctx.arc(0, 0, z, 0, 6.2832);
    else if (s.k === "ring") { ctx.arc(0, 0, z, 0, 6.2832); ctx.stroke(); return; }
    else if (s.k === "tri") { ctx.moveTo(0, -z); ctx.lineTo(z * .9, z * .6); ctx.lineTo(-z * .9, z * .6); ctx.closePath(); }
    else if (s.k === "dia") { ctx.moveTo(0, -z); ctx.lineTo(z * .6, 0); ctx.lineTo(0, z); ctx.lineTo(-z * .6, 0); ctx.closePath(); }
    else ctx.rect(-z * 1.4, -z * .32, z * 2.8, z * .64);
    ctx.fill();
  }
  function drawShards(dt) {
    spin += (reduce ? 0 : 0.00018) * dt;
    t1 = Math.min(1, t1 + dt / 950);
    var S = canvas.width, ss = mix(cur, nxt, easeIO(t1)), wedge = Math.PI / n1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    ctx.translate(S / 2, S / 2); ctx.scale(S / 300, S / 300); ctx.rotate(spin);
    for (var k = 0; k < n1; k++) for (var m = -1; m <= 1; m += 2) {
      ctx.save(); ctx.rotate(k * 2 * wedge); ctx.scale(1, m);
      for (var i = 0; i < ss.length; i++) {
        var s = ss[i], ang = s.a * wedge;
        ctx.save(); ctx.translate(s.r * Math.cos(ang), s.r * Math.sin(ang)); ctx.rotate(ang + s.rot); shape(s); ctx.restore();
      }
      ctx.restore();
    }
  }

  // ---------- Version 2: Julia mirror ----------
  var seeds = [[-0.7, 0.27], [0.285, 0.01], [-0.8, 0.156], [-0.4, 0.6], [0.355, 0.355], [-0.54, 0.54], [-0.123, 0.745], [-0.75, 0.11]];
  var jFrom = { r: -0.7, i: 0.27 }, jTo = { r: -0.7, i: 0.27 }, jt = 1, phase = 0, fold = 6;
  var juliaRes = 132, buf = document.createElement("canvas"), bctx = buf.getContext("2d"), img = null, lut = null;
  function buildLut(dark) {
    var stops = dark
      ? [[12, 22, 17], [26, 60, 42], [61, 120, 80], [134, 188, 152], [226, 137, 90], [181, 220, 193], [26, 60, 42]]
      : [[31, 61, 48], [43, 81, 64], [111, 143, 94], [181, 205, 160], [240, 200, 140], [181, 72, 26], [31, 61, 48]];
    lut = new Uint8ClampedArray(256 * 3);
    for (var i = 0; i < 256; i++) {
      var f = i / 256 * (stops.length - 1), k = Math.floor(f), u = f - k, A = stops[k], B = stops[k + 1];
      for (var c = 0; c < 3; c++) lut[i * 3 + c] = A[c] + (B[c] - A[c]) * u;
    }
  }
  var aTheta = 1.2, aBlend = 0, aTarget = 0, zoomPhase = 0, lastC = { r: -0.7, i: 0.27 };
  // Trace just outside the edge of the Mandelbrot set's main cardioid: every point there gives a rich spiral Julia set.
  function pathC(th) { var k = 1.02 + 0.015 * Math.sin(th * 3); return { r: k * (0.5 * Math.cos(th) - 0.25 * Math.cos(2 * th)), i: k * (0.5 * Math.sin(th) - 0.25 * Math.sin(2 * th)) }; }
  function juliaClick() {
    if (state.auto) { aTheta += 0.6; fold = pick([4, 6, 8]); return; }
    var e = easeIO(jt);
    jFrom = { r: jFrom.r + (jTo.r - jFrom.r) * e, i: jFrom.i + (jTo.i - jFrom.i) * e };
    var s = pick(seeds); while (Math.abs(s[0] - jTo.r) < 1e-6) s = pick(seeds);
    jTo = { r: s[0], i: s[1] }; jt = 0; fold = pick([4, 6, 8]);
  }
  function drawJulia(dt) {
    phase += (reduce ? 0 : 0.00035) * dt;
    jt = Math.min(1, jt + dt / 1500);
    var e = easeIO(jt);
    var cr = jFrom.r + (jTo.r - jFrom.r) * e + 0.012 * Math.cos(phase * 1.7);
    var ci = jFrom.i + (jTo.i - jFrom.i) * e + 0.012 * Math.sin(phase * 1.3);
    aBlend += (aTarget - aBlend) * Math.min(1, dt / 700);
    if (state.auto) { aTheta += (reduce ? 0.00003 : 0.00011) * dt; zoomPhase += dt * 0.00025; }
    var zf = 1;
    if (aBlend > 0.001) {
      var P = pathC(aTheta), b = easeIO(Math.min(1, aBlend));
      cr = cr + (P.r - cr) * b; ci = ci + (P.i - ci) * b;
      zf = 1 + 0.9 * b * (0.5 - 0.5 * Math.cos(zoomPhase));
    }
    lastC = { r: cr, i: ci };
    var R = juliaRes;
    if (buf.width !== R) { buf.width = buf.height = R; img = bctx.createImageData(R, R); }
    var d = img.data, half = R / 2, sc = 1.55 / half, inv = 1 / zf, wedge = Math.PI / fold, two = 2 * wedge, MAX = 48, LOG2 = Math.log(2), rot = phase * 0.6;
    for (var py = 0; py < R; py++) for (var px = 0; px < R; px++) {
      var X = (px - half) * sc, Y = (py - half) * sc, j = (py * R + px) * 4, r = Math.sqrt(X * X + Y * Y);
      if (r > 1.55) { d[j + 3] = 0; continue; }
      var ang = Math.atan2(Y, X) + rot; ang = ((ang % two) + two) % two; if (ang > wedge) ang = two - ang;
      var zr = r * inv * Math.cos(ang), zi = r * inv * Math.sin(ang), it = 0, m2 = 0;
      for (; it < MAX; it++) { var t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; m2 = zr * zr + zi * zi; if (m2 > 16) break; }
      if (it >= MAX) { d[j + 3] = 0; continue; }
      var mu = it + 1 - Math.log(Math.log(Math.sqrt(m2))) / LOG2, idx = (Math.floor(mu * 9) % 256 + 256) % 256 * 3;
      d[j] = lut[idx]; d[j + 1] = lut[idx + 1]; d[j + 2] = lut[idx + 2];
      d[j + 3] = 255 * Math.min(1, mu / 3) * Math.min(1, (1.55 - r) * 18);
    }
    bctx.putImageData(img, 0, 0);
    var S = canvas.width;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(buf, 0, 0, S, S);
  }

  function setAuto(v) {
    state.auto = !!v; save();
    if (state.auto) { startZoom(); aTarget = 1; }
    else {
      stopZoom(); aTarget = 0;
      jFrom = { r: lastC.r, i: lastC.i }; jTo = { r: lastC.r, i: lastC.i }; jt = 1; aBlend = 0;
    }
  }

  // ---------- Loop ----------
  function trigger() {
    root.classList.remove("pulse"); void root.offsetWidth; root.classList.add("pulse");
    if (state.style === "julia") juliaClick();
    else if (state.auto) { n1 = pick([6, 8, 10, 12]); zBoost = 6; }
    else shardsClick();
  }
  var lastT = performance.now();
  document.addEventListener("visibilitychange", function () { lastT = performance.now(); });
  function frame(now) {
    var dt = Math.min(50, now - lastT); lastT = now;
    if (!document.hidden && state.on) {
      physics(dt);
      if (state.style === "julia") drawJulia(dt);
      else if (state.auto) drawZoom(dt);
      else drawShards(dt);
    }
    requestAnimationFrame(frame);
  }

  function init() {
    document.body.appendChild(root);
    measure(); readColors();
    cur = pattern(); nxt = cur;
    if (state.auto) { startZoom(); aTarget = 1; aBlend = 1; }
    if (state.gravity && state.x != null) { pos.x = state.x; pos.y = state.y; clamp(); place(); } else setHome(false);
    root.classList.toggle("is-free", !!state.gravity);
    applyOn(); buildSettings();
    new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", function () { measure(); if (state.gravity) { clamp(); place(); } else setHome(false); });
    requestAnimationFrame(frame);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
