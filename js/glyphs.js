/*
 * glyphs.js: small hand-drawn objects built on top of the Sketch engine.
 * Every glyph takes a position (and usually a scale) and returns an Item
 * (a group) you can draw / pop / move on the timeline.
 * Glyphs contain no letters: labels only ever appear on arrows or as
 * highlighted words (see Sketch#arrow / Sketch#word).
 */
(function (global) {
  'use strict';

  var S = global.Sketch.prototype;
  var TAU = Math.PI * 2;

  function T(x, y, s) {
    return function (pts) { return pts.map(function (p) { return [x + p[0] * s, y + p[1] * s]; }); };
  }
  function op(o) { o = o || {}; return { c: o.c, w: o.w }; }

  /* ---- people & machines ------------------------------------------------ */

  // origin = feet
  S.person = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var t = T(x, y, s), w = o.w || 3, c = o.c;
    return this.group([
      this.circle(x, y - 78 * s, 13 * s, { w: w, c: c, fill: o.fill }),
      this.path(t([[0, -64], [0, -28]]), { w: w, c: c }),
      this.path(t([[-24, -38], [0, -56], [24, -38]]), { w: w, c: c }),
      this.path(t([[-17, 2], [0, -28], [17, 2]]), { w: w, c: c }),
    ]);
  };

  // origin = centre of head
  S.robot = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var t = T(x, y, s), w = o.w || 3, c = o.c;
    var parts = [
      this.rect(x - 30 * s, y - 23 * s, 60 * s, 46 * s, { r: 10 * s, w: w, c: c, fill: o.fill, hatch: o.hatch }),
      this.line(x, y - 23 * s, x, y - 37 * s, { w: w, c: c }),
      this.dot(x, y - 42 * s, 3.8 * s),
      this.dot(x - 12 * s, y - 3 * s, 4.4 * s),
      this.dot(x + 12 * s, y - 3 * s, 4.4 * s),
      this.path(t([[-9, 11], [0, 14], [9, 11]]), { w: w - 0.5, c: c }),
      this.line(x - 37 * s, y - 8 * s, x - 37 * s, y + 8 * s, { w: w + 1, c: c }),
      this.line(x + 37 * s, y - 8 * s, x + 37 * s, y + 8 * s, { w: w + 1, c: c }),
    ];
    if (o.body) parts.push(this.rect(x - 22 * s, y + 30 * s, 44 * s, 32 * s, { r: 8 * s, w: w, c: c }));
    return this.group(parts);
  };

  /* ---- paper & marks ---------------------------------------------------- */

  S.squiggle = function (x, y, w, o) {
    o = o || {};
    var pts = [], n = Math.max(3, Math.round(w / 9));
    for (var i = 0; i <= n; i++) pts.push([x + (w * i) / n, y + (i % 2 ? 1 : -1) * (o.amp || 2.5) * (0.6 + 0.8 * this.rnd())]);
    return this.path(pts, { c: o.c || 'gray', w: o.w || 2.3 });
  };

  S.card = function (x, y, w, h, o) {
    o = o || {};
    var parts = [this.rect(x, y, w, h, { r: o.r == null ? 8 : o.r, fill: o.fill, hatch: o.hatch, c: o.c, w: o.w })];
    var n = o.lines == null ? 3 : o.lines, pad = Math.min(16, w * 0.16), top = y + Math.min(20, h * 0.22);
    for (var i = 0; i < n; i++) {
      var ly = n === 1 ? y + h / 2 : top + (i / (n - 1)) * (h - 2 * (top - y));
      var lw = (w - 2 * pad) * (i === n - 1 && n > 1 ? 0.6 : 1);
      parts.push(this.squiggle(x + pad, ly, lw, { amp: 2.2, c: o.lc }));
    }
    return this.group(parts);
  };

  S.check = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.path(T(x, y, s)([[-14, 0], [-4, 11], [15, -13]]), { w: o.w || 5, c: o.c });
  };

  S.cross = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var w = o.w || 5;
    return this.group([
      this.line(x - 11 * s, y - 11 * s, x + 11 * s, y + 11 * s, { w: w, c: o.c }),
      this.line(x + 11 * s, y - 11 * s, x - 11 * s, y + 11 * s, { w: w, c: o.c }),
    ]);
  };

  S.plus = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.group([
      this.line(x - 8 * s, y, x + 8 * s, y, { w: o.w || 3.4, c: o.c }),
      this.line(x, y - 8 * s, x, y + 8 * s, { w: o.w || 3.4, c: o.c }),
    ]);
  };

  S.minus = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.line(x - 8 * s, y, x + 8 * s, y, { w: o.w || 3.4, c: o.c });
  };

  S.qmark = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.group([
      this.path(T(x, y, s)([[-9, -13], [-5, -20], [4, -20], [9, -13], [6, -5], [0, 0], [0, 6]]), { w: o.w || 3.4, c: o.c }),
      this.dot(x, y + 15 * s, 2.8 * s),
    ]);
  };

  S.neq = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.group([
      this.line(x - 11 * s, y - 5 * s, x + 11 * s, y - 5 * s, { w: o.w || 3.4, c: o.c }),
      this.line(x - 11 * s, y + 6 * s, x + 11 * s, y + 6 * s, { w: o.w || 3.4, c: o.c }),
      this.line(x - 6 * s, y + 14 * s, x + 6 * s, y - 14 * s, { w: o.w || 3.4, c: o.c }),
    ]);
  };

  S.eq = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.group([
      this.line(x - 11 * s, y - 5 * s, x + 11 * s, y - 5 * s, { w: o.w || 3.4, c: o.c }),
      this.line(x - 11 * s, y + 6 * s, x + 11 * s, y + 6 * s, { w: o.w || 3.4, c: o.c }),
    ]);
  };

  S.star = function (x, y, r, o) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r;
      pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
    return this.poly(pts, o);
  };

  // short radial strokes (sparkle / rays)
  S.burst = function (x, y, r0, r1, n, o) {
    o = o || {};
    var a0 = o.from == null ? 0 : o.from, a1 = o.to == null ? TAU : o.to, ls = [], i;
    var cnt = a1 - a0 >= TAU - 0.01 ? n : n - 1;
    for (i = 0; i < n; i++) {
      var a = a0 + (cnt ? (i / cnt) * (a1 - a0) : 0);
      ls.push(this.line(x + r0 * Math.cos(a), y + r0 * Math.sin(a), x + r1 * Math.cos(a), y + r1 * Math.sin(a), { w: o.w || 3, c: o.c }));
    }
    return this.group(ls);
  };

  S.sun = function (x, y, r, o) {
    o = o || {};
    return this.group([this.circle(x, y, r, { w: o.w || 2.6, c: o.c, fill: o.fill }), this.burst(x, y, r * 1.4, r * 1.9, 8, { w: o.w || 2.6, c: o.c })]);
  };

  S.magnifier = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.group([
      this.circle(x, y, 20 * s, { w: o.w || 3.4, c: o.c, fill: o.fill }),
      this.line(x + 14.5 * s, y + 14.5 * s, x + 36 * s, y + 36 * s, { w: (o.w || 3.4) + 2, c: o.c }),
    ]);
  };

  S.pointer = function (x, y, s) {
    s = s || 1;
    return this.poly(T(x, y, s)([[0, 0], [0, 22], [6, 17], [10, 27], [14, 25], [10, 16], [18, 16]]), { fill: 'paper', w: 2.4 });
  };

  /* ---- charts & waves --------------------------------------------------- */

  // left-middle at (x,y); `rise` lifts the right end (a trend)
  S.wave = function (x, y, w, amp, cyc, o) {
    o = o || {};
    var pts = [], n = Math.max(8, Math.round(w / 6));
    for (var i = 0; i <= n; i++) {
      var u = i / n;
      pts.push([x + u * w, y - amp * Math.sin(u * cyc * TAU + (o.ph || 0)) - (o.rise || 0) * u]);
    }
    return this.path(pts, o);
  };

  S.bars = function (x, y, hs, bw, gap, o) {
    o = o || {};
    var self = this;
    return hs.map(function (h, i) {
      return self.rect(x + i * (bw + gap), y - h, bw, h, { r: 2, hatch: true, c: o.c, w: o.w, hs: o.hs });
    });
  };

  // L-shaped axes: origin at (x,y), width w, height h
  S.axes = function (x, y, w, h, o) {
    o = o || {};
    var l = { c: o.c || 'ink', w: o.w || 2.8 };
    return this.group([
      this.arrow(x, y, x, y - h, { head: 11, bend: 0, w: l.w, c: l.c }),
      this.arrow(x, y, x + w, y, { head: 11, bend: 0, w: l.w, c: l.c, label: o.label, size: o.size, ls: o.ls == null ? 1 : o.ls, ld: o.ld, lc: o.lc }),
    ]);
  };

  S.domino = function (x, y, w, h, o) {
    o = o || {};
    return this.rect(x, y, w, h, { r: 3, w: o.w || 2.8, c: o.c, hatch: o.hatch, fill: o.fill, hs: 7 }).pivot(x + w, y + h);
  };

  S.gauge = function (x, y, w, h, level, o) {
    o = o || {};
    return this.group([
      this.rect(x, y, w, h, { r: 5, w: o.w || 3, c: o.c }),
      this.rect(x + 4, y + h - 4 - (h - 8) * level, w - 8, (h - 8) * level, { r: 3, hatch: true, hs: 6, w: 2.2, c: 'gray' }),
    ]);
  };

  /* ---- objects ---------------------------------------------------------- */

  S.code = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var t = T(x, y, s), w = o.w || 4;
    return this.group([
      this.path(t([[-11, -14], [-25, 0], [-11, 14]]), { w: w, c: o.c }),
      this.line(x + 5 * s, y - 16 * s, x - 5 * s, y + 16 * s, { w: w, c: o.c }),
      this.path(t([[11, -14], [25, 0], [11, 14]]), { w: w, c: o.c }),
    ]);
  };

  S.dice = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var d = 11 * s, w = o.w || 3;
    return this.group([
      this.rect(x - 22 * s, y - 22 * s, 44 * s, 44 * s, { r: 9 * s, w: w, c: o.c, fill: o.fill }),
      this.dot(x - d, y - d, 3.2 * s), this.dot(x + d, y - d, 3.2 * s),
      this.dot(x, y, 3.2 * s),
      this.dot(x - d, y + d, 3.2 * s), this.dot(x + d, y + d, 3.2 * s),
    ]);
  };

  S.gear = function (x, y, r, teeth, o) {
    teeth = teeth || 8; o = o || {};
    var pts = [], n = teeth * 4;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU, k = i % 4, rr = k === 1 || k === 2 ? r : r * 0.78;
      pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
    return this.group([this.poly(pts, { w: o.w || 3, c: o.c, fill: o.fill }), this.circle(x, y, r * 0.3, { w: o.w || 3, c: o.c })]);
  };

  S.bottle = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.group([
      this.rect(x - 24 * s, y - 28 * s, 48 * s, 80 * s, { r: 11 * s, w: o.w || 3, c: o.c, fill: o.fill }),
      this.rect(x - 11 * s, y - 45 * s, 22 * s, 17 * s, { r: 3 * s, w: o.w || 3, c: o.c }),
      this.sun(x, y + 12 * s, 7 * s, { w: 2.4 }),
    ]);
  };

  // thought bubble at (x,y,w,h) with a trail of dots towards (tx,ty)
  S.bubble = function (x, y, w, h, tx, ty, o) {
    o = o || {};
    var cx = x + w / 2, cy = y + h / 2, ang = Math.atan2(ty - cy, tx - cx);
    var c = Math.abs(Math.cos(ang)) || 1e-6, s = Math.abs(Math.sin(ang)) || 1e-6;
    var tt = Math.min(w / 2 / c, h / 2 / s), ex = cx + Math.cos(ang) * tt, ey = cy + Math.sin(ang) * tt;
    return this.group([
      this.rect(x, y, w, h, { r: Math.min(w, h) * 0.42, w: o.w || 3, c: o.c, fill: o.fill }),
      this.circle(ex + (tx - ex) * 0.3, ey + (ty - ey) * 0.3, 7, { w: 2.6, c: o.c }),
      this.circle(ex + (tx - ex) * 0.66, ey + (ty - ey) * 0.66, 4.2, { w: 2.4, c: o.c }),
    ]);
  };

  S.pill = function (x, y, w, h, sign, o) {
    o = o || {};
    var cx = x + w / 2, cy = y + h / 2, ps = [this.rect(x, y, w, h, { r: h / 2, w: o.w || 2.8, c: o.c, fill: o.fill })];
    ps.push(sign > 0 ? this.plus(cx, cy, 0.85) : this.minus(cx, cy, 0.85));
    return this.group(ps);
  };

  S.battery = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var w = o.w || 3.2;
    return this.group([
      this.line(x - 40 * s, y, x - 7 * s, y, { w: w, c: o.c }),
      this.line(x - 7 * s, y - 24 * s, x - 7 * s, y + 24 * s, { w: w, c: o.c }),
      this.line(x + 7 * s, y - 13 * s, x + 7 * s, y + 13 * s, { w: w + 3, c: o.c }),
      this.line(x + 7 * s, y, x + 40 * s, y, { w: w, c: o.c }),
    ]);
  };

  S.resistor = function (x, y, s, o) {
    s = s || 1; o = o || {};
    return this.path(T(x, y, s)([[-40, 0], [-27, 0], [-20, -13], [-8, 13], [4, -13], [16, 13], [23, 0], [40, 0]]), { w: o.w || 3.2, c: o.c });
  };

  // origin = centre of glass
  S.bulb = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var t = T(x, y, s), w = o.w || 3.2;
    var bulb = this.group([
      this.circle(x, y, 26 * s, { w: w, c: o.c, fill: o.fill, hatch: o.hatch }),
      this.rect(x - 11 * s, y + 25 * s, 22 * s, 15 * s, { r: 3 * s, w: w, c: o.c }),
      this.path(t([[-9, 15], [-6, 4], [-2, 13], [2, 2], [6, 11], [9, 3]]), { w: 2.4 }),
    ]);
    bulb.rays = this.burst(x, y, 36 * s, 50 * s, 9, { from: Math.PI, to: TAU, w: 3 });
    bulb.rays2 = this.burst(x, y, 36 * s, 50 * s, 2, { from: 0.15, to: Math.PI - 0.15, w: 3 });
    return bulb;
  };

  S.controller = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var t = T(x, y, s), w = o.w || 3.2;
    return this.group([
      this.poly(t([[-46, -16], [-30, -25], [30, -25], [46, -16], [58, 18], [50, 31], [37, 28], [25, 12], [-25, 12], [-37, 28], [-50, 31], [-58, 18]]), { w: w, c: o.c, fill: o.fill }),
      this.plus(x - 29 * s, y - 4 * s, 1.15),
      this.circle(x + 26 * s, y - 8 * s, 5 * s, { w: 2.6 }),
      this.circle(x + 38 * s, y + 2 * s, 5 * s, { w: 2.6 }),
    ]);
  };

  S.screen = function (x, y, w, h, o) {
    o = o || {};
    return this.group([
      this.rect(x, y, w, h, { r: 12, w: o.w || 3.2, c: o.c, fill: o.fill }),
      this.rect(x + 10, y + 10, w - 20, h - 20, { r: 6, w: 2, c: 'gray' }),
    ]);
  };

  S.board = function (x, y, w, h, o) {
    o = o || {};
    return this.group([
      this.rect(x, y, w, h, { r: 6, w: o.w || 3.2, c: o.c, fill: o.fill }),
      this.line(x + w * 0.3, y + h, x + w * 0.22, y + h + 34, { w: 3, c: o.c }),
      this.line(x + w * 0.7, y + h, x + w * 0.78, y + h + 34, { w: 3, c: o.c }),
    ]);
  };

  S.trophy = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var t = T(x, y, s), w = o.w || 3.2;
    return this.group([
      this.poly(t([[-22, -30], [22, -30], [18, -4], [8, 8], [-8, 8], [-18, -4]]), { w: w, c: o.c, fill: o.fill }),
      this.path(t([[-22, -24], [-34, -24], [-32, -10], [-19, -6]]), { w: 2.8, c: o.c }),
      this.path(t([[22, -24], [34, -24], [32, -10], [19, -6]]), { w: 2.8, c: o.c }),
      this.line(x, y + 8 * s, x, y + 24 * s, { w: w, c: o.c }),
      this.rect(x - 15 * s, y + 24 * s, 30 * s, 9 * s, { r: 3, w: w, c: o.c }),
    ]);
  };

  S.podium = function (x, y, s, o) {
    s = s || 1; o = o || {};
    var bw = 42 * s, hs = [44, 66, 30];
    return this.group(hs.map(function (h, i) { return this.rect(x + (i - 1.5) * bw + (i === 1 ? 0 : 0), y - h * s, bw, h * s, { r: 2, w: 3, c: o.c, hatch: i === 1, hs: 8 }); }, this));
  };

  // transformer-ish stack: returns an array of items, top to bottom
  S.layers = function (x, y, w, h, n, gap, o) {
    o = o || {};
    var out = [];
    for (var i = 0; i < n; i++) out.push(this.rect(x, y + i * (h + gap), w, h, { r: 8, w: o.w || 3, c: o.c, hatch: o.hatch, hs: 8 }));
    return out;
  };

})(window);
