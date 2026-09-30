/*
 * Interactive figures for the DeduCE explainer.
 *  1. Walk a proof: premises, hops and the window the model is checked on
 *  2. Where accuracy goes: a schematic of the paper's finding (not real data)
 */
(function () {
  'use strict';
  var V = window.Viz, el = V.el, h = V.h;

  // The example from Figure 1 of the paper: "James writes a 3-page letter to 2 different friends twice a week.
  // How many pages does he write a year?"  Reference answer: 3 * 2 * 2 = 12 pages a week, 52 * 12 = 624 pages.
  var EXTRA = [
    { t: (v) => 'Each page costs $' + v.cost.toFixed(2) + ' to print.', step: (v, x) => ({ t: 'Cost a year = ' + fmt(x) + ' pages × $' + v.cost.toFixed(2) + ' = $' + fmt(x * v.cost), val: x * v.cost }), unit: 'cost' },
    { t: (v) => 'He gets a ' + v.disc + '% discount on printing.', step: (v, x) => ({ t: 'After discount = $' + fmt(x) + ' × ' + (100 - v.disc) / 100 + ' = $' + fmt(x * (100 - v.disc) / 100), val: x * (100 - v.disc) / 100 }) },
    { t: (v) => 'Postage is $' + v.post.toFixed(2) + ' per letter.', step: (v, x) => ({ t: 'Total with postage = $' + fmt(x) + ' + ' + fmt(v.friends * v.times * 52) + ' letters × $' + v.post.toFixed(2) + ' = $' + fmt(x + v.friends * v.times * 52 * v.post), val: x + v.friends * v.times * 52 * v.post }) },
  ];
  function fmt(n) { return (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

  (function walk() {
    var root = document.getElementById('fig-walk');
    h('div', 'fig-title', 'Figure 1 · From a benchmark problem to a novel one', root);
    h('div', 'fig-sub', 'The paper&rsquo;s own example. Templatise the problem, mutate its numbers so it can&rsquo;t be looked up, and add reasoning hops; the reference proof is recomputed each time. Then look at one window of hops at a time.', root);
    var controls = h('div', 'controls-row', null, root);
    var box = h('div', 'wk', null, root);
    var qEl = h('div', 'q', null, box);
    var colP = h('div', null, null, box), colS = h('div', null, null, box);
    h('h4', null, 'premises the model reads', colP);
    var olP = h('ol', null, null, colP);
    h('h4', null, 'hops in the reference proof', colS);
    var olS = h('ol', null, null, colS);
    var out = h('div', 'readout', null, root);

    var st = { pages: 3, friends: 2, times: 2, cost: 0.05, disc: 10, post: 0.5 };
    var sPages = V.slider(controls, 'Pages per letter', 1, 12, 1, 3, function (v) { return v; }, function (v) { st.pages = v; upd(); });
    var sFr = V.slider(controls, 'Friends', 1, 20, 1, 2, function (v) { return v; }, function (v) { st.friends = v; upd(); });
    var sTi = V.slider(controls, 'Letters a week', 1, 7, 1, 2, function (v) { return v; }, function (v) { st.times = v; upd(); });
    var sEx = V.slider(controls, 'Extra hops', 0, 3, 1, 0, function (v) { return '+' + v; }, function (v) { upd(); });
    var sWin = V.slider(controls, 'Window: hops', 1, 5, 1, 2, function (v) { return v; }, function (v) { upd(); });

    function upd() {
      var nEx = sEx.get(), k = sWin.get(), n = 2 + nEx;
      k = Math.min(k, n); sWin.input.max = n;
      var p = st.pages, f = st.friends, t = st.times, orig = (p === 3 && f === 2 && t === 2);
      var prem = [
        'James writes a ' + p + '-page letter.', 'He writes to ' + f + ' different friends.', 'He writes ' + t + ' times a week.', 'A year has 52 weeks.'
      ].map(function (x) { return { t: x }; });
      for (var i = 0; i < nEx; i++) prem.push({ t: EXTRA[i].t(st) });
      var wk = p * f * t, yr = wk * 52, steps = [
        { t: 'Pages a week = ' + p + ' × ' + f + ' × ' + t + ' = ' + wk, u: 'from the first three premises' },
        { t: 'Pages a year = 52 × ' + wk + ' = ' + fmt(yr), u: 'from the previous hop and the last premise' },
      ];
      var x = yr;
      for (i = 0; i < nEx; i++) { var r = EXTRA[i].step(Object.assign({}, st), x); steps.push({ t: r.t, u: 'from the previous hop and premise ' + (5 + i) }); x = r.val; }
      qEl.innerHTML = '<b>Question.</b> James writes a ' + p + '-page letter to ' + f + ' different friends ' + t + ' times a week. ' + (nEx ? 'What does it cost him in a year?' : 'How many pages does he write a year?');
      olP.textContent = ''; prem.forEach(function (q, j) { h('li', '', '<span class="id">P' + (j + 1) + '</span>' + q.t, olP); });
      olS.textContent = '';
      // window starts at the first hop the model must produce; earlier hops are given
      var start = Math.max(1, Math.min(n - k + 1, sStart));
      steps.forEach(function (s, j) { var idx = j + 1, cls = idx < start ? 'given' : idx < start + k ? 'win' : 'later'; h('li', cls, '<span class="id">S' + idx + '</span>' + s.t + '<span class="uses">' + s.u + '</span>', olS); });
      out.innerHTML = '<div class="pair"><span>' + (orig ? 'This is the <b>original</b> benchmark problem: its answer, <b>624</b>, can be memorised.' : 'A <b>novel</b> problem with the same structure. The memorised answer <b>624</b> is now wrong; the right answer is <b>' + fmt(yr) + '</b> pages a year.') + '</span></div>' +
        '<div class="pair"><span>premises in context: <b>' + prem.length + '</b></span><span>hops in the proof: <b>' + n + '</b></span><span>window: hops <b>' + start + (k > 1 ? '&ndash;' + (start + k - 1) : '') + '</b> (earlier hops are given, the model produces the window, and its trace is checked against the reference)</span></div>';
    }
    var sStart = 1;
    var sSt = V.slider(controls, 'Window starts at hop', 1, 5, 1, 1, function (v) { return v; }, function (v) { sStart = v; upd(); });
    upd();
    h('p', 'fig-cap', 'Try the original numbers (3 pages, 2 friends, 2 a week) and you get the paper&rsquo;s example and its memorable answer, 624. Change any number and the same problem becomes novel; add hops and the chain the model must follow gets longer. DeduCE measures both effects separately.', root);
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
        ? '<div class="pair"><span>On <b>novel</b> problems, reading more premises barely hurts, but chaining more hops does: deductive consistency falls by roughly <b>15&ndash;30%</b> going from 1 to 5 hops.</span></div>'
        : '<div class="pair"><span>On the <b>original</b> benchmark the same models look near-perfect at every length: memorisation masks the decay.</span></div>';
    }
    bo.onclick = function () { mode = 'orig'; draw(); }; bn.onclick = function () { mode = 'novel'; draw(); };
    draw();
    h('p', 'fig-cap', 'Schematic: shapes follow the paper&rsquo;s findings, but the axes carry no numbers and the curves are not measured data. The shaded band is the reported 15&ndash;30% fall.', root);
  })();
})();
