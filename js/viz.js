/*
 * viz.js — tiny helpers for the interactive figures in the blog posts.
 * Everything here is computed live in the browser (no data files, no libraries).
 */
(function (g) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var TAU = Math.PI * 2;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, html, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* --- basis functions (d = distance, r = nominal radius) --- */
  function gauss(d, r) { return Math.exp(-Math.pow(d / (0.5 * r), 2)); }
  function wend(d, r) { var q = d / r; return q >= 1 ? 0 : Math.pow(1 - q, 4) * (4 * q + 1); } // Wendland C2, compact support

  function rng(seed) {
    var a = seed | 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --- small dense linear algebra --- */
  function eigvals(M) { // symmetric matrix, Jacobi rotations
    var n = M.length, A = M.map(function (r) { return r.slice(); }), s, p, q, k;
    for (s = 0; s < 80; s++) {
      var off = 0, i, j;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-30) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        var th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        var t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        var c = 1 / Math.sqrt(t * t + 1), sn = t * c;
        for (k = 0; k < n; k++) { var a1 = A[k][p], b1 = A[k][q]; A[k][p] = c * a1 - sn * b1; A[k][q] = sn * a1 + c * b1; }
        for (k = 0; k < n; k++) { var a2 = A[p][k], b2 = A[q][k]; A[p][k] = c * a2 - sn * b2; A[q][k] = sn * a2 + c * b2; }
      }
    }
    return A.map(function (r, i) { return Math.abs(r[i]); }).sort(function (a, b) { return b - a; });
  }

  function solve(M, b) { // Gaussian elimination with partial pivoting
    var n = b.length, i, j, k;
    M = M.map(function (r, i2) { return r.concat([b[i2]]); });
    for (i = 0; i < n; i++) {
      var p = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
      var tmp = M[i]; M[i] = M[p]; M[p] = tmp;
      for (k = i + 1; k < n; k++) { var f = M[k][i] / M[i][i]; for (j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
    }
    var x = new Array(n).fill(0);
    for (i = n - 1; i >= 0; i--) { var s = M[i][n]; for (j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }

  function gram(A) { // A^T A for a row-major matrix
    var n = A[0].length, G = [], i, j, k;
    for (i = 0; i < n; i++) { G.push(new Array(n).fill(0)); }
    for (k = 0; k < A.length; k++) for (i = 0; i < n; i++) { var a = A[k][i]; if (a === 0) continue; for (j = 0; j < n; j++) G[i][j] += a * A[k][j]; }
    return G;
  }

  function rank(ev) { return ev.filter(function (v) { return v > 1e-10 * ev[0]; }).length; }
  function sci(x) {
    if (!isFinite(x)) return '&infin;';
    if (x < 1000 && x >= 0.01) return x < 1 ? x.toFixed(2) : x < 10 ? x.toFixed(1) : String(Math.round(x));
    if (x === 0) return '0';
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    return m.toFixed(1) + '&times;10<sup>' + e + '</sup>';
  }

  /* --- voronoi cells of `sites` in the unit square (half-plane clipping) --- */
  function voronoi(sites) {
    return sites.map(function (s, i) {
      var poly = [[0, 0], [1, 0], [1, 1], [0, 1]];
      sites.forEach(function (t, j) {
        if (i === j) return;
        var mx = (s[0] + t[0]) / 2, my = (s[1] + t[1]) / 2, nx = t[0] - s[0], ny = t[1] - s[1], out = [];
        for (var k = 0; k < poly.length; k++) {
          var a = poly[k], b = poly[(k + 1) % poly.length];
          var da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
          if (da <= 0) out.push(a);
          if ((da <= 0) !== (db <= 0)) { var u = da / (da - db); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
        }
        poly = out;
      });
      return poly;
    });
  }

  function nearest(p, sites) {
    var b = 0, bd = 1e9;
    sites.forEach(function (s, k) { var d = (s[0] - p[0]) * (s[0] - p[0]) + (s[1] - p[1]) * (s[1] - p[1]); if (d < bd) { bd = d; b = k; } });
    return b;
  }

  // Lloyd relaxation: move every site to the centroid of its cell (a stand-in selection rule)
  function lloyd(sites, rounds) {
    var S = sites.map(function (s) { return s.slice(); }), pts = [], i, j;
    for (i = 0; i < 40; i++) for (j = 0; j < 40; j++) pts.push([(i + 0.5) / 40, (j + 0.5) / 40]);
    for (var r = 0; r < rounds; r++) {
      var acc = S.map(function () { return [0, 0, 0]; });
      pts.forEach(function (p) { var b = nearest(p, S); acc[b][0] += p[0]; acc[b][1] += p[1]; acc[b][2]++; });
      S = S.map(function (s, k) { return acc[k][2] ? [acc[k][0] / acc[k][2], acc[k][1] / acc[k][2]] : s; });
    }
    return S;
  }

  /* --- UI --- */
  function slider(parent, label, min, max, step, val, fmt, cb) {
    var row = h('label', 'ctl-row', null, parent);
    h('span', 'ctl-name', label, row);
    var input = h('input', null, null, row);
    input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = val;
    var out = h('output', null, null, row);
    function upd() {
      var v = parseFloat(input.value);
      out.innerHTML = fmt ? fmt(v) : v;
      input.style.setProperty('--p', (((v - min) / (max - min)) * 100).toFixed(1) + '%');
    }
    input.addEventListener('input', function () { upd(); cb(parseFloat(input.value)); });
    upd();
    return { input: input, get: function () { return parseFloat(input.value); } };
  }

  function button(parent, label, cb) {
    var b = h('button', 'btn btn-sm', label, parent);
    b.type = 'button';
    b.addEventListener('click', cb);
    return b;
  }

  var filterId = 0;
  // hand-drawn wobble for dynamic curves
  function wobble(svg, scale) {
    var id = 'wob' + (++filterId);
    var d = el('defs', null, svg), f = el('filter', { id: id, x: '-3%', y: '-3%', width: '106%', height: '106%' }, d);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.03', numOctaves: '2', seed: '4', result: 'n' }, f);
    el('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'n', scale: String(scale || 2.4), xChannelSelector: 'R', yChannelSelector: 'G' }, f);
    return 'url(#' + id + ')';
  }

  function poly(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); }

  g.Viz = {
    el: el, h: h, gauss: gauss, wend: wend, rng: rng, eigvals: eigvals, solve: solve, gram: gram, rank: rank, sci: sci,
    voronoi: voronoi, nearest: nearest, lloyd: lloyd, slider: slider, button: button, wobble: wobble, poly: poly, TAU: TAU,
  };
})(window);
