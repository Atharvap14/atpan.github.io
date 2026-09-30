/*
 * Interactive 3D figures for the LISR explainer. Everything is computed live.
 *   A. Theorem 1  : gradient descent is confined to alpha0 + range(VV^T)
 *   B. Theorem 2  : Voronoi patches on a real scan (Stanford Bunny) => block-diagonal, full rank
 *   C. Algorithm 1: queries at p + eps*(x,y,z) make VV^T = c*I
 * The 3D setting mirrors the paper: phi_i(x) = r_i(x) * grad ||x - p_i||^3 (3 coefficients per kernel point).
 */
(function () {
  'use strict';
  var V = window.Viz, el = V.el, h = V.h;

  function fig(id, title, sub) {
    var root = document.getElementById(id);
    h('div', 'fig-title', title, root);
    h('div', 'fig-sub', sub, root);
    return root;
  }
  var add = function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; };
  var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  var mul = function (a, s) { return [a[0] * s, a[1] * s, a[2] * s]; };
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  var nrm = function (a) { return Math.sqrt(dot(a, a)); };

  function cube(api, lo, hi) {
    var c = [];
    for (var i = 0; i < 8; i++) c.push([i & 1 ? hi : lo, i & 2 ? hi : lo, i & 4 ? hi : lo]);
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { api.line(c[e[0]], c[e[1]], { c: 'faint', w: 1.6 }); });
  }
  function cross(api, p, s, o) {
    api.line(sub(p, [s, 0, 0]), add(p, [s, 0, 0]), o); api.line(sub(p, [0, s, 0]), add(p, [0, s, 0]), o); api.line(sub(p, [0, 0, s]), add(p, [0, 0, s]), o);
  }

  /* =============================================== A. Theorem 1 (3D) */
  function figStuck() {
    var root = fig('fig-stuck', 'Figure A · Gradient descent lives in a subspace (Theorem 1)',
      'Three coefficients &alpha;. The gradient is <i>VV<sup>T</sup>(&alpha; &minus; &alpha;*)</i>, so every step lies in the range of <i>VV<sup>T</sup></i>: the iterates can only reach <i>&alpha;<sub>0</sub> + range(VV<sup>T</sup>)</i>. Lower the rank and that reachable set collapses from all of space to a plane, then a line. Drag to rotate.');
    var controls = h('div', 'controls-row', null, root);
    var host = h('div', 'view-host', null, root);
    var view = new View3D(host, { aspect: 0.64, zoom: 0.8, center: [0, 0, 0], label: 'Interactive 3D view of gradient-descent iterates confined to an affine subspace' });
    var ro = h('div', 'readout', null, root);
    var v1 = mul([0.62, 0.55, 0.56], 1 / nrm([0.62, 0.55, 0.56]));
    var t = [0.3, -0.8, 0.5], v2 = sub(t, mul(v1, dot(t, v1))); v2 = mul(v2, 1 / nrm(v2));
    var v3 = [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
    var vs = [v1, v2, v3], lam = [1, 0.55, 0.3];
    var a0 = [-0.85, 0.75, -0.6], at = [0.8, -0.65, 0.7], S = 0.55, state = { r: 2, path: [a0], end: a0, gap: 0 };
    var W = function (p) { return mul(p, S); };

    function compute(r) {
      var G = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], i, j, k;
      for (k = 0; k < r; k++) for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) G[i][j] += lam[k] * vs[k][i] * vs[k][j];
      var b = G.map(function (row) { return row[0] * at[0] + row[1] * at[1] + row[2] * at[2]; });
      var a = a0.slice(), path = [a.slice()];
      for (var s = 0; s < 90; s++) {
        var g = G.map(function (row, q) { return row[0] * a[0] + row[1] * a[1] + row[2] * a[2] - b[q]; });
        a = [a[0] - g[0], a[1] - g[1], a[2] - g[2]]; path.push(a.slice());
      }
      state = { r: r, path: path, end: a, gap: nrm(sub(at, a)) };
      ro.innerHTML = '<div class="pair"><span>rank of <i>VV<sup>T</sup></i>: <b>' + r + ' of 3</b></span><span>reachable set <i>&alpha;<sub>0</sub> + range(VV<sup>T</sup>)</i>: <b>' + (r === 3 ? 'all of space' : r === 2 ? 'a plane' : 'a line') + '</b></span><span>distance from the target after 90 steps: <b>' + state.gap.toFixed(2) + '</b></span></div>';
      view.touch();
    }
    V.slider(controls, 'Rank of VVᵀ', 1, 3, 1, 2, function (v) { return v; }, compute);
    view.onDraw = function (api) {
      cube(api, -0.55, 0.55);
      var r = state.r;
      if (r === 2) {
        var ext = 1.5, P = function (s, q) { return W(add(a0, add(mul(v1, s), mul(v2, q)))); };
        api.poly([P(-ext, -ext), P(ext, -ext), P(ext, ext), P(-ext, ext)], { fill: 'hl', fa: 0.28, stroke: 'gray', w: 1.4, a: 0.7 });
        for (var g = -1.5; g <= 1.5; g += 0.5) { api.line(P(g, -ext), P(g, ext), { c: 'gray', w: 1, a: 0.5 }); api.line(P(-ext, g), P(ext, g), { c: 'gray', w: 1, a: 0.5 }); }
      } else if (r === 1) {
        api.line(W(add(a0, mul(v1, -3))), W(add(a0, mul(v1, 3))), { c: 'gray', w: 2.4, dash: [7, 6] });
      }
      api.path(state.path.map(W), { c: 'ink', w: 3.2, zb: 8 });
      api.dot(W(a0), { r: 5.5, c: 'ink' }); api.text(W(a0), 'start', { dx: -10, dy: -10, align: 'right' });
      api.dot(W(at), { r: 9, c: 'hl', stroke: 'ink', sw: 2.4 }); api.text(W(at), 'target α*', { dx: 14, dy: 22 });
      api.dot(W(state.end), { r: 6, c: 'bg', stroke: 'ink', sw: 3 });
      if (state.gap > 0.03) { api.line(W(state.end), W(at), { c: 'ink', w: 2, dash: [3, 6], a: 0.8 }); api.text(W(state.end), 'stops here', { dx: 14, dy: -8 }); }
    };
    compute(2);
    h('p', 'fig-cap', 'With rank 3 the iterates spiral into the target. With rank 2 they never leave the shaded plane through the start point, and with rank 1 they stay on the dashed line; the target lies off it, so gradient descent cannot reach it. This is exactly the &ldquo;if and only if&rdquo; of Theorem 1: convergence to the true solution needs <i>VV<sup>T</sup></i> to be full rank.', root);
  }

  /* ====================== Stanford Bunny: shared data and helpers */
  var P = [], Nr = [], ready = false;
  var d2 = function (a, b) { var x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return x * x + y * y + z * z; };
  function nearestIdx(x, pts) { var b = 0, bd = 1e9; for (var i = 0; i < pts.length; i++) { var d = d2(x, pts[i]); if (d < bd) { bd = d; b = i; } } return b; }
  // signed distance to the scanned surface: distance to the nearest sample, signed by its outward normal
  function sdf(x) { var i = nearestIdx(x, P), s = dot(sub(x, P[i]), Nr[i]); return (s >= 0 ? 1 : -1) * Math.sqrt(d2(x, P[i])); }
  function fps(pts, k, start) {
    var sel = [start], dd = pts.map(function (p) { return d2(p, pts[start]); });
    while (sel.length < k) {
      var bi = 0; for (var i = 1; i < pts.length; i++) if (dd[i] > dd[bi]) bi = i;
      sel.push(bi);
      for (var j = 0; j < pts.length; j++) { var t = d2(pts[j], pts[bi]); if (t < dd[j]) dd[j] = t; }
    }
    return sel;
  }
  // phi(x) = grad ||x - p||^3 = 3 ||x-p|| (x-p)
  function phi(x, p) { var d = sub(x, p), n = nrm(d); return mul(d, 3 * n); }
  function matrix(Q, K) { // V^T: rows = queries, 3 columns per kernel point (hard Voronoi support)
    return Q.map(function (q) { var row = new Array(3 * K).fill(0), f = phi(q.x, q.p); row[3 * q.cell] = f[0]; row[3 * q.cell + 1] = f[1]; row[3 * q.cell + 2] = f[2]; return row; });
  }
  function heat(svg, A, sel, K) {
    svg.textContent = '';
    var N = 3 * K, s = 300, c = s / N, m = 0, x0 = 8, y0 = 8;
    A.forEach(function (row) { row.forEach(function (v) { m = Math.max(m, Math.abs(v)); }); });
    el('rect', { x: x0, y: y0, width: s, height: s, fill: 'none', stroke: 'var(--sk-faint)', 'stroke-width': 2, rx: 3 }, svg);
    A.forEach(function (row, r) { row.forEach(function (v, q) { if (Math.abs(v) > 1e-9 * (m || 1)) el('rect', { x: x0 + q * c, y: y0 + r * c, width: c + 0.3, height: c + 0.3, fill: 'var(--sk-ink)', 'fill-opacity': Math.min(1, Math.pow(Math.abs(v) / m, 0.6)) }, svg); }); });
    if (sel != null) el('rect', { x: x0 + 3 * sel * c, y: y0 + 3 * sel * c, width: 3 * c, height: 3 * c, fill: 'var(--sk-hl)', 'fill-opacity': 0.3, stroke: 'var(--sk-ink)', 'stroke-width': 2.4, rx: 2 }, svg);
  }
  function need(id, msg) { var r = document.getElementById(id); h('div', 'fig-sub', msg, r); }

  /* ===================================== B. Theorem 2 on the bunny */
  function figVoronoi() {
    var root = fig('fig-voronoi', 'Figure B · Voronoi patches on a real scan (Theorem 2)',
      'The Stanford Bunny as a point cloud. Every kernel point (cross) owns the patch of the scan closest to it, and its basis is switched on only inside that patch. Take three independent queries per patch and the data matrix falls into 3&times;3 blocks along the diagonal. Click a kernel point or use the slider to pick a patch. Drag to rotate.');
    var controls = h('div', 'controls-row', null, root);
    var cols = h('div', 'fig-cols', null, root);
    var host = h('div', 'view-host', null, cols), right = h('div', null, null, cols);
    var view = new View3D(host, { aspect: 0.95, zoom: 2.5, center: [0, 0, 0], ry: 0.7, rx: -0.15, label: 'Interactive 3D view of the Stanford Bunny point cloud split into Voronoi patches' });
    var svg = el('svg', { viewBox: '0 0 316 316', role: 'img' }, right);
    var ro = h('div', 'readout', null, root);
    var K = 24, mode = 'full', sel = 0, seed = 1, S, ker, cellOf, colorOf, Q;

    function build() {
      var rs = V.rng(seed * 17 + 3), noise = V.rng(99);
      if (mode === 'full') S = P.map(function (p) { return p; });
      else S = P.filter(function (p, i) { return Nr[i][2] > 0.05; }).map(function (p) { return [p[0] + (noise() - 0.5) * 0.012, p[1] + (noise() - 0.5) * 0.012, p[2] + (noise() - 0.5) * 0.012]; });
      var idx = fps(S, K, Math.floor(rs() * S.length));
      ker = idx.map(function (i) { return S[i]; });
      cellOf = S.map(function (p) { return nearestIdx(p, ker); });
      // greedy 4-colouring of neighbouring patches (two nearest kernel points of a sample are neighbours)
      var adj = ker.map(function () { return {}; });
      S.forEach(function (p, i) { var a = cellOf[i], b2 = -1, bd = 1e9; ker.forEach(function (k, j) { if (j !== a) { var d = d2(p, k); if (d < bd) { bd = d; b2 = j; } } }); if (b2 >= 0) { adj[a][b2] = 1; adj[b2][a] = 1; } });
      colorOf = []; var tones = ['ink', 'gray', 'faint', 'hl'];
      ker.forEach(function (k, i) { var used = {}; Object.keys(adj[i]).forEach(function (j) { if (colorOf[j] != null) used[colorOf[j]] = 1; }); var c = 0; while (used[c]) c++; colorOf[i] = c % 4; });
      Q = []; var cellPts = ker.map(function () { return []; });
      S.forEach(function (p, i) { cellPts[cellOf[i]].push(p); });
      ker.forEach(function (p, i) { for (var k = 0; k < 3; k++) { var b = cellPts[i][Math.floor(rs() * cellPts[i].length)], v = [rs() - 0.5, rs() - 0.5, rs() - 0.5]; Q.push({ cell: i, p: p, x: add(b, mul(v, 0.08)) }); } });
      var A = matrix(Q, K), ev = V.eigvals(V.gram(A));
      heat(svg, A, sel, K);
      ro.innerHTML = '<div class="pair"><span>scan points: <b>' + S.length + '</b></span><span>kernel points / patches: <b>' + K + '</b></span><span>rank of <i>VV<sup>T</sup></i>: <b>' + V.rank(ev) + ' of ' + (3 * K) + '</b></span><span>selected patch: <b>' + cellPts[sel].length + '</b> scan points</span></div>';
      view.touch();
    }
    var sl = V.slider(controls, 'Selected patch', 1, K, 1, 1, function (v) { return v; }, function (v) { sel = v - 1; build(); });
    var seg = h('div', 'seg', null, controls), b1 = h('button', null, 'Complete scan', seg), b2 = h('button', null, 'Single-view scan', seg);
    b1.setAttribute('aria-pressed', 'true'); b2.setAttribute('aria-pressed', 'false');
    function setMode(m) { mode = m; b1.setAttribute('aria-pressed', m === 'full'); b2.setAttribute('aria-pressed', m !== 'full'); build(); }
    b1.onclick = function () { setMode('full'); }; b2.onclick = function () { setMode('partial'); };
    V.button(controls, 'New kernel points', function () { seed++; build(); });
    view.onClick = function (x, y) { var i = view.pick(ker, x, y, 24); if (i >= 0) { sl.input.value = i + 1; sl.input.dispatchEvent(new Event('input')); } };
    view.onDraw = function (api) {
      var tones = ['ink', 'gray', 'faint', 'hl'], list = [];
      S.forEach(function (p, i) { var c = cellOf[i], on = c === sel; list.push({ p: p, r: on ? 3.6 : 2.7, c: tones[colorOf[c]], a: on ? 1 : 0.8 }); });
      api.dots(list);
      Q.forEach(function (q) { if (q.cell === sel) api.dot(q.x, { r: 6.5, c: 'hl', stroke: 'ink', sw: 2.4 }); });
      ker.forEach(function (p, i) { var s = i === sel ? 0.035 : 0.02, o = { c: 'ink', w: i === sel ? 4.4 : 2.8 }; cross(api, p, s, o); });
    };
    build();
    h('p', 'fig-cap', 'Dots are the scan, shaded by the patch (Voronoi cell) they fall in; the selected patch is drawn large, with its three queries highlighted (points in the space around the patch, not on the surface). Right: the data matrix <i>V<sup>T</sup></i>, one row per query and three columns per kernel point. A query only feels its own patch&rsquo;s basis, so everything off the blocks is exactly zero, and three independent queries make each block full rank, hence <i>VV<sup>T</sup></i> is full rank. The queries must really be independent: three points on a flat sheet of surface are not. For a partial scan the paper predicts the kernel points with a network; here they are picked by farthest-point sampling as a stand-in.', root);
  }

  /* ==================================== C. Algorithm 1 on the bunny */
  function figSelect() {
    var root = fig('fig-select', 'Figure C · Faster-convergence query selection (Algorithm 1)',
      'Left: the bunny with a small tripod at every kernel point, the queries <i>p<sub>i</sub> + &epsilon;&nbsp;x&#770;</i>, <i>p<sub>i</sub> + &epsilon;&nbsp;y&#770;</i>, <i>p<sub>i</sub> + &epsilon;&nbsp;z&#770;</i>. Right: zoom into one kernel point and compare with three random queries in its patch. Each block becomes 3&epsilon;<sup>2</sup>&middot;I, so <i>VV<sup>T</sup> = cI</i>.');
    var controls = h('div', 'controls-row', null, root);
    var cols = h('div', 'fig-cols', null, root);
    var hostA = h('div', 'view-host', null, cols), hostB = h('div', 'view-host', null, cols);
    var viewA = new View3D(hostA, { aspect: 0.95, zoom: 2.5, center: [0, 0, 0], ry: 0.7, rx: -0.15, label: 'Interactive 3D view of the bunny with query tripods at every kernel point' });
    var viewB = new View3D(hostB, { aspect: 0.95, zoom: 15, auto: false, ry: 0.5, rx: -0.3, label: 'Interactive zoom on the queries around one kernel point' });
    var heats = h('div', 'fig-cols', null, root), hA = h('div', null, null, heats), hB = h('div', null, null, heats);
    var svgR = el('svg', { viewBox: '0 0 316 340', role: 'img' }, hA), svgT = el('svg', { viewBox: '0 0 316 340', role: 'img' }, hB);
    var chartWrap = h('div', null, null, root), svgC = el('svg', { viewBox: '0 0 640 190', role: 'img' }, chartWrap);
    var ro = h('div', 'readout', null, root);
    var K = 24, ker, nnD, epsMax, eps = 0.03, sel = 0, mode = 'alg1', qA, qR, cloudShown;

    ker = fps(P, K, 0).map(function (i) { return P[i]; });
    nnD = ker.map(function (p, i) { var m = 1e9; ker.forEach(function (q, j) { if (i !== j) m = Math.min(m, Math.sqrt(d2(p, q))); }); return m; });
    epsMax = Math.floor(100 * 0.45 * Math.min.apply(null, nnD)) / 100;
    eps = Math.min(eps, epsMax);
    cloudShown = P.filter(function (p, i) { return i % 2 === 0; });

    var rr = V.rng(5);
    qR = []; ker.forEach(function (p, i) { for (var k = 0; k < 3; k++) { var v; do { v = [rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1]; } while (dot(v, v) > 1); qR.push({ cell: i, p: p, x: add(p, mul(v, 0.6 * nnD[i])) }); } });
    function alg1Q(e) { var Q = []; ker.forEach(function (p, i) { [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (u) { Q.push({ cell: i, p: p, x: add(p, mul(u, e)) }); }); }); return Q; }

    function analyse(Q) {
      var N = 3 * K, A = matrix(Q, K), G = V.gram(A), ev = V.eigvals(G), s = Q.map(function (q) { return sdf(q.x); });
      var eta = 1 / ev[0], al = new Array(N).fill(0), s2 = s.reduce(function (t, v) { return t + v * v; }, 0), curve = [1], T = 40, c, r;
      function err() { var e = 0; A.forEach(function (row, r2) { var p = 0; for (var c2 = 0; c2 < N; c2++) p += row[c2] * al[c2]; e += (p - s[r2]) * (p - s[r2]); }); return e / s2; }
      for (var t = 0; t < T; t++) {
        var res = A.map(function (row, r2) { var p = 0; for (var c2 = 0; c2 < N; c2++) p += row[c2] * al[c2]; return p - s[r2]; });
        var g = new Array(N).fill(0); A.forEach(function (row, r2) { for (c = 0; c < N; c++) g[c] += row[c] * res[r2]; });
        for (c = 0; c < N; c++) al[c] -= eta * g[c];
        curve.push(Math.max(err(), 1e-14));
      }
      var off = 0, dmin = Infinity, dmax = 0;
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) { if (r === c) { dmin = Math.min(dmin, G[r][c]); dmax = Math.max(dmax, G[r][c]); } else off = Math.max(off, Math.abs(G[r][c])); }
      var it = curve.findIndex(function (v) { return v < 1e-6; });
      return { A: A, G: G, cond: ev[0] / Math.max(ev[N - 1], 1e-300), curve: curve, it: it < 0 ? null : it, off: off, dmin: dmin, dmax: dmax };
    }

    function update() {
      eps = Math.min(eps, epsMax);
      qA = alg1Q(eps);
      var rA = analyse(qA), rR = analyse(qR);
      heat(svgR, rR.G, sel, K); heat(svgT, rA.G, sel, K);
      [['random queries', svgR], ['Algorithm 1', svgT]].forEach(function (x) { var t = el('text', { x: 158, y: 334, 'text-anchor': 'middle', 'font-size': 22 }, x[1]); t.textContent = x[0]; });
      svgC.textContent = '';
      var g = el('g', null, svgC), x0 = 46, y0 = 24, w = 570, hh = 122;
      el('path', { d: 'M' + x0 + ' ' + y0 + 'V' + (y0 + hh) + 'H' + (x0 + w), stroke: 'var(--sk-ink)', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, g);
      var t1 = el('text', { x: x0 + 8, y: 20, 'font-size': 21 }, g); t1.textContent = 'error left (log scale, downwards = better)';
      var t2 = el('text', { x: x0 + w, y: y0 + hh + 28, 'text-anchor': 'end', 'font-size': 21 }, g); t2.textContent = 'gradient-descent steps';
      function line(res, col, wd) {
        var pts = res.curve.map(function (c, k) { return [x0 + (k / 40) * w, y0 + (Math.min(8, Math.max(0, -Math.log10(c))) / 8) * hh]; });
        el('path', { d: V.poly(pts), stroke: col, 'stroke-width': wd, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      }
      line(rR, 'var(--sk-gray)', 3); line(rA, 'var(--sk-ink)', 4);
      var fmt = function (r) { return r.it === null ? '&gt; 40' : r.it; };
      ro.innerHTML =
        '<div class="pair"><span><b>Algorithm 1</b>: diagonal of <i>VV<sup>T</sup></i> between <b>' + V.sci(rA.dmin) + '</b> and <b>' + V.sci(rA.dmax) + '</b>, largest off-diagonal <b>' + V.sci(rA.off) + '</b>, so <i>VV<sup>T</sup> = cI</i> with <i>c = 9&epsilon;<sup>4</sup> = ' + V.sci(9 * Math.pow(eps, 4)) + '</i>; condition number <b>' + rA.cond.toFixed(2) + '</b>; error below 10<sup>&minus;6</sup> after <b>' + fmt(rA) + '</b> step(s)</span></div>' +
        '<div class="pair"><span><b>Random queries</b>: condition number <b>' + V.sci(rR.cond) + '</b>; error below 10<sup>&minus;6</sup> after <b>' + fmt(rR) + '</b> steps</span></div>' +
        '<div class="legend"><span><i></i>Algorithm 1</span><span><i class="g"></i>random queries</span></div>';
      viewB.center = ker[sel]; viewA.touch(); viewB.touch();
    }
    V.slider(controls, 'Kernel point', 1, K, 1, 1, function (v) { return v; }, function (v) { sel = v - 1; update(); });
    V.slider(controls, 'Tripod size ε', 0.005, epsMax, 0.005, eps, function (v) { return v.toFixed(3); }, function (v) { eps = v; update(); });
    var seg = h('div', 'seg', null, controls), b1 = h('button', null, 'Algorithm 1', seg), b2 = h('button', null, 'Random queries', seg);
    b1.setAttribute('aria-pressed', 'true'); b2.setAttribute('aria-pressed', 'false');
    function setMode(m) { mode = m; b1.setAttribute('aria-pressed', m === 'alg1'); b2.setAttribute('aria-pressed', m !== 'alg1'); viewB.touch(); }
    b1.onclick = function () { setMode('alg1'); }; b2.onclick = function () { setMode('rand'); };
    viewA.onClick = function (x, y) { var i = viewA.pick(ker, x, y, 24); if (i >= 0) { sel = i; update(); } };

    viewA.onDraw = function (api) {
      api.dots(cloudShown.map(function (p) { return { p: p, r: 1.7, c: 'gray', a: 0.38 }; }));
      ker.forEach(function (p, i) {
        var o = { c: 'ink', w: i === sel ? 3.6 : 2.2 };
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (u) { api.line(p, add(p, mul(u, eps)), o); });
        api.dot(p, { r: i === sel ? 5.5 : 3.4, c: 'ink' });
      });
    };
    viewB.onDraw = function (api) {
      var p = ker[sel];
      api.dots(P.filter(function (q) { return d2(q, p) < 0.14 * 0.14; }).map(function (q) { return { p: q, r: 3, c: 'gray', a: 0.5 }; }));
      var Q = (mode === 'alg1' ? qA : qR).filter(function (q) { return q.cell === sel; });
      Q.forEach(function (q, k) {
        api.line(p, q.x, { c: 'ink', w: 2.6, dash: mode === 'alg1' ? null : [6, 6] });
        api.dot(q.x, { r: 7, c: 'hl', stroke: 'ink', sw: 2.6 });
        if (mode === 'alg1') api.text(q.x, ['x', 'y', 'z'][k], { dx: 10, dy: -8, size: 24 });
      });
      api.dot(p, { r: 7.5, c: 'ink' });
    };
    update();
    h('p', 'fig-cap', 'Left: kernel points on the bunny, each with its tripod. Right: one kernel point up close (grey dots are the scan surface). With Algorithm 1 the three queries sit at <i>p + &epsilon;</i> along the coordinate axes; the random queries scatter across the patch. Below the views: <i>VV<sup>T</sup></i> for both strategies (dark = large) and gradient descent on the signed-distance loss. The signed distance is estimated from the scan itself (distance to the nearest sample, signed by its normal).', root);
  }

  fetch('../assets/data/bunny.json').then(function (r) { return r.json(); }).then(function (j) {
    for (var i = 0; i < j.n; i++) { P.push([j.p[3 * i] / 1000, j.p[3 * i + 1] / 1000, j.p[3 * i + 2] / 1000]); Nr.push([j.nr[3 * i] / 100, j.nr[3 * i + 1] / 100, j.nr[3 * i + 2] / 100]); }
    figVoronoi(); figSelect();
  }).catch(function () {
    need('fig-voronoi', 'The bunny data could not be loaded (open this page from a web server, not from a file).');
    need('fig-select', 'The bunny data could not be loaded.');
  });
  figStuck();
})();
