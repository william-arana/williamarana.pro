// Fidget toy: a kaleidoscope you can click, drag and throw.
// Styles: "shards" (default) and "julia". Settings: style, gravity, hide, reset.
(function () {
  "use strict";
  var KEY = "wa-fidget";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ } }
  var state = Object.assign({ style: "shards", gravity: false, hidden: false, x: null, y: null }, load());

  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };

  // ---------- DOM ----------
  var root = document.createElement("div");
  root.className = "fidget";
  root.innerHTML =
    '<div class="fidget-toy" role="button" tabindex="0" aria-label="Fidget toy. Click to change the pattern, drag to move.">' +
    '<canvas></canvas></div>' +
    '<button class="fidget-gear" type="button" aria-label="Fidget toy settings" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>' +
    '</button>' +
    '<div class="fidget-panel" hidden>' +
    '<p class="fidget-title">Fidget toy</p>' +
    '<fieldset><legend>Style</legend>' +
    '<label><input type="radio" name="fidget-style" value="shards"> Shards</label>' +
    '<label><input type="radio" name="fidget-style" value="julia"> Julia mirror</label></fieldset>' +
    '<label class="fidget-switch"><input type="checkbox" name="fidget-gravity"> Gravity</label>' +
    '<div class="fidget-actions"><button type="button" data-act="reset">Reset position</button>' +
    '<button type="button" data-act="hide">Hide toy</button></div>' +
    '</div>';
  var toy = root.querySelector(".fidget-toy");
  var canvas = root.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var gear = root.querySelector(".fidget-gear");
  var panel = root.querySelector(".fidget-panel");

  var size = 112, dpr = 1;
  function measure() {
    size = window.innerWidth < 700 ? 72 : 112;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    root.style.setProperty("--fidget-size", size + "px");
    canvas.width = canvas.height = Math.round(size * dpr);
    juliaRes = size < 100 ? 96 : 140;
  }

  // ---------- Position + physics ----------
  var pos = { x: 0, y: 0, vx: 0, vy: 0 }, dragging = false, resting = true;
  function defaultPos() {
    if (window.innerWidth < 700) return { x: 12, y: window.innerHeight - size - 20 };
    return { x: 20, y: Math.round(window.innerHeight / 2 - size / 2) };
  }
  function clamp() {
    var maxX = window.innerWidth - size - 4, maxY = window.innerHeight - size - 4;
    pos.x = Math.max(4, Math.min(maxX, pos.x));
    pos.y = Math.max(4, Math.min(maxY, pos.y));
  }
  function place() { root.style.transform = "translate(" + pos.x.toFixed(1) + "px," + pos.y.toFixed(1) + "px)"; }

  function physics(dt) {
    if (!state.gravity || dragging || resting) return;
    var k = dt / 16.67;
    pos.vy += 0.55 * k;
    pos.vx *= Math.pow(0.995, k);
    pos.x += pos.vx * k; pos.y += pos.vy * k;
    var maxX = window.innerWidth - size - 4, maxY = window.innerHeight - size - 4;
    if (pos.y > maxY) { pos.y = maxY; pos.vy *= -0.55; pos.vx *= 0.9; if (Math.abs(pos.vy) < 1.2) pos.vy = 0; }
    if (pos.y < 4) { pos.y = 4; pos.vy *= -0.55; }
    if (pos.x > maxX) { pos.x = maxX; pos.vx *= -0.6; }
    if (pos.x < 4) { pos.x = 4; pos.vx *= -0.6; }
    if (pos.y >= maxY && pos.vy === 0 && Math.abs(pos.vx) < 0.15) { resting = true; pos.vx = 0; state.x = pos.x; state.y = pos.y; save(); }
    place();
  }

  // Drag, throw, click
  var start = null, last = null, moved = false;
  toy.addEventListener("pointerdown", function (e) {
    toy.setPointerCapture(e.pointerId);
    dragging = true; moved = false;
    start = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    last = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
    root.classList.add("is-dragging");
  });
  toy.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - start.px, dy = e.clientY - start.py;
    if (!moved && Math.hypot(dx, dy) > 5) { moved = true; closePanel(); }
    if (!moved) return;
    pos.x = start.x + dx; pos.y = start.y + dy; clamp(); place();
    var now = performance.now(), dt = Math.max(1, now - last.t);
    last.vx = 0.6 * last.vx + 0.4 * ((e.clientX - last.x) / dt) * 16.67;
    last.vy = 0.6 * last.vy + 0.4 * ((e.clientY - last.y) / dt) * 16.67;
    last.x = e.clientX; last.y = e.clientY; last.t = now;
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false; root.classList.remove("is-dragging");
    if (!moved) { trigger(); return; }
    if (state.gravity) { pos.vx = Math.max(-40, Math.min(40, last.vx)); pos.vy = Math.max(-40, Math.min(40, last.vy)); resting = false; }
    state.x = pos.x; state.y = pos.y; save();
  }
  toy.addEventListener("pointerup", endDrag);
  toy.addEventListener("pointercancel", endDrag);
  toy.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); } });

  // ---------- Settings ----------
  function openPanel() {
    panel.hidden = false; gear.setAttribute("aria-expanded", "true");
    var right = pos.x + size + 236 < window.innerWidth;
    panel.classList.toggle("left", !right);
    panel.classList.toggle("up", pos.y + 220 > window.innerHeight);
  }
  function closePanel() { panel.hidden = true; gear.setAttribute("aria-expanded", "false"); }
  gear.addEventListener("click", function () {
    if (state.hidden) { state.hidden = false; save(); applyHidden(); return; }
    panel.hidden ? openPanel() : closePanel();
  });
  document.addEventListener("pointerdown", function (e) { if (!root.contains(e.target)) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

  panel.querySelectorAll('input[name="fidget-style"]').forEach(function (r) {
    r.checked = r.value === state.style;
    r.addEventListener("change", function () { if (r.checked) { state.style = r.value; save(); switchStyle(); } });
  });
  var grav = panel.querySelector('input[name="fidget-gravity"]');
  grav.checked = !!state.gravity;
  grav.addEventListener("change", function () {
    state.gravity = grav.checked; save();
    if (state.gravity) { resting = false; pos.vy = 0; } else { resting = true; pos.vx = pos.vy = 0; state.x = pos.x; state.y = pos.y; save(); }
  });
  panel.querySelector('[data-act="reset"]').addEventListener("click", function () {
    var d = defaultPos(); pos.x = d.x; pos.y = d.y; pos.vx = pos.vy = 0; resting = true;
    state.x = null; state.y = null; save(); place(); closePanel();
  });
  panel.querySelector('[data-act="hide"]').addEventListener("click", function () { state.hidden = true; save(); closePanel(); applyHidden(); });
  function applyHidden() {
    root.classList.toggle("is-hidden", !!state.hidden);
    gear.setAttribute("aria-label", state.hidden ? "Show fidget toy" : "Fidget toy settings");
  }

  // ---------- Palette ----------
  var colors = [];
  function readColors() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    colors = dark ? ["#86BC98", "#B5DCC1", "#E2895A", "#9DBB8A", "#E9EFE7"] : ["#2B5140", "#6F8F5E", "#B5481A", "#1F3D30", "#97B486"];
    buildLut(dark);
  }

  // ---------- Style 1: Shards ----------
  // Each click adds a new layer that eases in while every older layer eases out,
  // so rapid clicks never snap.
  var layers = [], spin = 0;
  function newPattern() {
    return {
      n: pick([6, 8, 10, 12]),
      s: Array.from({ length: 6 }, function () {
        return { k: pick(["tri", "dia", "circ", "bar", "ring"]), r: 18 + Math.random() * 100, a: Math.random(), z: 7 + Math.random() * 16, c: Math.floor(Math.random() * 5), rot: Math.random() * Math.PI };
      })
    };
  }
  function addLayer(instant) {
    layers.forEach(function (L) { L.from = L.alpha; L.to = 0; L.t = 0; });
    layers.push({ p: newPattern(), alpha: instant ? 1 : 0, from: instant ? 1 : 0, to: 1, t: instant ? 1 : 0, born: true });
  }
  function drawShape(s) {
    var z = s.z, c = colors[s.c];
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.beginPath();
    if (s.k === "circ") ctx.arc(0, 0, z, 0, 6.2832);
    else if (s.k === "ring") { ctx.arc(0, 0, z, 0, 6.2832); ctx.stroke(); return; }
    else if (s.k === "tri") { ctx.moveTo(0, -z); ctx.lineTo(z * .9, z * .6); ctx.lineTo(-z * .9, z * .6); ctx.closePath(); }
    else if (s.k === "dia") { ctx.moveTo(0, -z); ctx.lineTo(z * .6, 0); ctx.lineTo(0, z); ctx.lineTo(-z * .6, 0); ctx.closePath(); }
    else { ctx.rect(-z * 1.4, -z * .32, z * 2.8, z * .64); }
    ctx.fill();
  }
  function drawShards(dt) {
    spin += (reduce ? 0 : 0.00018) * dt;
    var S = canvas.width;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      L.t = Math.min(1, L.t + dt / 900);
      L.alpha = L.from + (L.to - L.from) * easeIO(L.t);
    }
    layers = layers.filter(function (L) { return !(L.to === 0 && L.t >= 1); });
    for (var j = 0; j < layers.length; j++) {
      var Ly = layers[j], a = Ly.alpha;
      if (a <= 0.001) continue;
      var growing = Ly.to === 1;
      var scale = growing ? 0.82 + 0.18 * a : 1 + 0.22 * (1 - a);
      var twist = growing ? -(1 - a) * 0.5 : (1 - a) * 0.35;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = a;
      ctx.translate(S / 2, S / 2);
      ctx.scale(S / 300 * scale, S / 300 * scale);
      ctx.rotate(spin + twist);
      var n = Ly.p.n, wedge = Math.PI / n;
      for (var k = 0; k < n; k++) for (var m = -1; m <= 1; m += 2) {
        ctx.save(); ctx.rotate(k * 2 * wedge); ctx.scale(1, m);
        for (var q = 0; q < Ly.p.s.length; q++) {
          var s = Ly.p.s[q], ang = s.a * wedge;
          ctx.save(); ctx.translate(s.r * Math.cos(ang), s.r * Math.sin(ang)); ctx.rotate(ang + s.rot); drawShape(s); ctx.restore();
        }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Style 2: Julia mirror ----------
  var seeds = [[-0.7, 0.27], [0.285, 0.01], [-0.8, 0.156], [-0.4, 0.6], [0.355, 0.355], [-0.54, 0.54], [-0.123, 0.745], [-0.75, 0.11]];
  var jc = { r: -0.7, i: 0.27 }, jFrom = { r: -0.7, i: 0.27 }, jTo = { r: -0.7, i: 0.27 }, jt = 1, phase = 0;
  var folds = [{ n: 6, alpha: 1, from: 1, to: 1, t: 1 }];
  var juliaRes = 140, buf = document.createElement("canvas"), bctx = buf.getContext("2d"), img = null, lut = null;
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
  function renderJulia(n, cr, ci, rot) {
    var R = juliaRes;
    if (buf.width !== R) { buf.width = buf.height = R; img = bctx.createImageData(R, R); }
    var d = img.data, half = R / 2, sc = 1.55 / half, wedge = Math.PI / n, two = 2 * wedge, MAX = 48, LOG2 = Math.log(2);
    for (var py = 0; py < R; py++) {
      for (var px = 0; px < R; px++) {
        var X = (px - half) * sc, Y = (py - half) * sc, j = (py * R + px) * 4;
        var r = Math.sqrt(X * X + Y * Y);
        if (r > 1.55) { d[j + 3] = 0; continue; }
        var ang = Math.atan2(Y, X) + rot;
        ang = ((ang % two) + two) % two; if (ang > wedge) ang = two - ang;
        var zr = r * Math.cos(ang), zi = r * Math.sin(ang), it = 0, m2 = 0;
        for (; it < MAX; it++) { var t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; m2 = zr * zr + zi * zi; if (m2 > 16) break; }
        if (it >= MAX) { d[j + 3] = 0; continue; }
        var mu = it + 1 - Math.log(Math.log(Math.sqrt(m2))) / LOG2;
        var idx = (Math.floor(mu * 9) % 256 + 256) % 256 * 3;
        d[j] = lut[idx]; d[j + 1] = lut[idx + 1]; d[j + 2] = lut[idx + 2];
        var edge = Math.min(1, (1.55 - r) * 18);
        d[j + 3] = 255 * Math.min(1, mu / 3) * edge;
      }
    }
    bctx.putImageData(img, 0, 0);
  }
  function juliaClick() {
    var e = easeIO(jt);
    jFrom = { r: jFrom.r + (jTo.r - jFrom.r) * e, i: jFrom.i + (jTo.i - jFrom.i) * e };
    var s = pick(seeds); while (Math.abs(s[0] - jTo.r) < 1e-6) s = pick(seeds);
    jTo = { r: s[0], i: s[1] }; jt = 0;
    var n = pick([4, 6, 8]);
    if (n !== folds[folds.length - 1].n) {
      folds.forEach(function (F) { F.from = F.alpha; F.to = 0; F.t = 0; });
      folds.push({ n: n, alpha: 0, from: 0, to: 1, t: 0 });
    }
  }
  function drawJulia(dt) {
    phase += (reduce ? 0 : 0.00035) * dt;
    jt = Math.min(1, jt + dt / 1600);
    var e = easeIO(jt);
    jc.r = jFrom.r + (jTo.r - jFrom.r) * e + 0.012 * Math.cos(phase * 1.7);
    jc.i = jFrom.i + (jTo.i - jFrom.i) * e + 0.012 * Math.sin(phase * 1.3);
    folds.forEach(function (F) { F.t = Math.min(1, F.t + dt / 1100); F.alpha = F.from + (F.to - F.from) * easeIO(F.t); });
    folds = folds.filter(function (F) { return !(F.to === 0 && F.t >= 1); });
    var S = canvas.width;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    folds.forEach(function (F) {
      if (F.alpha <= 0.001) return;
      renderJulia(F.n, jc.r, jc.i, phase * 0.6);
      ctx.globalAlpha = F.alpha; ctx.drawImage(buf, 0, 0, S, S);
    });
    ctx.globalAlpha = 1;
  }

  // ---------- Loop ----------
  function trigger() {
    root.classList.remove("pulse"); void root.offsetWidth; root.classList.add("pulse");
    state.style === "julia" ? juliaClick() : addLayer(false);
  }
  function switchStyle() {
    toy.classList.add("swap");
    setTimeout(function () { toy.classList.remove("swap"); }, 260);
  }
  var lastT = performance.now(), visible = true;
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; lastT = performance.now(); });
  function frame(now) {
    var dt = Math.min(50, now - lastT); lastT = now;
    if (visible) {
      physics(dt);
      if (!state.hidden) state.style === "julia" ? drawJulia(dt) : drawShards(dt);
    }
    requestAnimationFrame(frame);
  }

  function init() {
    document.body.appendChild(root);
    measure(); readColors();
    var d = defaultPos();
    pos.x = state.x == null ? d.x : state.x; pos.y = state.y == null ? d.y : state.y;
    clamp(); place(); applyHidden();
    if (state.gravity) resting = false;
    addLayer(true);
    new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", function () { measure(); clamp(); place(); if (state.gravity) resting = false; });
    requestAnimationFrame(frame);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
