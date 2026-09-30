/*
 * scenes.js: one animated sketch per paper (800 x 520 canvas).
 * Rule: no sentences. Text appears only as arrow labels or as a highlighted word.
 * Times are in milliseconds.
 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var SCENES = {};

  function pops(items, t, step) {
    items.forEach(function (it, i) { it.pop(t + i * step); });
    return t + items.length * step;
  }
  function draws(items, t, dur, step) {
    items.forEach(function (it, i) { it.draw(t + i * step, dur); });
    return t + (items.length - 1) * step + dur;
  }

  /* ------------------------------------------------------------------ 2026 */
  // Reason-Mediated Behavioral Models for Auditing LLM Social Simulators
  SCENES.reason = function (sk) {
    var card = sk.rect(34, 176, 116, 158, { r: 10, fill: 'shade' });
    var bottle = sk.bottle(92, 256, 0.92);

    var person = sk.person(238, 158, 1);
    var bub1 = sk.bubble(292, 44, 162, 78, 254, 86);
    var pA = sk.pill(310, 70, 60, 26, 1), pB = sk.pill(380, 70, 60, 26, -1);
    var a1 = sk.arrow(132, 184, 204, 130, { bend: 0.1 });
    var a3 = sk.arrow(462, 84, 596, 100, { label: 'intent', bend: -0.05, size: 30 });
    var g1 = sk.gauge(612, 52, 38, 100, 0.68);

    var robot = sk.robot(238, 382, 0.95);
    var bub2 = sk.bubble(292, 344, 162, 78, 262, 384);
    var s1 = sk.sun(340, 383, 9), s2 = sk.sun(408, 383, 9);
    var a2 = sk.arrow(132, 328, 202, 368, { bend: -0.1 });
    var echo = sk.arrow(150, 300, 289, 360, { dash: true, bend: -0.3, label: 'echo', size: 30 });
    var a4 = sk.arrow(462, 384, 596, 386, { label: 'intent', bend: 0.04, size: 30 });
    var g2 = sk.gauge(612, 338, 38, 100, 0.68);

    var eq = sk.eq(631, 246, 1), ok = sk.check(690, 246, 1.1);
    var mag = sk.magnifier(482, 128, 0.9);
    var neq = sk.neq(372, 233, 1.1);
    var word = sk.word('reasons', 372, 292, { size: 44 });

    card.draw(0, 650); bottle.draw(500, 800);
    a1.draw(1300, 500); person.draw(1650, 800);
    bub1.draw(2500, 650); pA.pop(3250); pB.pop(3500);
    a3.draw(3900, 650); g1.draw(4500, 700);

    robot.draw(5300, 800); a2.draw(5300, 500);
    bub2.draw(6150, 650);
    echo.draw(6800, 900);
    s1.pop(7750); s2.pop(8000);
    a4.draw(8400, 650); g2.draw(9000, 700);

    eq.pop(9900); ok.pop(10200);
    mag.pop(10700); mag.move(0, 165, 10900, 1300);
    neq.pop(11500); word.draw(11800, 800);
    mag.hide(12700, 300);
  };

  /* ------------------------------------------------------------------ 2025 */
  // Re-Imagine: Symbolic benchmark synthesis for reasoning evaluation
  SCENES.reimagine = function (sk) {
    var q = sk.card(30, 118, 104, 148, { lines: 4 });
    var a1 = sk.arrow(142, 192, 278, 192, { label: 'symbolic', bend: 0.03, size: 30 });
    var box = sk.rect(286, 128, 124, 130, { r: 10, fill: 'shade' });
    var code = sk.code(348, 193, 1.25);
    var dice = sk.dice(348, 60, 0.85);
    var a2 = sk.arrow(348, 88, 348, 124, { label: 'mutate', bend: 0, size: 30, ls: 1 });

    var a3 = sk.arrow(418, 194, 526, 214, { bend: -0.08 });
    var heights = [70, 110, 150], xs = [538, 608, 678], stair = [];
    heights.forEach(function (h, i) { stair.push(sk.card(xs[i], 288 - h, 62, h, { lines: Math.max(2, i + 2), lc: 'gray' })); });
    var harder = sk.arrow(540, 148, 750, 58, { label: 'harder', bend: -0.06, size: 30 });

    var robot = sk.robot(150, 388, 0.95);
    var bars = sk.bars(546, 446, [92, 62, 30], 46, 24);
    var a4 = sk.arrow(206, 396, 528, 400, { bend: 0.06 });
    var m1 = sk.check(569, 330, 0.9), m2 = sk.check(639, 364, 0.9), m3 = sk.cross(709, 396, 0.8);

    q.draw(0, 900);
    a1.draw(1000, 700);
    box.draw(1750, 700); code.draw(2300, 700);
    dice.draw(3000, 700); a2.draw(3500, 600);
    box.pulse(4100, 500); code.shake(4100, 600, 5);
    a3.draw(4800, 600);
    var t = 5300;
    stair.forEach(function (s, i) { s.draw(t + i * 650, 700); });
    harder.draw(7300, 800);
    robot.draw(8300, 700); a4.draw(9000, 800);
    bars.forEach(function (b, i) { b.draw(9700 + i * 500, 550); });
    m1.pop(10100); m2.pop(10600); m3.pop(11100);
  };

  // MASCA: LLM-based multi-agent system for credit assessment
  SCENES.masca = function (sk) {
    var person = sk.person(52, 300, 1);
    var doc = sk.card(84, 218, 50, 66, { lines: 3 });

    var y1 = [110, 240, 370], l1 = [], ic = [];
    y1.forEach(function (y) { l1.push(sk.robot(262, y, 0.78)); });
    ic.push(sk.group([sk.circle(262, 44, 17, { w: 2.8, fill: 'shade' }), sk.circle(262, 44, 8, { w: 2.2, c: 'gray' })]));
    ic.push(sk.card(243, 146, 38, 48, { lines: 3, w: 2.8, r: 5 }));
    ic.push(sk.group(sk.bars(240, 326, [16, 28, 40], 11, 5, { w: 2.4 })));
    var fan = [sk.arrow(140, 262, 208, 128, { bend: 0.06, size: 26 }), sk.arrow(140, 268, 208, 240, { bend: 0.02 }), sk.arrow(140, 274, 208, 350, { bend: -0.06 })];

    var l2 = [sk.robot(452, 172, 0.78), sk.robot(452, 310, 0.78)];
    var r1 = sk.arrow(318, 116, 396, 160, { label: 'risk', bend: -0.1, size: 30 });
    var r2 = sk.arrow(318, 244, 396, 176, { bend: 0.06 });
    var r3 = sk.arrow(318, 250, 396, 300, { bend: -0.06 });
    var r4 = sk.arrow(318, 366, 396, 326, { label: 'reward', bend: 0.1, size: 30, ls: 1 });

    var top = sk.robot(622, 240, 1, { body: true });
    var t1 = sk.arrow(508, 178, 574, 224, { bend: -0.05 });
    var t2 = sk.arrow(508, 308, 574, 256, { bend: 0.05 });
    var v = sk.arrow(672, 240, 706, 240, { bend: 0, head: 11 });
    var stamp = sk.circle(742, 240, 27, { fill: 'shade' });
    var ok = sk.check(742, 241, 1.1);

    var mag = sk.magnifier(596, 328, 0.95);
    var word = sk.word('fair', 700, 384, { size: 46 });

    person.draw(0, 800); doc.draw(700, 700);
    draws(fan, 1600, 500, 250);
    l1.forEach(function (r, i) { r.draw(2200 + i * 350, 650); });
    ic.forEach(function (c, i) { c.pop(3000 + i * 300); });
    r1.draw(4300, 650); r2.draw(4500, 550); r3.draw(4700, 550); r4.draw(4900, 650);
    l2[0].draw(5300, 650); l2[1].draw(5650, 650);
    t1.draw(6400, 500); t2.draw(6600, 500);
    top.draw(6900, 1000);
    v.draw(8000, 350); stamp.draw(8300, 600); ok.pop(8900);
    mag.pop(9600); mag.pulse(10000, 600);
    word.draw(10300, 800);
  };

  // DeduCE: deductive consistency
  SCENES.deduce = function (sk) {
    var divider = sk.line(400, 34, 400, 440, { c: 'faint', dash: 8, gap: 10, w: 2 });

    // left: more premises -> stays flat
    var cards = [];
    for (var i = 0; i < 6; i++) cards.push(sk.card(46 + i * 55, 96, 44, 62, { lines: 2, r: 5, w: 2.6 }));
    var axL = sk.axes(60, 408, 300, 160, { label: 'premises', size: 30 });
    var flat = sk.path([[70, 276], [140, 272], [210, 278], [280, 274], [350, 277]], { w: 3.4 });
    var okL = sk.check(350, 244, 0.95);

    // right: more hops -> decays
    var dom = [];
    for (var j = 0; j < 9; j++) dom.push(sk.domino(436 + j * 36, 100, 13, 58));
    var axR = sk.axes(440, 408, 320, 160, { label: 'hops', size: 30 });
    var decay = sk.path([[452, 262], [500, 274], [550, 308], [600, 342], [650, 366], [700, 380], [750, 386]], { w: 3.4 });
    var stall = sk.cross(436 + 5 * 36 + 20, 84, 0.85);
    var noL = sk.cross(740, 356, 0.85);

    draws(cards, 0, 500, 240);
    axL.draw(1900, 900); flat.draw(2900, 1000); okL.pop(4000);
    divider.draw(3600, 700);
    draws(dom, 4300, 380, 130);
    [0, 1, 2, 3, 4].forEach(function (k) { dom[k].rot(66, 6200 + k * 340, 420, 'in'); });
    stall.pop(8000);
    axR.draw(8300, 900); decay.draw(9300, 1100); noL.pop(10500);
  };

  // On the internal semantics of time-series foundation models
  SCENES.tsfm = function (sk) {
    var series = sk.wave(34, 300, 178, 15, 3, { rise: 70, w: 3.4 });
    var a0 = sk.arrow(224, 250, 296, 250, { bend: 0.04 });
    var ly = [102, 160, 218, 276, 334], layers = [], scan = [], deco = [];
    ly.forEach(function (y) {
      layers.push(sk.rect(304, y, 156, 44, { r: 9 }));
      scan.push(sk.rect(304, y, 156, 44, { r: 9, hatch: true, hs: 7, fill: 'shade' }));
      deco.push(sk.group([
        sk.dot(340, y + 30, 3), sk.dot(382, y + 30, 3), sk.dot(424, y + 30, 3),
        sk.path([[340, y + 24], [382, y + 8], [424, y + 24]], { c: 'gray', w: 2 }),
      ]));
    });
    var where = sk.word('where?', 382, 70, { size: 46 });

    var bx = 590, by = [88, 212, 336], boxes = [], glyphs = [];
    by.forEach(function (y) { boxes.push(sk.rect(bx, y, 172, 92, { r: 10 })); });
    glyphs.push(sk.path([[612, by[0] + 70], [640, by[0] + 62], [668, by[0] + 52], [700, by[0] + 46], [734, by[0] + 20]], { w: 3.4 }));
    glyphs.push(sk.wave(612, by[1] + 46, 124, 17, 2, { w: 3.4 }));
    glyphs.push(sk.path([[612, by[2] + 64], [660, by[2] + 64], [682, by[2] + 20], [704, by[2] + 68], [736, by[2] + 64]], { w: 3.4 }));

    var mag = sk.magnifier(262, 128, 0.95);
    var fan = [
      sk.arrow(468, 240, 582, 138, { label: 'probe', bend: -0.12, size: 30, ld: [34, -2] }),
      sk.arrow(468, 246, 582, 258, { bend: -0.04 }),
      sk.arrow(468, 252, 582, 380, { bend: 0.1 }),
    ];

    series.draw(0, 1000); a0.draw(1000, 500);
    draws(layers, 1600, 500, 320);
    deco.forEach(function (d, i) { d.draw(2400 + i * 300, 500); });
    where.draw(3600, 800);
    draws(boxes, 4400, 500, 300);
    glyphs.forEach(function (g, i) { g.draw(4900 + i * 300, 650); });
    mag.pop(6200);
    ly.forEach(function (y, i) {
      var t = 6500 + i * 750;
      if (i) mag.move(0, ly[i] - ly[i - 1], t - 350, 350);
      scan[i].draw(t, 450); scan[i].hide(t + 700, 200);
    });
    mag.hide(10600, 300);
    scan[2].show(10800, 200);
    draws(fan, 11000, 600, 200);
  };

  // Teaching transformers causal reasoning through axiomatic training
  SCENES.causal = function (sk) {
    function node(x, y, k, r) {
      r = r || 20;
      if (k === 0) return sk.circle(x, y, r);
      if (k === 1) return sk.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, { r: 3 });
      if (k === 2) return sk.poly([[x, y - r * 1.05], [x + r * 1.08, y + r * 0.85], [x - r * 1.08, y + r * 0.85]]);
      if (k === 3) return sk.poly([[x, y - r * 1.15], [x + r * 1.05, y], [x, y + r * 1.15], [x - r * 1.05, y]]);
      var pts = [];
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + (i * TAU) / 5; pts.push([x + r * 1.08 * Math.cos(a), y + r * 1.08 * Math.sin(a)]); }
      return sk.poly(pts);
    }

    // demonstration of the axiom: A -> B -> C  implies  A -> C
    var d = [node(62, 250, 0), node(146, 250, 1), node(230, 250, 2)];
    var da = [sk.arrow(86, 250, 120, 250, { head: 11, bend: 0 }), sk.arrow(170, 250, 204, 250, { head: 11, bend: 0 })];
    var dd = sk.arrow(62, 226, 230, 226, { dash: true, bend: -0.42, label: 'implies', size: 30 });
    var axiom = sk.word('axiom', 146, 118, { size: 46 });

    // the transformer
    var a1 = sk.arrow(262, 228, 344, 228, { label: 'train', bend: 0.03, size: 30 });
    var ty = [148, 206, 264], stack = [], att = [];
    ty.forEach(function (y) {
      stack.push(sk.rect(350, y, 112, 44, { r: 9, fill: 'shade' }));
      att.push(sk.group([sk.dot(376, y + 30, 3), sk.dot(406, y + 30, 3), sk.dot(436, y + 30, 3), sk.path([[376, y + 24], [406, y + 9], [436, y + 24]], { c: 'gray', w: 2 })]));
    });
    var a2 = sk.arrow(470, 228, 548, 228, { label: 'unseen', bend: 0.03, size: 30 });

    // longer chain
    var cx = [586, 630, 674, 718, 762], chain = [], chainA = [];
    cx.forEach(function (x, i) { chain.push(node(x, 168, i % 5, 13)); });
    for (var i = 0; i < 4; i++) chainA.push(sk.arrow(cx[i] + 15, 168, cx[i + 1] - 15, 168, { head: 8, bend: 0, w: 2.4 }));
    var cd = sk.arrow(586, 150, 762, 150, { dash: true, bend: -0.28, w: 2.6, head: 10 });
    var cok = sk.check(676, 106, 0.8);

    // branching graph
    var root = node(596, 340, 3, 13), kidA = node(672, 300, 1, 13), kidB = node(672, 384, 2, 13), leaf = node(752, 300, 4, 13);
    var br = [sk.arrow(610, 334, 656, 305, { head: 8, bend: 0, w: 2.4 }), sk.arrow(610, 348, 656, 378, { head: 8, bend: 0, w: 2.4 }), sk.arrow(688, 300, 736, 300, { head: 8, bend: 0, w: 2.4 })];
    var bd = sk.arrow(596, 322, 752, 282, { dash: true, bend: -0.3, w: 2.6, head: 10 });
    var bok = sk.check(676, 246, 0.8);

    draws(d, 0, 550, 450); da[0].draw(1100, 400); da[1].draw(1500, 400);
    axiom.draw(1900, 700);
    dd.draw(2700, 1000);
    a1.draw(4000, 650);
    draws(stack, 4700, 480, 300);
    att.forEach(function (a, i) { a.draw(5100 + i * 300, 450); });
    a2.draw(6300, 650);
    draws(chain, 7000, 350, 200);
    chainA.forEach(function (a, i) { a.draw(7150 + i * 200, 300); });
    cd.draw(8100, 800); cok.pop(8950);
    [root, kidA, kidB, leaf].forEach(function (n, i) { n.draw(9200 + i * 220, 350); });
    br.forEach(function (a, i) { a.draw(9400 + i * 220, 300); });
    bd.draw(10300, 800); bok.pop(11150);
  };

  /* ------------------------------------------------------------------ 2024 */
  // LISR: Learning linear 3D implicit surface representation using compactly supported RBFs
  SCENES.lisr = function (sk) {
    var half = [[18, 0], [16, 14], [12, 30], [22, 50], [44, 78], [58, 110], [56, 142], [42, 170], [31, 190], [31, 200]];
    function vase(cx, cy) {
      var R = half.map(function (p) { return [cx + p[0], cy + p[1] - 100]; });
      var L = half.slice().reverse().map(function (p) { return [cx - p[0], cy + p[1] - 100]; });
      return R.concat(L);
    }
    function along(poly, n) {
      var segs = [], tot = 0, i;
      for (i = 0; i < poly.length; i++) { var a = poly[i], b = poly[(i + 1) % poly.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); tot += l; }
      var out = [];
      for (var k = 0; k < n; k++) {
        var d = (k / n) * tot, j = 0;
        while (j < segs.length - 1 && d > segs[j][2]) { d -= segs[j][2]; j++; }
        var u = d / segs[j][2];
        out.push([segs[j][0][0] + (segs[j][1][0] - segs[j][0][0]) * u, segs[j][0][1] + (segs[j][1][1] - segs[j][0][1]) * u]);
      }
      return out;
    }
    var rnd = sk.rnd, cy = 238;
    var outline1 = vase(130, cy);
    var all = along(outline1, 78), cloud = [];
    all.forEach(function (p) {
      var gap = p[0] > 152 && p[1] > cy - 34 && p[1] < cy + 4;
      if (!gap) cloud.push([p[0] + (rnd() - 0.5) * 7, p[1] + (rnd() - 0.5) * 7]);
    });
    var stray = [];
    for (var s = 0; s < 9; s++) stray.push([130 + (rnd() - 0.5) * 190, cy + (rnd() - 0.5) * 250]);
    var dotsA = sk.dots(cloud, 3.6), dotsB = sk.dots(stray, 3.2, { c: 'gray' });

    var a1 = sk.arrow(212, cy - 4, 302, cy - 4, { label: 'predict', bend: 0.03, size: 30 });

    var outline2 = vase(408, cy), centers = along(outline2, 17), rings = [], hubs = [];
    centers.forEach(function (p, i) {
      var r = 15 + ((i * 7) % 9) * 1.7;
      rings.push(sk.circle(p[0], p[1], r, { c: 'gray', w: 2 }));
      hubs.push(sk.dot(p[0], p[1], 3.6));
    });

    var a2 = sk.arrow(518, cy - 4, 588, cy - 4, { label: 'sum', bend: 0.03, size: 30 });
    var vase3 = sk.poly(vase(672, cy), { fill: 'shade', hatch: true, hs: 10 });
    var word = sk.word('linear', 672, 398, { size: 46 });

    dotsA.draw(0, 1800); dotsB.draw(1400, 700);
    a1.draw(2400, 700);
    rings.forEach(function (r, i) { r.draw(3300 + i * 130, 450); hubs[i].draw(3400 + i * 130, 300); });
    a2.draw(5800, 650);
    vase3.draw(6600, 2000);
    word.draw(8800, 900);
  };

  /* ------------------------------------------------------------------ 2023 */
  // A challenge on 3D reconstruction and restoration of Indian heritage
  SCENES.heritage = function (sk) {
    var sc = 0.86, R = [[6, 10], [13, 36], [22, 74], [32, 110], [39, 138], [43, 150], [55, 150], [55, 170], [66, 170], [66, 206], [82, 206], [82, 232], [96, 232], [96, 246]];
    function P(cx, base, px, py) { return [cx + px * sc, base - (246 - py) * sc]; }
    function outline(cx, base) {
      var right = R.map(function (p) { return P(cx, base, p[0], p[1]); });
      var left = R.slice().reverse().map(function (p) { return P(cx, base, -p[0], p[1]); });
      return right.concat(left);
    }
    function hw(py) {
      var T = [[10, 6], [36, 13], [74, 22], [110, 32], [138, 39], [150, 43]];
      for (var i = 1; i < T.length; i++) if (py <= T[i][0]) return T[i - 1][1] + ((py - T[i - 1][0]) / (T[i][0] - T[i - 1][0])) * (T[i][1] - T[i - 1][1]);
      return 43;
    }
    var base = 392;

    // partial, noisy scan (left)
    var cx1 = 128, poly1 = outline(cx1, base), pts = [], rnd = sk.rnd;
    function edge(a, b, step) {
      var n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (var i = 0; i < n; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
    }
    for (var i = 0; i < poly1.length; i++) edge(poly1[i], poly1[(i + 1) % poly1.length], 10);
    [52, 88, 122].forEach(function (py) { edge(P(cx1, base, -hw(py) + 3, py), P(cx1, base, hw(py) - 3, py), 11); });
    edge(P(cx1, base, -11, 206), P(cx1, base, -11, 184), 9); edge(P(cx1, base, 11, 206), P(cx1, base, 11, 184), 9);
    var scan = [];
    pts.forEach(function (p) {
      var lx = (p[0] - cx1) / sc, ly = 246 - (base - p[1]) / sc;
      var missing = (lx > 4 && ly < 138) || rnd() < 0.1;
      if (!missing) scan.push([p[0] + (rnd() - 0.5) * 6, p[1] + (rnd() - 0.5) * 6]);
    });
    var noise = [];
    for (var k = 0; k < 16; k++) noise.push([cx1 + (rnd() - 0.5) * 210, base - 20 - rnd() * 260]);
    var dotsA = sk.dots(scan, 3.1), dotsB = sk.dots(noise, 2.8, { c: 'gray' });

    var a1 = sk.arrow(228, 270, 322, 270, { label: 'restore', bend: 0.03, size: 30 });

    // restored temple (centre)
    var cx2 = 408, poly2 = outline(cx2, base);
    var body = sk.poly(poly2, { fill: 'shade' });
    var amal = sk.ellipse(cx2, base - (246 - 3) * sc, 16 * sc, 7 * sc);
    var kal = sk.group([sk.line(cx2, base - 246 * sc + 4, cx2, base - 268 * sc, { w: 3 }), sk.dot(cx2, base - 274 * sc, 3.4)]);
    var ridges = [52, 88, 122].map(function (py) { return sk.line(P(cx2, base, -hw(py) + 3, py)[0], P(cx2, base, 0, py)[1], P(cx2, base, hw(py) - 3, py)[0], P(cx2, base, 0, py)[1], { c: 'gray', w: 2.2 }); });
    var door = sk.poly([[-11, 206], [-11, 190], [-7, 181], [0, 178], [7, 181], [11, 190], [11, 206]].map(function (p) { return P(cx2, base, p[0], p[1]); }), { w: 2.6, hatch: true, hs: 6 });
    var word = sk.word('heritage', cx2, 436, { size: 46 });

    var a2 = sk.arrow(512, 270, 612, 270, { label: 'rank', bend: 0.03, size: 30 });
    var pod = sk.podium(690, 392, 1);
    var tro = sk.trophy(690, 296, 1);
    var st = sk.star(750, 262, 14, { fill: 'shade' });

    dotsA.draw(0, 2000); dotsB.draw(1500, 700);
    a1.draw(2600, 700);
    body.draw(3500, 2300);
    amal.draw(5500, 450); kal.draw(5900, 500);
    draws(ridges, 6200, 350, 200); door.draw(6900, 600);
    word.draw(7600, 800);
    a2.draw(8600, 650);
    pod.draw(9300, 900); tro.draw(10100, 800); st.pop(10900);
  };

  /* ------------------------------------------------------------------ 2022 */
  // Game-based learning for engineering education
  SCENES.edu = function (sk) {
    var board = sk.board(34, 56, 244, 148);
    var loop = sk.path([[70, 92], [242, 92], [242, 168], [70, 168], [70, 92]], { c: 'gray', w: 2.4 });
    var bat = sk.battery(156, 168, 0.55, { w: 2.4 });
    var res = sk.resistor(156, 92, 0.55, { w: 2.4 });
    var bulbS = sk.circle(242, 130, 12, { w: 2.4, fill: 'shade' });

    var ctl = sk.controller(150, 372, 1.25);
    var sparks = [sk.burst(150, 310, 12, 24, 3, { from: -2.3, to: -0.84, w: 2.6 })];

    var student = sk.person(568, 356, 1.3);
    var bulb = sk.bulb(568, 168, 1.3);
    var word = sk.word('aha', 688, 112, { size: 52 });
    var stars = [sk.star(486, 214, 12, { fill: 'shade' }), sk.star(654, 228, 15, { fill: 'shade' }), sk.star(690, 180, 9, { fill: 'shade' })];

    var a1 = sk.arrow(286, 150, 506, 290, { label: 'learn', bend: -0.16, size: 32 });
    var a2 = sk.arrow(232, 372, 504, 336, { label: 'play', bend: 0.14, size: 32, ls: 1 });

    board.draw(0, 1200); loop.draw(1200, 700); res.draw(1900, 350); bat.draw(2150, 350); bulbS.draw(2400, 350);
    a1.draw(2900, 900); student.draw(3500, 1000);
    ctl.draw(4500, 1000); sparks[0].draw(5500, 350);
    a2.draw(5900, 900);
    bulb.draw(7000, 900);
    bulb.rays.draw(7900, 500); bulb.rays2.draw(8200, 300);
    word.draw(8600, 800);
    pops(stars, 9400, 250);
  };

  // Game-based learning for basic electronics
  SCENES.circuit = function (sk) {
    var scr = sk.screen(36, 34, 728, 398);
    var tray = sk.rect(72, 76, 150, 316, { r: 12, c: 'gray', w: 2.2 });
    var bx = 510, bay = 380, rx = 510, ry = 150, ux = 690, uy = 264;

    var battery = sk.battery(147, 150, 0.9), resistor = sk.resistor(147, 244, 0.9), bulb = sk.bulb(147, 336, 0.85);
    var slotB = sk.circle(bx, bay, 34, { c: 'faint', w: 2.2, });
    var slotR = sk.circle(rx, ry, 34, { c: 'faint', w: 2.2 });
    var slotU = sk.circle(ux, uy, 40, { c: 'faint', w: 2.2 });

    var drag = sk.arrow(232, 118, 318, 118, { label: 'drag', bend: -0.06, size: 30 });

    var wires = [
      sk.path([[330, 380], [330, 150], [470, 150]], { w: 3.2 }),
      sk.path([[550, 150], [690, 150], [690, 224]], { w: 3.2 }),
      sk.path([[690, 306], [690, 380], [550, 380]], { w: 3.2 }),
      sk.path([[470, 380], [330, 380]], { w: 3.2 }),
    ];

    var ptr = sk.pointer(160, 158, 1.2);
    var loopPts = [[330, 380], [330, 150], [690, 150], [690, 380], [330, 380]];
    var electrons = [];
    for (var e = 0; e < 3; e++) electrons.push(sk.dot(330, 380, 5.6));
    var glow = sk.circle(ux, uy, 22, { hatch: true, hs: 6, c: 'ink' });
    var rays = sk.burst(ux, uy, 36 * 0.85, 50 * 0.85, 9, { from: Math.PI, to: TAU, w: 3 });
    var word = sk.word('glow', 610, 322, { size: 46 });
    var ok = sk.check(706, 84, 1.05), st1 = sk.star(650, 90, 14, { fill: 'shade' });

    scr.draw(0, 1000); tray.draw(600, 600);
    pops([battery, resistor, bulb], 1300, 220);
    draws([slotB, slotR, slotU], 2000, 400, 160);
    drag.draw(2700, 600);

    // the pointer picks up each part in turn and drops it into its slot
    var pos = [0, 0];
    function ptrTo(ox, oy, t, dur) { ptr.move(ox - pos[0], oy - pos[1], t, dur, 'io'); pos = [ox, oy]; }
    function carry(item, dx, dy, t, dur) { item.move(dx, dy, t, dur, 'io'); ptr.move(dx, dy, t, dur, 'io'); pos = [pos[0] + dx, pos[1] + dy]; }
    ptr.pop(3300);
    carry(battery, bx - 147, bay - 150, 3800, 900);
    battery.pulse(4800, 400); slotB.hide(4800, 300);
    ptrTo(0, 94, 5100, 500);
    carry(resistor, rx - 147, ry - 244, 5700, 900);
    resistor.pulse(6700, 400); slotR.hide(6700, 300);
    ptrTo(0, 186, 7000, 500);
    carry(bulb, ux - 147, uy - 336, 7600, 900);
    bulb.pulse(8600, 400); slotU.hide(8600, 300);
    ptr.hide(8800, 300);

    draws(wires, 9000, 450, 250);
    electrons.forEach(function (el, i) {
      var t = 10300 + i * 500, lap = 2400;
      el.pop(t);
      el.along(loopPts, t, lap);
      el.hide(t + lap - 150, 200);
    });
    glow.draw(10400, 550);
    rays.draw(11000, 550);
    word.draw(11400, 700);
    ok.pop(12200); st1.pop(12500);
  };

  // thumbnail for "The Shape of Information": a binary code tree and the budget square it fills
  SCENES.shape = function (sk) {
    var lv = [[[190, 90]], [[110, 200], [270, 200]], [[70, 310], [150, 310], [230, 310], [310, 310]]];
    var nodes = [], edges = [];
    lv.forEach(function (row, d) { row.forEach(function (p, i) { nodes.push(sk.circle(p[0], p[1], d === 2 ? 15 : 17, { fill: d === 2 ? 'shade' : null })); if (d) edges.push(sk.line(lv[d - 1][Math.floor(i / 2)][0], lv[d - 1][Math.floor(i / 2)][1] + 17, p[0], p[1] - 16, { w: 2.6 })); }); });
    var sq = sk.rect(450, 90, 280, 280, { r: 4 });
    var half = sk.line(590, 90, 590, 370, { w: 2.6 });
    var q1 = sk.line(590, 230, 730, 230, { w: 2.6 });
    var q2 = sk.line(660, 230, 660, 370, { w: 2.6 });
    var f1 = sk.rect(456, 96, 128, 268, { hatch: true, hs: 9, c: 'gray', w: 1.6 });
    var f2 = sk.rect(596, 96, 128, 128, { hatch: true, hs: 14, c: 'gray', w: 1.6 });
    var arrow = sk.arrow(340, 230, 440, 230, { bend: 0.05 });
    var wave = sk.wave(90, 440, 620, 0, 1, { c: 'faint', w: 2 });
    nodes.slice(0, 1).concat(edges.slice(0, 2)).forEach(function (n, i) { n.draw(i * 350, 500); });
    var t = 1200;
    nodes.slice(1).forEach(function (n, i) { n.draw(t + i * 220, 400); });
    edges.slice(2).forEach(function (e, i) { e.draw(t + 300 + i * 220, 350); });
    arrow.draw(3200, 600); sq.draw(3800, 900); half.draw(4700, 500); q1.draw(5100, 400); q2.draw(5450, 400);
    f1.draw(5900, 700); f2.draw(6400, 600);
  };

  /* ------------------------------------------------------------------ page doodles (play once) */
  SCENES.underline = function (sk) {
    var u = sk.path([[6, 20], [90, 14], [180, 21], [270, 13], [352, 19], [414, 12]], { w: 4.2 });
    var u2 = sk.path([[40, 27], [160, 24], [300, 28], [388, 22]], { w: 3, c: 'gray' });
    u.draw(200, 700); u2.draw(750, 500);
  };
  SCENES.scribble = function (sk) {
    var u = sk.path([[4, 8], [60, 4], [120, 9], [180, 4], [236, 8]], { w: 3.6 });
    u.draw(150, 600);
  };
  SCENES.portrait = function (sk) {
    var f = sk.rect(22, 22, 456, 456, { r: 10, c: 'ink', w: 2.6, amp: 2.4 });
    var s1 = sk.burst(486, 22, 14, 34, 3, { from: -2.0, to: -0.2, w: 3 });
    var s2 = sk.star(24, 484, 15, { fill: 'shade', w: 2.6 });
    f.draw(400, 1500); s1.draw(1700, 500); s2.pop(2100);
  };

  global.SCENES = SCENES;
})(window);
