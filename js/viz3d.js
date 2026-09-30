/*
 * viz3d.js — a tiny drag-to-rotate 3D canvas view (no libraries).
 * Figures hand it a draw callback; it sorts primitives back-to-front and renders
 * them in the site's ink colours (they follow the light / dark theme).
 */
(function (g) {
  'use strict';

  function View3D(host, opts) {
    opts = opts || {};
    var self = this;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'view3d';
    this.canvas.setAttribute('role', 'img');
    if (opts.label) this.canvas.setAttribute('aria-label', opts.label);
    host.appendChild(this.canvas);
    this.aspect = opts.aspect || 0.62;
    this.center = opts.center || [0.5, 0.5, 0.5];
    this.rx = opts.rx == null ? -0.42 : opts.rx;
    this.ry = opts.ry == null ? 0.62 : opts.ry;
    this.zoom = opts.zoom || 1;
    this.auto = !reduced && opts.auto !== false;
    this.onDraw = null; this.onClick = null;
    this.visible = false; this.dirty = true; this.raf = 0;

    var drag = null;
    this.canvas.style.touchAction = 'pan-y';
    this.canvas.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId };
      self.canvas.setPointerCapture(e.pointerId);
      self.auto = false;
    });
    this.canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX; drag.y = e.clientY;
      self.ry += dx * 0.008; self.rx = Math.max(-1.45, Math.min(1.45, self.rx + dy * 0.008));
      self.touch();
    });
    function up(e) {
      if (drag && drag.moved < 5 && self.onClick) {
        var r = self.canvas.getBoundingClientRect();
        self.onClick((e.clientX - r.left) * (self.canvas.width / r.width) / self.dpr, (e.clientY - r.top) * (self.canvas.height / r.height) / self.dpr);
      }
      drag = null;
    }
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', function () { drag = null; });

    if ('ResizeObserver' in window) new ResizeObserver(function () { self.touch(); }).observe(host);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.touch(); }, { threshold: 0.05 }).observe(this.canvas);
    } else this.visible = true;
    new MutationObserver(function () { self.touch(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.touch();
  }

  var P = View3D.prototype;

  P.touch = function () {
    this.dirty = true;
    if (!this.raf) { var s = this; this.raf = requestAnimationFrame(function (t) { s.raf = 0; s.frame(t); }); }
  };

  P.frame = function () {
    if (!this.visible) return;
    if (this.auto) { this.ry += 0.006; this.dirty = true; }
    if (this.dirty) { this.dirty = false; this.render(); }
    if (this.auto) this.touch();
  };

  P.render = function () {
    var cv = this.canvas, r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    var w = Math.max(200, Math.round(r.width)), hh = Math.round(w * this.aspect);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); cv.style.height = hh + 'px'; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    var cs = getComputedStyle(document.documentElement);
    var col = { ink: cs.getPropertyValue('--sk-ink').trim() || '#1b1a17', gray: cs.getPropertyValue('--sk-gray').trim() || '#8a8477', faint: cs.getPropertyValue('--sk-faint').trim() || '#cbc3af', hl: cs.getPropertyValue('--sk-hl').trim() || '#e6d49f', bg: cs.getPropertyValue('--sk-bg').trim() || '#f9f6ee' };
    var cx = w / 2, cy = hh / 2, sc = Math.min(w, hh / this.aspect * 0.62) * 0.62 * this.zoom;
    var cr = Math.cos(this.ry), sr = Math.sin(this.ry), cX = Math.cos(this.rx), sX = Math.sin(this.rx), c0 = this.center;
    function proj(p) {
      var x = p[0] - c0[0], y = p[1] - c0[1], z = p[2] - c0[2];
      var x1 = x * cr + z * sr, z1 = -x * sr + z * cr;
      var y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      var f = 3.2 / (3.2 - z2);
      return [cx + x1 * sc * f, cy - y2 * sc * f, z2, f];
    }
    var items = [];
    var api = {
      col: col, proj: proj, w: w, h: hh,
      line: function (a, b, o) { o = o || {}; var A = proj(a), B = proj(b); items.push({ z: (A[2] + B[2]) / 2, f: function () { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.strokeStyle = col[o.c || 'ink']; ctx.lineWidth = o.w || 2; ctx.lineCap = 'round'; ctx.globalAlpha = o.a == null ? 1 : o.a; ctx.setLineDash(o.dash || []); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; } }); },
      path: function (pts, o) { o = o || {}; var Q = pts.map(proj), z = 0; Q.forEach(function (q) { z += q[2]; }); items.push({ z: z / Q.length + (o.zb || 0), f: function () { ctx.beginPath(); Q.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.strokeStyle = col[o.c || 'ink']; ctx.lineWidth = o.w || 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = o.a == null ? 1 : o.a; ctx.setLineDash(o.dash || []); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; } }); },
      dot: function (p, o) { o = o || {}; var A = proj(p); items.push({ z: A[2], f: function () { ctx.beginPath(); ctx.arc(A[0], A[1], (o.r || 3) * A[3], 0, 6.2832); if (o.fill !== false) { ctx.fillStyle = col[o.c || 'ink']; ctx.globalAlpha = o.a == null ? 1 : o.a; ctx.fill(); } if (o.stroke) { ctx.strokeStyle = col[o.stroke]; ctx.lineWidth = o.sw || 2; ctx.globalAlpha = 1; ctx.stroke(); } ctx.globalAlpha = 1; } }); return A; },
      poly: function (pts, o) { o = o || {}; var Q = pts.map(proj), z = 0; Q.forEach(function (q) { z += q[2]; }); items.push({ z: z / Q.length, f: function () { ctx.beginPath(); Q.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); if (o.fill) { ctx.globalAlpha = o.fa == null ? 0.2 : o.fa; ctx.fillStyle = col[o.fill]; ctx.fill(); ctx.globalAlpha = 1; } if (o.stroke) { ctx.strokeStyle = col[o.stroke]; ctx.lineWidth = o.w || 1.4; ctx.globalAlpha = o.a == null ? 1 : o.a; ctx.stroke(); ctx.globalAlpha = 1; } } }); },
      text: function (p, s, o) { o = o || {}; var A = proj(p); items.push({ z: A[2] + 5, f: function () { ctx.font = '600 ' + (o.size || 19) + 'px Caveat, "Segoe Print", cursive'; ctx.textAlign = o.align || 'left'; ctx.lineWidth = 5; ctx.strokeStyle = col.bg; ctx.lineJoin = 'round'; ctx.strokeText(s, A[0] + (o.dx || 0), A[1] + (o.dy || 0)); ctx.fillStyle = col[o.c || 'ink']; ctx.fillText(s, A[0] + (o.dx || 0), A[1] + (o.dy || 0)); } }); },
    };
    if (this.onDraw) this.onDraw(api);
    items.sort(function (a, b) { return a.z - b.z; });
    items.forEach(function (it) { it.f(); });
    this.lastProj = proj;
  };

  // nearest of `pts` (3D) to a canvas click, within `max` px
  P.pick = function (pts, x, y, max) {
    var best = -1, bd = max * max, self = this;
    pts.forEach(function (p, i) { var q = self.lastProj(p), d = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y); if (d < bd) { bd = d; best = i; } });
    return best;
  };

  g.View3D = View3D;
})(window);
