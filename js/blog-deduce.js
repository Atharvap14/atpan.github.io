/*
 * Interactive figures for the DeduCE explainer.
 *  1. Walk a proof – premises, hops and the window the model is checked on
 *  2. Where accuracy goes – a schematic of the paper's finding (not real data)
 */
(function () {
  'use strict';
  var V = window.Viz, el = V.el, h = V.h;

  var PREM = [
    ['P1', 'A bakery bakes 12 loaves an hour.'],
    ['P2', 'It bakes for 5 hours a day.'],
    ['P3', 'Each loaf sells for $3.'],
    ['P4', 'Ingredients cost $50 a day.'],
    ['P5', '10% of the profit is paid as tax.'],
  ];
  var DIST = ['The shop has 4 employees.', 'The oven was installed in 2019.', 'The shop is on Maple Street.', 'The owner has a dog named Biscuit.'];
  var STEPS = [
    ['S1', 'Loaves a day = 12 × 5 = 60', 'from P1, P2'],
    ['S2', 'Revenue = 60 × $3 = $180', 'from S1, P3'],
    ['S3', 'Profit = $180 − $50 = $130', 'from S2, P4'],
    ['S4', 'Tax = 10% of $130 = $13', 'from S3, P5'],
    ['S5', 'Take-home = $130 − $13 = $117', 'from S3, S4'],
  ];

  /* ---------------------------------------------------------- figure 1 */
  (function walk() {
    var root = document.getElementById('fig-walk');
    h('div', 'fig-title', 'Figure 1 · Walk a proof', root);
    h('div', 'fig-sub', 'A chain of thought is a proof: premises go in, each hop derives something new. DeduCE looks at two things separately &ndash; how many premises the model has to read, and how many hops it has to chain.', root);
    var controls = h('div', 'controls-row', null, root);
    var box = h('div', 'wk', null, root);
    var q = h('div', 'q', '<b>Question.</b> How much does the owner take home per day?', box);
    var colP = h('div', null, null, box), colS = h('div', null, null, box);
    h('h4', null, 'premises the model reads', colP);
    var olP = h('ol', null, null, colP);
    h('h4', null, 'hops in the reference proof', colS);
    var olS = h('ol', null, null, colS);
    var out = h('div', 'readout', null, root);

    var extra = V.slider(controls, 'Extra premises', 0, 4, 1, 0, function (v) { return '+' + v; }, upd);
    var win = V.slider(controls, 'Hops to derive', 1, 5, 1, 2, function (v) { return v; }, upd);
    var start = V.slider(controls, 'Window starts at hop', 1, 5, 1, 2, function (v) { return v; }, upd);

    function upd() {
      var n = extra.get(), k = win.get(), s0 = start.get();
      if (s0 + k - 1 > 5) { s0 = 5 - k + 1; start.input.value = s0; start.input.dispatchEvent(new Event('input')); return; }
      start.input.max = 5 - k + 1;
      olP.textContent = '';
      var list = PREM.map(function (p) { return { id: p[0], t: p[1], d: false }; });
      for (var i = 0; i < n; i++) list.splice(1 + i * 2, 0, { id: '·', t: DIST[i], d: true });
      list.forEach(function (p) { h('li', p.d ? 'distract' : '', '<span class="id">' + p.id + '</span>' + p.t, olP); });
      olS.textContent = '';
      STEPS.forEach(function (st, i) {
        var idx = i + 1, cls = idx < s0 ? 'given' : idx < s0 + k ? 'win' : 'later';
        h('li', cls, '<span class="id">' + st[0] + '</span>' + st[1] + '<span class="uses">' + st[2] + '</span>', olS);
      });
      var ctx = list.length;
      out.innerHTML = '<div class="pair"><span>premises in context: <b>' + ctx + '</b>' + (n ? ' (' + n + ' irrelevant)' : '') + '</span><span>hops to chain: <b>' + k + '</b></span></div>' +
        '<div class="pair"><span>The reference proof up to hop ' + (s0 - 1) + ' is given; the model must produce the highlighted hop' + (k > 1 ? 's' : '') + ' itself, and its own trace is checked against the reference.</span></div>';
    }
    upd();
    h('p', 'fig-cap', 'A made-up bakery problem, not one from the benchmark. Extra premises make the model read more; more hops make it chain more. The paper varies each on its own.', root);
  })();

  /* ---------------------------------------------------------- figure 2 */
  (function decay() {
    var root = document.getElementById('fig-decay');
    h('div', 'fig-title', 'Figure 2 · Where the accuracy goes', root);
    h('div', 'fig-sub', 'The paper&rsquo;s finding, drawn as a schematic. Toggle between the benchmark as published and freshly perturbed versions of the same problems.', root);
    var controls = h('div', 'controls-row', null, root);
    var seg = h('div', 'seg', null, controls), bo = h('button', null, 'Original benchmark', seg), bn = h('button', null, 'Novel variants', seg);
    var cols = h('div', 'fig-cols', null, root);
    var svgs = [svgIn(cols), svgIn(cols)];
    var ro = h('div', 'readout', null, root);
    var mode = 'novel';

    function svgIn(parent) { return el('svg', { viewBox: '0 0 340 230', role: 'img' }, parent); }
    function chart(svg, xlabel, kind, novel) {
      svg.textContent = '';
      var rough = V.wobble(svg, 1.8), g = el('g', { filter: rough }, svg);
      var x0 = 34, y0 = 24, w = 292, hh = 150;
      el('path', { d: 'M' + x0 + ' ' + y0 + 'V' + (y0 + hh) + 'H' + (x0 + w), stroke: 'var(--sk-ink)', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, g);
      var t = el('text', { x: x0 + w, y: y0 + hh + 30, 'text-anchor': 'end', 'font-size': 23 }, g); t.textContent = xlabel;
      var t2 = el('text', { x: x0, y: 16, 'font-size': 21 }, g); t2.textContent = 'deductive consistency';
      var top = y0 + 26;
      var X = function (i) { return x0 + 14 + (i / 4) * (w - 34); };
      if (kind === 'hops' && novel) {
        // band: falls by 15-30% between hop 1 and hop 5 (paper); drawn relative to the hop-1 level
        var drop = function (f) { return top + f * (hh - 26) * 1.6; };
        var upper = [], lower = [], mid = [];
        for (var i = 0; i < 5; i++) {
          var u = i / 4;
          upper.push([X(i), drop(0.15 * u * u * 0.7 + 0.15 * u * 0.3)]); lower.push([X(i), drop(0.30 * u * u * 0.7 + 0.30 * u * 0.3)]);
          mid.push([X(i), drop(0.225 * (u * u * 0.7 + u * 0.3))]);
        }
        el('path', { d: V.poly(upper) + V.poly(lower.slice().reverse()).replace('M', 'L') + 'Z', fill: 'var(--sk-hl)', 'fill-opacity': 0.8, stroke: 'none' }, g);
        el('path', { d: V.poly(mid), stroke: 'var(--sk-ink)', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        var lb = el('text', { x: x0 + 30, y: y0 + hh - 28, 'font-size': 22 }, g); lb.textContent = '−15 to −30% by hop 5';
      } else {
        var pts = [0, 1, 2, 3, 4].map(function (i) { return [X(i), top + (i % 2 ? 2 : -1) * 1.2]; });
        el('path', { d: V.poly(pts), stroke: 'var(--sk-ink)', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        var lb2 = el('text', { x: X(4) - 70, y: top + 34, 'font-size': 22, 'text-anchor': 'end' }, g); lb2.textContent = novel ? 'barely moves' : 'near the ceiling';
      }
      var ticks = [0, 4].map(function (i) { return el('path', { d: 'M' + X(i) + ' ' + (y0 + hh) + 'v6', stroke: 'var(--sk-ink)', 'stroke-width': 2, fill: 'none' }, g); });
    }
    function draw() {
      var novel = mode === 'novel';
      bo.setAttribute('aria-pressed', !novel); bn.setAttribute('aria-pressed', novel);
      chart(svgs[0], 'more premises', 'premises', novel);
      chart(svgs[1], 'more reasoning hops', 'hops', novel);
      ro.innerHTML = novel
        ? '<div class="pair"><span>On <b>novel</b> problems, reading more premises barely hurts &mdash; but chaining more hops does: deductive consistency falls by roughly <b>15&ndash;30%</b> going from 1 to 5 hops.</span></div>'
        : '<div class="pair"><span>On the <b>original</b> benchmark the same models look near-perfect at every length &mdash; memorisation masks the decay.</span></div>';
    }
    bo.onclick = function () { mode = 'orig'; draw(); }; bn.onclick = function () { mode = 'novel'; draw(); };
    draw();
    h('p', 'fig-cap', 'Schematic: shapes follow the paper&rsquo;s findings, but the axes carry no numbers and the curves are not measured data. The shaded band is the reported 15&ndash;30% fall.', root);
  })();
})();
