/*
 * sketch.js: a tiny hand-drawn animation engine (no dependencies).
 *
 * A scene is a plain function that receives a `Sketch`, creates strokes / shapes /
 * labels and schedules them on a timeline (times are in ms). The renderer is a pure
 * function of time, so playing, pausing, scrubbing and "reduced motion" all work by
 * simply asking for a different `t`.
 *
 * Look: every stroke is a jittered Catmull-Rom spline; closed shapes are drawn with a
 * second, overlapping lap like a pen doodle; while playing, three slightly different
 * versions of each stroke cycle at ~6fps ("line boil").
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var TAU = Math.PI * 2;
  var V = 3; // line-boil variants

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var c01 = function (v) { return clamp(v, 0, 1); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, x) { var t = c01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  var r1 = function (v) { return Math.round(v * 10) / 10; };

  var ez = {
    lin: function (t) { return t; },
    in: function (t) { return t * t; },
    out: function (t) { return 1 - (1 - t) * (1 - t); },
    io: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    back: function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };

  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------- geometry */

  var dist = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); };

  function plen(pts, closed) {
    var L = 0, i;
    for (i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
    if (closed && pts.length > 1) L += dist(pts[pts.length - 1], pts[0]);
    return L;
  }

  function bounds(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    });
    return [x0, y0, x1, y1];
  }

  function densify(pts, step, closed) {
    var out = [], n = pts.length, m = closed ? n : n - 1, i, j;
    for (i = 0; i < m; i++) {
      var a = pts[i], b = pts[(i + 1) % n];
      var k = Math.max(1, Math.round(dist(a, b) / step));
      for (j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
    }
    if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  }

  function jitter(pts, amp, rnd) {
    return pts.map(function (p) { return [p[0] + (rnd() - 0.5) * 2 * amp, p[1] + (rnd() - 0.5) * 2 * amp]; });
  }

  // Catmull-Rom -> cubic Bezier path string
  function spline(pts, closed) {
    var n = pts.length;
    if (n < 2) return '';
    var d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
    var get = function (i) { return closed ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]; };
    var segs = closed ? n : n - 1;
    for (var i = 0; i < segs; i++) {
      var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += 'C' + r1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + r1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        r1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + r1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' +
        r1(p2[0]) + ' ' + r1(p2[1]);
    }
    return d;
  }

  function roughOpen(pts, rnd, amp) {
    var L = plen(pts);
    var a = Math.min(amp, 0.05 * L + 0.35);
    var dense = densify(pts, clamp(L / 6, 11, 30), false);
    var vars = [];
    for (var v = 0; v < V; v++) vars.push(spline(jitter(dense, a, rnd), false));
    return { vars: vars, len: L, bb: bounds(pts) };
  }

  function roughClosed(pts, rnd, amp) {
    var L = plen(pts, true);
    var a = Math.min(amp, 0.02 * L + 0.4);
    var dense = densify(pts, clamp(L / 12, 11, 28), true);
    var n = dense.length, off = Math.floor(rnd() * n);
    var base = dense.slice(off).concat(dense.slice(0, off));
    var m = Math.max(2, Math.round(n * 0.26));
    var vars = [];
    for (var v = 0; v < V; v++) {
      var A = jitter(base, a, rnd);
      var sx = (rnd() - 0.5) * 2.2, sy = (rnd() - 0.5) * 2.2;
      var B = jitter(base, a * 1.15, rnd).slice(0, m + 1).map(function (p) { return [p[0] + sx, p[1] + sy]; });
      vars.push(spline(A.concat(B), false));
    }
    return { vars: vars, len: L * 1.26, bb: bounds(pts) };
  }

  function ellPts(cx, cy, rx, ry, rot) {
    var n = Math.max(10, Math.round(TAU * Math.sqrt((rx * rx + ry * ry) / 2) / 11));
    var pts = [], cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU, x = rx * Math.cos(a), y = ry * Math.sin(a);
      pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    return pts;
  }

  function rectPts(x, y, w, h, r) {
    if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    r = Math.min(r, w / 2, h / 2);
    var cs = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]], pts = [];
    cs.forEach(function (c) {
      for (var k = 0; k <= 4; k++) {
        var a = ((c[2] + k * 22.5) * Math.PI) / 180;
        pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
      }
    });
    return pts;
  }

  function polyPath(poly) { return 'M' + poly.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]); }).join('L') + 'Z'; }

  function dashPieces(pts, dash, gap) {
    var dense = densify(pts, 4, false), out = [], cur = [dense[0]], on = true, acc = 0, i;
    for (i = 1; i < dense.length; i++) {
      var seg = dist(dense[i - 1], dense[i]);
      acc += seg;
      if (on) cur.push(dense[i]);
      if (on && acc >= dash) { if (cur.length > 1) out.push(cur); cur = []; on = false; acc = 0; }
      else if (!on && acc >= gap) { on = true; acc = 0; cur = [dense[i]]; }
    }
    if (on && cur.length > 1) out.push(cur);
    return out;
  }

  /* ---------------------------------------------------------------- tracks */

  function sample(segs, t, d) {
    var n = segs.length;
    if (!n) return d;
    if (t < segs[0].t0) return segs[0].start;
    var cur = segs[0].start;
    for (var i = 0; i < n; i++) {
      var s = segs[i];
      if (t < s.t0) return cur;
      if (t < s.t1) return s.f(s.e((t - s.t0) / (s.t1 - s.t0)));
      cur = s.end;
    }
    return cur;
  }

  var uid = 0;

  /* ---------------------------------------------------------------- items */

  function Item(sk) {
    this.sk = sk;
    this.parts = [];
    this.kids = [];
    this.g = svgEl('g');
    this.tr = { op: [], x: [], y: [], r: [], s: [], draw: [] };
    this.def = { op: 1, x: 0, y: 0, r: 0, s: 1, draw: 0 };
    this.px = 0; this.py = 0; this.bb = null; this._pv = false;
    this.L = {}; this._norm = false;
    sk.items.push(this);
    sk.root.appendChild(this.g);
  }

  var P = Item.prototype;

  P._grow = function (bb) {
    if (!bb) return;
    if (!this.bb) this.bb = bb.slice();
    else {
      this.bb[0] = Math.min(this.bb[0], bb[0]); this.bb[1] = Math.min(this.bb[1], bb[1]);
      this.bb[2] = Math.max(this.bb[2], bb[2]); this.bb[3] = Math.max(this.bb[3], bb[3]);
    }
    if (!this._pv) { this.px = (this.bb[0] + this.bb[2]) / 2; this.py = (this.bb[1] + this.bb[3]) / 2; }
  };

  P._add = function (part) {
    this.parts.push(part);
    this.g.appendChild(part.host || part.el);
    this._grow(part.bb);
    return part;
  };

  P.pivot = function (x, y) { this.px = x; this.py = y; this._pv = true; return this; };

  P.weight = function () {
    var w = 0;
    this.parts.forEach(function (p) { if (p.kind !== 'fill') w += p.w; });
    this.kids.forEach(function (k) { w += k.weight(); });
    return Math.max(w, 1);
  };

  P.leaves = function (out) {
    out = out || [];
    if (this.parts.length) out.push(this);
    this.kids.forEach(function (k) { k.leaves(out); });
    return out;
  };

  P.seg = function (prop, t0, dur, a, b, e) {
    var f = typeof a === 'function' ? a : function (u) { return a + (b - a) * u; };
    var s = { t0: t0, t1: t0 + dur, f: f, e: ez[e] || ez.io };
    s.start = f(0); s.end = f(1);
    var arr = this.tr[prop];
    arr.push(s);
    arr.sort(function (p, q) { return p.t0 - q.t0; });
    this.sk.duration = Math.max(this.sk.duration, s.t1);
    return this;
  };

  P.cur = function (prop) {
    var arr = this.tr[prop];
    return arr.length ? arr[arr.length - 1].end : this.def[prop];
  };

  // pen-draw all strokes (in creation order); groups draw their children in sequence
  P.draw = function (t0, dur, e) {
    if (this.kids.length && !this.parts.length) {
      var W = this.weight(), acc = 0;
      this.kids.forEach(function (k) {
        var w = k.weight();
        k.draw(t0 + (acc / W) * dur, (w / W) * dur, e);
        acc += w;
      });
      return this;
    }
    return this.seg('draw', t0, dur, 0, 1, e || 'io');
  };

  P.erase = function (t0, dur, e) {
    this.leaves().forEach(function (l) { l.seg('draw', t0, dur, 1, 0, e || 'io'); });
    return this;
  };

  P._setDraw = function (t0, v) {
    this.leaves().forEach(function (l) { l.seg('draw', t0, 0, v, v, 'lin'); });
  };

  // appear fully drawn (optionally fading in)
  P.show = function (t0, dur) {
    dur = dur == null ? 220 : dur;
    this._setDraw(t0, 1);
    return this.seg('op', t0, dur, 0, 1, 'out');
  };

  P.pop = function (t0, dur) {
    dur = dur == null ? 420 : dur;
    this._setDraw(t0, 1);
    this.seg('op', t0, Math.min(dur, 200), 0, 1, 'out');
    return this.seg('s', t0, dur, 0.45, 1, 'back');
  };

  P.hide = function (t0, dur) {
    return this.seg('op', t0, dur == null ? 220 : dur, this.cur('op'), 0, 'out');
  };

  P.still = function () { this._setDraw(0, 1); return this; };

  P.move = function (dx, dy, t0, dur, e) {
    var x0 = this.cur('x'), y0 = this.cur('y');
    this.seg('x', t0, dur, x0, x0 + dx, e);
    return this.seg('y', t0, dur, y0, y0 + dy, e);
  };

  P.put = function (x, y, t0) { // teleport by offset
    this.seg('x', t0 || 0, 0, x, x, 'lin');
    return this.seg('y', t0 || 0, 0, y, y, 'lin');
  };

  P.scale = function (s, t0, dur, e) { return this.seg('s', t0, dur, this.cur('s'), s, e); };
  P.rot = function (deg, t0, dur, e) { return this.seg('r', t0, dur, this.cur('r'), deg, e); };

  P.pulse = function (t0, dur, amp) {
    dur = dur || 480; amp = amp || 0.14;
    var s0 = this.cur('s');
    this.seg('s', t0, dur / 2, s0, s0 * (1 + amp), 'out');
    return this.seg('s', t0 + dur / 2, dur / 2, s0 * (1 + amp), s0, 'io');
  };

  P.shake = function (t0, dur, amp) {
    amp = amp || 3; var r0 = this.cur('r');
    return this.seg('r', t0, dur, function (u) { return r0 + amp * Math.sin(u * TAU * 3) * (1 - u); }, 0, 'lin');
  };

  P.along = function (pts, t0, dur, e) {
    var cum = [0], i;
    for (i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    var L = cum[cum.length - 1], o = pts[0];
    var at = function (u) {
      var d = u * L, k = 1;
      while (k < cum.length - 1 && cum[k] < d) k++;
      var span = cum[k] - cum[k - 1] || 1, w = (d - cum[k - 1]) / span;
      return [lerp(pts[k - 1][0], pts[k][0], w) - o[0], lerp(pts[k - 1][1], pts[k][1], w) - o[1]];
    };
    this.seg('x', t0, dur, function (u) { return at(u)[0]; }, 0, e || 'lin');
    return this.seg('y', t0, dur, function (u) { return at(u)[1]; }, 0, e || 'lin');
  };

  P._normalise = function () {
    var total = 0;
    this.parts.forEach(function (p) { if (p.kind !== 'fill') total += p.w; });
    var acc = 0;
    this.parts.forEach(function (p) {
      if (p.kind === 'fill') return;
      p.a = total ? acc / total : 0; acc += p.w; p.b = total ? acc / total : 1;
    });
    this._norm = true;
  };

  P.render = function (t, vi) {
    var T = this.tr, D = this.def, L = this.L, g = this.g;
    var op = sample(T.op, t, D.op), x = sample(T.x, t, D.x), y = sample(T.y, t, D.y);
    var r = sample(T.r, t, D.r), s = sample(T.s, t, D.s), dr = sample(T.draw, t, D.draw);

    var key = x + '|' + y + '|' + r + '|' + s;
    if (key !== L.tf) {
      L.tf = key;
      if (x || y || r || s !== 1) {
        g.setAttribute('transform', 'translate(' + r1(x) + ' ' + r1(y) + ') translate(' + r1(this.px) + ' ' + r1(this.py) +
          ') rotate(' + r1(r) + ') scale(' + Math.round(s * 1000) / 1000 + ') translate(' + r1(-this.px) + ' ' + r1(-this.py) + ')');
      } else g.removeAttribute('transform');
    }
    if (op !== L.op) { L.op = op; if (op >= 1) g.removeAttribute('opacity'); else g.setAttribute('opacity', op.toFixed(3)); }

    if (!this.parts.length) return;
    if (dr === L.dr && vi === L.vi) return;
    L.dr = dr; L.vi = vi;
    if (!this._norm) this._normalise();

    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (p.kind === 'fill') {
        var o = smooth(0.55, 0.98, dr) * (p.o == null ? 1 : p.o);
        if (o !== p.op) { p.op = o; p.el.setAttribute('opacity', o.toFixed(3)); }
        continue;
      }
      var lp = p.b > p.a ? c01((dr - p.a) / (p.b - p.a)) : (dr >= p.a ? 1 : 0);
      var vis = lp > 0.0004;
      if (vis !== p.vis) { p.vis = vis; p.el.setAttribute('visibility', vis ? 'visible' : 'hidden'); }
      if (!vis) continue;
      if (p.kind === 'stroke') {
        if (lp !== p.lp) { p.lp = lp; p.el.setAttribute('stroke-dashoffset', (1 - lp).toFixed(4)); }
        if (p.vars.length > 1 && p.vi !== vi) { p.vi = vi; p.el.setAttribute('d', p.vars[vi]); }
      } else if (p.kind === 'text') {
        if (lp !== p.lp) { p.lp = lp; p.clip.setAttribute('width', (p.cw * lp).toFixed(1)); }
      } else if (p.kind === 'dot') {
        if (lp !== p.lp) { p.lp = lp; p.el.setAttribute('r', (p.r0 * ez.back(lp)).toFixed(2)); }
      }
    }
  };

  /* ---------------------------------------------------------------- sketch */

  function Sketch(svg, opts) {
    opts = opts || {};
    this.svg = svg;
    this.W = opts.w || 800; this.H = opts.h || 520;
    this.rnd = mulberry32(opts.seed || 1);
    svg.setAttribute('viewBox', '0 0 ' + this.W + ' ' + this.H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    this.defs = svgEl('defs');
    this.root = svgEl('g');
    svg.appendChild(this.defs);
    svg.appendChild(this.root);
    this.items = [];
    this.duration = 0;
  }

  var S = Sketch.prototype;

  S.style = function (o, base) {
    o = o || {};
    var c = o.c || 'ink';
    return { c: c, w: o.w || (c === 'ink' ? 3 : c === 'gray' ? 2.5 : c === 'hl' ? 3 : 2), op: o.op };
  };

  S._stroke = function (geo, o) {
    var st = this.style(o);
    var el = svgEl('path', {
      d: geo.vars[0], 'class': 'k k-' + st.c, pathLength: 1, 'stroke-dasharray': '1 1',
      'stroke-dashoffset': 1, 'stroke-width': st.w, visibility: 'hidden',
    });
    if (st.op != null) el.setAttribute('stroke-opacity', st.op);
    return { kind: 'stroke', el: el, vars: geo.vars, w: Math.max(geo.len, 6), bb: geo.bb, vis: false, vi: 0 };
  };

  S._fill = function (poly, cls) {
    var rnd = this.rnd, L = plen(poly, true);
    var moved = poly.map(function (p) { return [p[0] + 2, p[1] + 2.5]; });
    var d = spline(jitter(densify(moved, clamp(L / 12, 11, 28), true), 1.2, rnd), true) + 'Z';
    var el = svgEl('path', { d: d, 'class': 'f f-' + cls, opacity: 0 });
    return { kind: 'fill', el: el, w: 0, bb: bounds(poly) };
  };

  S._hatch = function (poly, o) {
    var id = 'hc' + (++uid), sp = o.hs || 9, rnd = this.rnd;
    var cp = svgEl('clipPath', { id: id });
    cp.appendChild(svgEl('path', { d: polyPath(poly) }));
    this.defs.appendChild(cp);
    var bb = bounds(poly), x0 = bb[0] - 2, y0 = bb[1] - 2, x1 = bb[2] + 2, y1 = bb[3] + 2, pts = [], flip = false;
    for (var c = x0 + y0; c <= x1 + y1; c += sp * 1.414) {
      var xa = Math.max(x0, c - y1), xb = Math.min(x1, c - y0);
      if (xb <= xa) continue;
      var A = [xa, c - xa], B = [xb, c - xb];
      if (flip) { pts.push(B); pts.push(A); } else { pts.push(A); pts.push(B); }
      flip = !flip;
    }
    var geo = roughOpen(pts, rnd, 1.6);
    var part = this._stroke(geo, { c: o.hc || 'gray', w: o.hw || 1.8 });
    var host = svgEl('g', { 'clip-path': 'url(#' + id + ')' });
    host.appendChild(part.el);
    part.host = host; part.bb = bb;
    return part;
  };

  S._closed = function (poly, o) {
    o = o || {};
    var it = new Item(this);
    if (o.fill) it._add(this._fill(poly, o.fill));
    if (o.hatch) it._add(this._hatch(poly, o));
    it._add(this._stroke(roughClosed(poly, this.rnd, o.amp || 1.15), o));
    return it;
  };

  S._open = function (pts, o) {
    o = o || {};
    var it = new Item(this);
    if (o.dash) {
      var self = this;
      dashPieces(pts, o.dash === true ? 11 : o.dash, o.gap || 9).forEach(function (pc) {
        it._add(self._stroke(roughOpen(pc, self.rnd, 0.6), o));
      });
    } else it._add(this._stroke(roughOpen(pts, this.rnd, o.amp || 1.2), o));
    return it;
  };

  S._textPart = function (item, str, x, y, o) {
    o = o || {};
    var size = o.size || 32, anchor = o.anchor || 'middle', c = o.c || 'ink';
    var id = 'tc' + (++uid);
    var el = svgEl('text', { x: x, y: y, 'font-size': size, 'text-anchor': anchor, 'class': 'hand t-' + c + (o.halo === false ? ' nohalo' : ''), 'clip-path': 'url(#' + id + ')', visibility: 'hidden' });
    el.textContent = str;
    var rect = svgEl('rect', { x: 0, y: y - size * 1.05, width: 0, height: size * 1.5 });
    var cp = svgEl('clipPath', { id: id });
    cp.appendChild(rect);
    this.defs.appendChild(cp);
    var part = { kind: 'text', el: el, clip: rect, w: 20, cw: 0, bb: null, vis: false };
    item._add(part);
    var tw = 0;
    try { tw = el.getComputedTextLength(); } catch (e) { tw = 0; }
    if (!tw) tw = str.length * size * 0.42;
    var x0 = anchor === 'middle' ? x - tw / 2 : anchor === 'end' ? x - tw : x;
    rect.setAttribute('x', x0 - 8);
    part.cw = tw + 16; part.w = Math.max(24, tw * 0.55);
    part.bb = [x0, y - size * 0.9, x0 + tw, y + size * 0.3];
    part.tw = tw; part.x0 = x0;
    item._grow(part.bb);
    return part;
  };

  /* --- public builders ------------------------------------------------- */

  S.line = function (x1, y1, x2, y2, o) { return this._open([[x1, y1], [x2, y2]], o); };
  S.path = function (pts, o) { return this._open(pts, o); };
  S.poly = function (pts, o) { return this._closed(pts, o); };
  S.rect = function (x, y, w, h, o) { o = o || {}; return this._closed(rectPts(x, y, w, h, o.r), o); };
  S.ellipse = function (cx, cy, rx, ry, o) { return this._closed(ellPts(cx, cy, rx, ry, (o || {}).rot), o); };
  S.circle = function (cx, cy, r, o) { return this._closed(ellPts(cx, cy, r, r), o); };

  S.dot = function (x, y, r, o) {
    return this.dots([[x, y]], r, o);
  };

  S.dots = function (pts, r, o) {
    o = o || {};
    var it = new Item(this), rnd = this.rnd;
    pts.forEach(function (p) {
      var el = svgEl('circle', { cx: r1(p[0]), cy: r1(p[1]), r: 0, 'class': 'f f-' + (o.c || 'ink'), visibility: 'hidden' });
      it._add({ kind: 'dot', el: el, r0: o.rs ? r * (0.7 + 0.6 * rnd()) : r, w: o.dw || 8, bb: [p[0] - r, p[1] - r, p[0] + r, p[1] + r], vis: false });
    });
    return it;
  };

  S.text = function (str, x, y, o) {
    var it = new Item(this);
    this._textPart(it, str, x, y, o);
    return it;
  };

  // highlighted word: marker swipe + handwriting
  S.word = function (str, x, y, o) {
    o = o || {};
    var size = o.size || 40, anchor = o.anchor || 'middle';
    var it = new Item(this);
    var probe = this._textPart(it, str, x, y, { size: size, anchor: anchor, halo: false, c: o.c });
    var x0 = probe.x0, x1 = probe.x0 + probe.tw, my = y - size * 0.3;
    var tilt = (this.rnd() - 0.5) * 5;
    var geo = roughOpen([[x0 - 8, my + tilt], [(x0 + x1) / 2, my - tilt * 0.4], [x1 + 8, my - tilt]], this.rnd, 1.2);
    var m = this._stroke(geo, { c: 'hl', w: size * 0.78 });
    m.el.setAttribute('stroke-opacity', '0.95');
    // marker goes underneath the text
    it.parts.unshift(m);
    it.g.insertBefore(m.el, it.g.firstChild);
    it._grow(geo.bb);
    return it;
  };

  S.arrow = function (x1, y1, x2, y2, o) {
    o = o || {};
    var it = new Item(this), rnd = this.rnd;
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    var bend = o.bend == null ? 0.08 : o.bend, hl = o.head || 14;
    var cx = (x1 + x2) / 2 + nx * bend * L, cy = (y1 + y2) / 2 + ny * bend * L;
    var N = Math.max(6, Math.round(L / 22)), pts = [], i;
    var bez = function (t) { return [(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2]; };
    for (i = 0; i <= N; i++) pts.push(bez(i / N));
    var stroke = { c: o.c || 'ink', w: o.w || 3 };
    var self = this;
    if (o.dash) {
      dashPieces(pts, 11, 9).forEach(function (pc) { it._add(self._stroke(roughOpen(pc, rnd, 0.6), stroke)); });
    } else it._add(this._stroke(roughOpen(pts, rnd, 1.1), stroke));
    var head = function (tip, from) {
      var ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
      var a = [tip[0] + hl * Math.cos(ang + Math.PI - 0.5), tip[1] + hl * Math.sin(ang + Math.PI - 0.5)];
      var b = [tip[0] + hl * Math.cos(ang + Math.PI + 0.5), tip[1] + hl * Math.sin(ang + Math.PI + 0.5)];
      it._add(self._stroke(roughOpen([a, tip, b], rnd, 0.6), stroke));
    };
    if (o.head !== 0) head(pts[N], bez(1 - 12 / L));
    if (o.both) head(pts[0], bez(12 / L));
    if (o.label) {
      var size = (o.size || 32) * 1.12, side = o.ls == null ? -1 : o.ls, m = bez(0.5);
      var sx = nx * side, sy = ny * side, gap = o.gap == null ? size * 0.5 + 6 : o.gap;
      var lx = m[0] + sx * gap, ly = m[1] + sy * gap, anchor = 'middle';
      if (Math.abs(sx) > 0.6) { anchor = sx > 0 ? 'start' : 'end'; lx = m[0] + sx * (gap * 0.6 + 4); ly += size * 0.33; }
      else if (sy > 0) ly += size * 0.72;
      if (o.ld) { lx += o.ld[0]; ly += o.ld[1]; }
      this._textPart(it, o.label, lx, ly, { size: size, anchor: anchor, c: o.lc });
    }
    return it;
  };

  S.group = function (items, o) {
    o = o || {};
    var it = new Item(this);
    it.g.parentNode.removeChild(it.g);
    var first = items[0];
    first.g.parentNode.insertBefore(it.g, first.g);
    items.forEach(function (k) {
      it.g.appendChild(k.g);
      it.kids.push(k);
      it._grow(k.bb);
    });
    return it;
  };

  S.still = function (items) {
    (Array.isArray(items) ? items : [items]).forEach(function (i) { i.still(); });
    return this;
  };

  // stagger: run fn(item, time) for every item, `step` ms apart
  S.stagger = function (items, t0, step, fn) {
    items.forEach(function (it, i) { fn(it, t0 + i * step, i); });
    return t0 + items.length * step;
  };

  S.render = function (t, vi) {
    for (var i = 0; i < this.items.length; i++) this.items[i].render(t, vi);
  };

  /* ---------------------------------------------------------------- player */

  var LEAD = 350, HOLD = 2600, FADE = 450;
  var active = new Set(), raf = 0, lastNow = 0;
  var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');

  function loop(now) {
    var dt = Math.min(80, now - lastNow);
    lastNow = now;
    active.forEach(function (p) { p._tick(dt, now); });
    raf = active.size ? requestAnimationFrame(loop) : 0;
  }

  function Player(svg, scene, opts) {
    opts = opts || {};
    this.svg = svg; this.scene = scene; this.seed = opts.seed || 1;
    this.once = !!opts.once; this.w = opts.w; this.h = opts.h;
    this.sk = null; this.t = 0; this.vi = 0;
    this.playing = false; this.visible = false; this.onUpdate = null;
    this.reduced = !!(reduced && reduced.matches);
  }

  var PP = Player.prototype;

  PP.build = function () {
    if (this.sk) return;
    this.sk = new Sketch(this.svg, { seed: this.seed, w: this.w, h: this.h });
    this.scene(this.sk);
    this.dur = this.sk.duration + (this.once ? 0 : HOLD);
    this.cycle = LEAD + this.dur + (this.once ? 0 : FADE);
    if (this.reduced) this.t = LEAD + this.sk.duration + 200;
    this._render(0);
  };

  PP._render = function (now) {
    var st = this.t - LEAD, over = this.t - (LEAD + this.dur);
    this.sk.root.style.opacity = over > 0 ? String(clamp(1 - over / FADE, 0, 1)) : '1';
    this.sk.render(st, this.vi);
    if (this.onUpdate) this.onUpdate(this);
  };

  PP._tick = function (dt, now) {
    if (!this.playing) return;
    this.t += dt;
    if (this.once && this.t >= this.cycle) { this.t = this.cycle; this.playing = false; this._sync(); this._render(now); return; }
    if (this.t >= this.cycle) this.t -= this.cycle;
    if (!this.reduced) this.vi = Math.floor(now / 170) % V;
    this._render(now);
  };

  PP._sync = function () {
    if (this.visible && this.playing) { active.add(this); if (!raf) { lastNow = performance.now(); raf = requestAnimationFrame(loop); } }
    else active.delete(this);
  };

  PP.setVisible = function (v) { this.visible = v; if (v) this.build(); this._sync(); };
  PP.play = function () { this.build(); if (this.t >= this.cycle - 1) this.t = 0; this.playing = true; this._sync(); if (this.onUpdate) this.onUpdate(this); };
  PP.pause = function () { this.playing = false; this._sync(); if (this.onUpdate) this.onUpdate(this); };
  PP.toggle = function () { if (this.playing) this.pause(); else this.play(); };
  PP.replay = function () { this.build(); this.t = 0; this.play(); };
  PP.progress = function () { return this.sk ? clamp((this.t - LEAD) / (this.sk.duration + HOLD * 0.35), 0, 1) : 0; };
  PP.seekMs = function (ms) { this.build(); this.t = LEAD + clamp(ms, 0, this.sk.duration + HOLD); this._render(performance.now()); };
  PP.seek = function (p) { this.build(); this.seekMs(p * (this.sk.duration + HOLD * 0.35)); };

  global.Sketch = Sketch;
  global.SketchPlayer = Player;
  global.SketchUtil = { ez: ez, rectPts: rectPts, ellPts: ellPts, spline: spline, mulberry32: mulberry32, clamp: clamp, lerp: lerp };
})(window);
