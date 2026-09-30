/*
 * Interactive 3D figures for the LISR explainer. Everything is computed live.
 *   A. Theorem 1  – gradient descent is confined to alpha0 + range(VV^T)
 *   B. Theorem 2  – Voronoi supports + 3 queries per cell => block-diagonal, full rank
 *   C. Algorithm 1 – queries at p + eps*(x,y,z) make VV^T = c*I
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

  /* ============================ shared scene: kernel points + Voronoi cells */
  var K = 10, N = 3 * K, seed = 7, sites, dense, cellOf, cellPts, dispPts, epsMax;
  function near(p) { var b = 0, bd = 1e9; sites.forEach(function (s, k) { var d = nrm(sub(p, s)); if (d < bd) { bd = d; b = k; } }); return b; }
  function layout() {
    var r = V.rng(seed), i;
    sites = []; for (i = 0; i < K; i++) sites.push([0.12 + 0.76 * r(), 0.12 + 0.76 * r(), 0.12 + 0.76 * r()]);
    dense = []; for (i = 0; i < 6000; i++) dense.push([r(), r(), r()]);
    cellOf = dense.map(function (p) { return near(p); });
    cellPts = sites.map(function () { return []; });
    dense.forEach(function (p, k) { cellPts[cellOf[k]].push(p); });
    dispPts = dense.slice(0, 900).map(function (p, k) { return { p: p, c: cellOf[k] }; });
    var m = 1e9;
    sites.forEach(function (a, i2) { sites.forEach(function (b, j2) { if (i2 !== j2) m = Math.min(m, nrm(sub(a, b))); }); });
    epsMax = Math.floor(100 * 0.45 * m) / 100;
  }
  // phi(x) = grad ||x - p||^3 = 3 ||x-p|| (x-p)
  function phi(x, p) { var d = sub(x, p), n = nrm(d); return mul(d, 3 * n); }
  function queries(mode, eps, rs) {
    var Q = [];
    sites.forEach(function (p, i) {
      if (mode === 'alg1') { [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (e) { Q.push({ cell: i, x: add(p, mul(e, eps)) }); }); }
      else { for (var k = 0; k < 3; k++) Q.push({ cell: i, x: cellPts[i][Math.floor(rs() * cellPts[i].length)] }); }
    });
    return Q;
  }
  function matrix(Q) { // V^T: rows = queries, columns = 3 coefficients per kernel point (hard Voronoi support)
    return Q.map(function (q) { var row = new Array(N).fill(0), f = phi(q.x, sites[q.cell]); row[3 * q.cell] = f[0]; row[3 * q.cell + 1] = f[1]; row[3 * q.cell + 2] = f[2]; return row; });
  }
  function heat(svg, A, sel) {
    svg.textContent = '';
    var s = 300, c = s / N, m = 0, x0 = 8, y0 = 8;
    A.forEach(function (row) { row.forEach(function (v) { m = Math.max(m, Math.abs(v)); }); });
    el('rect', { x: x0, y: y0, width: s, height: s, fill: 'none', stroke: 'var(--sk-faint)', 'stroke-width': 2, rx: 3 }, svg);
    A.forEach(function (row, r) { row.forEach(function (v, q) { if (Math.abs(v) > 1e-9 * (m || 1)) el('rect', { x: x0 + q * c, y: y0 + r * c, width: c + 0.3, height: c + 0.3, fill: 'var(--sk-ink)', 'fill-opacity': Math.min(1, Math.pow(Math.abs(v) / m, 0.6)) }, svg); }); });
    if (sel != null) el('rect', { x: x0 + 3 * sel * c, y: y0 + 3 * sel * c, width: 3 * c, height: 3 * c, fill: 'var(--sk-hl)', 'fill-opacity': 0.25, stroke: 'var(--sk-ink)', 'stroke-width': 2.4, rx: 2 }, svg);
  }

  /* ====================================== B. Theorem 2: Voronoi -> blocks */
  function figVoronoi() {
    var root = fig('fig-voronoi', 'Figure B · Voronoi supports make the matrix block-diagonal (Theorem 2)',
      'Every kernel point (cross) owns its 3D Voronoi cell, and its basis is switched on only inside that cell (<i>r<sub>i</sub>(x) = 1</i> there, 0 elsewhere). Take three independent queries per cell and the data matrix falls into 3&times;3 blocks along the diagonal. Click a kernel point, or use the slider, to pick a cell. Drag to rotate.');
    var controls = h('div', 'controls-row', null, root);
    var cols = h('div', 'fig-cols', null, root);
    var host = h('div', 'view-host', null, cols);
    var right = h('div', null, null, cols);
    var view = new View3D(host, { aspect: 0.95, zoom: 1.45, label: 'Interactive 3D view of Voronoi cells around kernel points' });
    var svg = el('svg', { viewBox: '0 0 316 316', role: 'img' }, right);
    var ro = h('div', 'readout', null, root);
    var sel = 0, Q, A, sl;
    function rebuild() {
      Q = queries('random', 0, V.rng(seed + 100)); A = matrix(Q);
      var ev = V.eigvals(V.gram(A)), rk = V.rank(ev);
      heat(svg, A, sel);
      ro.innerHTML = '<div class="pair"><span>rank of <i>VV<sup>T</sup></i>: <b>' + rk + ' of ' + N + '</b></span><span>blocks: <b>' + K + '</b> of size 3&times;3, each full rank</span><span>selected cell holds <b>' + Math.round(100 * cellPts[sel].length / dense.length) + '%</b> of the volume</span></div>';
      view.touch();
    }
    sl = V.slider(controls, 'Selected cell', 1, K, 1, 1, function (v) { return v; }, function (v) { sel = v - 1; rebuild(); });
    V.button(controls, 'New layout', function () { seed++; layout(); rebuild(); });
    view.onClick = function (x, y) { var i = view.pick(sites, x, y, 26); if (i >= 0) { sl.input.value = i + 1; sl.input.dispatchEvent(new Event('input')); } };
    view.onDraw = function (api) {
      cube(api, 0, 1);
      dispPts.forEach(function (d) { api.dot(d.p, d.c === sel ? { r: 2.7, c: 'ink' } : { r: 1.7, c: 'gray', a: 0.35 }); });
      Q.forEach(function (q) { if (q.cell === sel) api.dot(q.x, { r: 6, c: 'hl', stroke: 'ink', sw: 2.2 }); });
      sites.forEach(function (p, i) { cross(api, p, i === sel ? 0.05 : 0.028, { c: 'ink', w: i === sel ? 4 : 2.6 }); });
    };
    rebuild();
    h('p', 'fig-cap', 'Left: kernel points, and space samples coloured by the cell they fall in (the selected cell in dark ink; the highlighted dots are its three queries). Right: the data matrix <i>V<sup>T</sup></i> &ndash; one row per query, three columns per kernel point. A query only feels its own cell&rsquo;s basis, so everything off the blocks is exactly zero. The rank of a block-diagonal matrix is the sum of its blocks&rsquo; ranks; three independent queries make every block full rank, hence <i>VV<sup>T</sup></i> is full rank.', root);
  }

  /* ================================= C. Algorithm 1: VV^T = c I, and speed */
  function figSelect() {
    var root = fig('fig-select', 'Figure C · Faster-convergence query selection (Algorithm 1)',
      'Instead of any three independent queries, put them at <i>p<sub>i</sub> + &epsilon;&nbsp;x&#770;</i>, <i>p<sub>i</sub> + &epsilon;&nbsp;y&#770;</i>, <i>p<sub>i</sub> + &epsilon;&nbsp;z&#770;</i> &ndash; a small tripod around every kernel point. Each block becomes 3&epsilon;<sup>2</sup>&middot;I, so <i>VV<sup>T</sup> = cI</i>. Compare the two strategies.');
    var controls = h('div', 'controls-row', null, root);
    var cols = h('div', 'fig-cols', null, root);
    var host = h('div', 'view-host', null, cols);
    var right = h('div', null, null, cols);
    var view = new View3D(host, { aspect: 0.95, zoom: 6.5, auto: false, label: 'Interactive 3D view of the query tripod around one kernel point' });
    var svgH = el('svg', { viewBox: '0 0 316 316', role: 'img' }, right);
    var mode = 'alg1', sel = 0, eps = 0.06, qA, qR;
    var seg = h('div', 'seg', null, controls), b1 = h('button', null, 'Algorithm 1', seg), b2 = h('button', null, 'Random in cell', seg);
    b1.setAttribute('aria-pressed', 'true'); b2.setAttribute('aria-pressed', 'false');
    function setMode(m) { mode = m; b1.setAttribute('aria-pressed', m === 'alg1'); b2.setAttribute('aria-pressed', m !== 'alg1'); update(); }
    b1.onclick = function () { setMode('alg1'); }; b2.onclick = function () { setMode('rand'); };
    V.slider(controls, 'Kernel point', 1, K, 1, 1, function (v) { return v; }, function (v) { sel = v - 1; update(); });
    V.slider(controls, 'Tripod size ε', 0.01, 0.12, 0.005, 0.06, function (v) { return v.toFixed(3); }, function (v) { eps = Math.min(v, epsMax); update(); });
    var chartWrap = h('div', null, null, root), svgC = el('svg', { viewBox: '0 0 640 190', role: 'img' }, chartWrap);
    var ro = h('div', 'readout', null, root);
    var target = function (x) { return nrm(sub(x, [0.5, 0.5, 0.5])) - 0.3; };

    function analyse(Q) {
      var A = matrix(Q), G = V.gram(A), ev = V.eigvals(G), s = Q.map(function (q) { return target(q.x); });
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
      qA = queries('alg1', eps); qR = queries('random', 0, V.rng(seed + 100));
      var rA = analyse(qA), rR = analyse(qR), cur = mode === 'alg1' ? rA : rR;
      heat(svgH, cur.G, sel);
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
        '<div class="pair"><span><b>Algorithm 1</b> &mdash; diagonal of <i>VV<sup>T</sup></i> between <b>' + V.sci(rA.dmin) + '</b> and <b>' + V.sci(rA.dmax) + '</b>, largest off-diagonal <b>' + V.sci(rA.off) + '</b> &rarr; <i>cI</i> with <i>c = 9&epsilon;<sup>4</sup> = ' + V.sci(9 * Math.pow(eps, 4)) + '</i>; condition number <b>' + rA.cond.toFixed(2) + '</b>; error below 10<sup>&minus;6</sup> after <b>' + fmt(rA) + '</b> step(s)</span></div>' +
        '<div class="pair"><span><b>Random in cell</b> &mdash; condition number <b>' + V.sci(rR.cond) + '</b>; error below 10<sup>&minus;6</sup> after <b>' + fmt(rR) + '</b> steps</span></div>' +
        '<div class="legend"><span><i></i>Algorithm 1</span><span><i class="g"></i>random in cell</span></div>';
      view.center = sites[sel]; view.touch();
    }
    view.onDraw = function (api) {
      var p = sites[sel];
      cellPts[sel].slice(0, 500).forEach(function (x) { api.dot(x, { r: 1.6, c: 'gray', a: 0.3 }); });
      sites.forEach(function (s, i) { if (i !== sel && nrm(sub(s, p)) < 0.5) cross(api, s, 0.02, { c: 'gray', w: 1.6 }); });
      (mode === 'alg1' ? qA : qR).filter(function (q) { return q.cell === sel; }).forEach(function (q, k) {
        api.line(p, q.x, { c: 'ink', w: 2.4, dash: mode === 'alg1' ? null : [5, 5] });
        api.dot(q.x, { r: 6.5, c: 'hl', stroke: 'ink', sw: 2.4 });
        if (mode === 'alg1') api.text(q.x, ['x', 'y', 'z'][k], { dx: 9, dy: -7, size: 22 });
      });
      api.dot(p, { r: 7, c: 'ink' });
    };
    update();
    h('p', 'fig-cap', 'Left: one kernel point with its cell&rsquo;s space samples (grey) and its three queries. Right: <i>VV<sup>T</sup></i> for the chosen strategy (dark = large). Below: gradient descent on the SDF loss for both strategies &ndash; with the tripod, all directions are scaled equally, so a single step lands on the optimum. Toy setup: 10 kernel points in the unit cube fitting the signed distance of a sphere.', root);
  }

  layout();
  figStuck(); figVoronoi(); figSelect();
})();
