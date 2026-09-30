/*
 * Interactive figures for the DeduCE explainer (workshop version).
 *  A. Templatise, mutate, verify: from a benchmark problem to a novel one
 *  B. The (prefix, hop) grid: what DedCons(k, l) checks, and why hops are counted separately
 *  C. The paper's numbers: hops, prefixes, paraphrases, SynDeduct, and the mitigation tables
 */
(function () {
  'use strict';
  var V = window.Viz, el = V.el, h = V.h;
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  /* ------------------------------------------------------------ A: mutate */
  (function mutate() {
    var root = document.getElementById('fig-mutate');
    h('div', 'fig-title', 'Figure A · From a benchmark problem to a novel one', root);
    h('div', 'fig-sub', 'The paper&rsquo;s own example. A model rewrites the solution as a template plus code. Change the seed numbers and the code recomputes every intermediate value, so the question, the reference chain of thought and the answer all stay consistent.', root);
    var controls = h('div', 'controls-row', null, root);
    var st = { p: 3, f: 2, t: 2 };
    var sP = V.slider(controls, 'num_pages', 1, 99, 1, 3, null, function (v) { st.p = v; upd(); });
    var sF = V.slider(controls, 'num_friends', 1, 99, 1, 2, null, function (v) { st.f = v; upd(); });
    var sT = V.slider(controls, 'num_times', 1, 99, 1, 2, null, function (v) { st.t = v; upd(); });
    var btns = h('div', 'controls-row', null, root);
    var seed = 7;
    var rnd = V.rng(seed);
    V.button(btns, 'Factual values (3, 2, 2)', function () { set(3, 2, 2); });
    V.button(btns, 'Paper&rsquo;s mutation (8, 20, 2)', function () { set(8, 20, 2); });
    V.button(btns, 'Random seeds under 100', function () { set(1 + Math.floor(rnd() * 98), 1 + Math.floor(rnd() * 98), 1 + Math.floor(rnd() * 98)); });
    function set(a, b, c) {
      st.p = a; st.f = b; st.t = c;
      [[sP, a], [sF, b], [sT, c]].forEach(function (x) { x[0].input.value = x[1]; x[0].input.dispatchEvent(new Event('input')); });
    }
    var box = h('div', 'wk', null, root);
    var q = h('div', 'q', null, box);
    var colA = h('div', null, null, box), colB = h('div', null, null, box);
    h('h4', null, 'templated chain of thought, filled in', colA);
    var olA = h('ol', null, null, colA);
    h('h4', null, 'executable code (tCode)', colB);
    var pre = h('pre', 'code', null, colB);
    var out = h('div', 'readout', null, root);

    function upd() {
      var p = st.p, f = st.f, t = st.t, w = 52, wk = p * f * t, yr = w * wk, orig = p === 3 && f === 2 && t === 2;
      q.innerHTML = '<b>Question.</b> James writes a ' + p + '-page letter to ' + f + ' different friends ' + t + ' times a week. How many pages does he write a year?';
      olA.textContent = '';
      [['James writes ' + p + ' pages to ' + f + ' friends ' + t + ' times a week.', 'S1'],
       ['There are 52 weeks in a year.', 'S2'],
       ['So that is ' + p + ' &times; ' + f + ' &times; ' + t + ' = ' + fmt(wk) + ' pages a week.', 'S3'],
       ['In a year, that is 52 &times; ' + fmt(wk) + ' = ' + fmt(yr) + ' pages.', 'S4']].forEach(function (s) { h('li', null, '<span class="id">' + s[1] + '</span>' + s[0], olA); });
      pre.textContent = 'num_pages = ' + p + '\nnum_friends = ' + f + '\nnum_times = ' + t + '\nnum_weeks_in_a_year = 52\n' +
        'pages_per_week = num_pages * num_friends * num_times   # ' + wk + '\ntotal_pages = pages_per_week * num_weeks_in_a_year      # ' + yr;
      out.innerHTML = '<div class="pair"><span>' + (orig
        ? 'These are the <b>factual</b> values from the benchmark. Their answer, <b>' + fmt(yr) + '</b>, may sit in a training set.'
        : 'A <b>novel</b> problem with the same reasoning graph. The memorised answer <b>624</b> is wrong here; the verified answer is <b>' + fmt(yr) + '</b>.') + '</span></div>' +
        '<div class="pair"><span>The tCoT and tCode are accepted only if they produce identical intermediate values (' + fmt(wk) + ' and ' + fmt(yr) + ' here) for the factual inputs and for every mutated set.</span></div>';
    }
    upd();
    h('p', 'fig-cap', 'The paper samples seed premises as random integers under 100 and avoids floating-point values. Other perturbations, such as renaming variables or adding irrelevant facts, would plug into the same code.', root);
  })();

  /* ------------------------------------------------------------- B: grid */
  (function grid() {
    var root = document.getElementById('fig-window');
    h('div', 'fig-title', 'Figure B · The prefix and hop grid', root);
    h('div', 'fig-sub', 'Each row is a separate run: the model is shown the question plus the first k steps of the reference proof and must continue. Column l is the step it is checked on, step k + l. Click a cell to flip it between correct and wrong and watch the averages.', root);
    var STEPS = [
      'James writes 8 pages to 20 friends 2 times a week.',
      'There are 52 weeks in a year.',
      'So that is 8 &times; 20 &times; 2 = 320 pages a week.',
      'In a year, that is 52 &times; 320 = 16,640 pages.',
    ], N = STEPS.length;
    var sel = { k: 0, l: 3 };
    // the pattern drawn in the paper's Figure 1: DC(0,3) = 0 and DC(1,2) = 0
    var wrong = { '0,3': 1, '1,2': 1 };
    var box = h('div', 'wk', null, root);
    h('div', 'q', '<b>Question.</b> James writes a 3-page letter to 2 different friends twice a week. How many pages does he write a year? <span class="dim">(the mutated version uses 8, 20 and 2)</span>', box);
    var colS = h('div', null, null, box), colG = h('div', null, null, box);
    h('h4', null, 'reference proof for the selected cell', colS);
    var olS = h('ol', null, null, colS);
    h('h4', null, 'DedCons(k, l) for one problem: 1 = correct, 0 = wrong', colG);
    var tbl = h('table', 'dcgrid', null, colG);
    var out = h('div', 'readout', null, root);

    function upd() {
      var k = sel.k, l = sel.l, s = k + l;
      olS.textContent = '';
      STEPS.forEach(function (t, j) {
        var idx = j + 1, cls = idx <= k ? 'given' : idx === s ? 'win' : idx < s ? 'mid' : 'later';
        var use = idx <= k ? 'given in the prompt (prefix)' : idx === s ? 'checked: hop ' + l + ' after a prefix of ' + k : idx < s ? 'written by the model, not checked' : 'not needed for this cell';
        h('li', cls, '<span class="id">S' + idx + '</span>' + t + '<span class="uses">' + use + '</span>', olS);
      });
      tbl.textContent = '';
      var head = h('tr', null, '<th></th>', tbl);
      for (var l2 = 1; l2 <= N; l2++) h('th', null, 'l = ' + l2, head);
      h('th', 'avg', 'mean over l', head);
      var byHop = [];
      for (var k2 = 0; k2 < N; k2++) {
        var tr = h('tr', null, null, tbl); h('th', null, 'k = ' + k2, tr);
        var sum = 0, cnt = 0;
        for (var ll = 1; ll <= N; ll++) {
          var td = h('td', null, null, tr);
          if (k2 + ll > N) { td.className = 'na'; td.textContent = ''; continue; }
          var key = k2 + ',' + ll, val = wrong[key] ? 0 : 1;
          sum += val; cnt++; (byHop[ll] = byHop[ll] || []).push(val);
          var b = h('button', 'cell v' + val + (k2 === sel.k && ll === sel.l ? ' on' : '') + (k2 + ll === s ? ' diag' : ''), String(val), td);
          b.type = 'button';
          b.setAttribute('aria-label', 'DedCons(' + k2 + ',' + ll + ') = ' + val + ', checks step ' + (k2 + ll));
          (function (kk, l3, kkey) {
            b.onclick = function () { if (sel.k === kk && sel.l === l3) { if (wrong[kkey]) delete wrong[kkey]; else wrong[kkey] = 1; } sel = { k: kk, l: l3 }; upd(); };
          })(k2, ll, key);
        }
        h('td', 'avg', cnt ? (sum / cnt).toFixed(2) : '', tr);
      }
      var foot = h('tr', 'avgrow', '<th>mean over k</th>', tbl);
      for (var l4 = 1; l4 <= N; l4++) { var a = byHop[l4] || [], m = a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; h('td', null, a.length ? m.toFixed(2) : '', foot); }
      h('td', null, '', foot);
      var same = [];
      for (var kk2 = 0; kk2 < N; kk2++) if (s - kk2 >= 1 && s - kk2 <= N - kk2) same.push('DC(' + kk2 + ',' + (s - kk2) + ')');
      out.innerHTML = '<div class="pair"><span>Selected: <b>DC(' + k + ',' + l + ')</b> checks step <b>S' + s + '</b>. The same step is checked by ' + same.join(', ') + ': the model sees more premises each time but has fewer hops to make.</span></div>' +
        '<div class="pair"><span>Hop 1 has <b>' + N + '</b> cells, hop ' + N + ' has just <b>1</b>. The far end of the chain is only reached by short prefixes, which is why the paper reports hop and prefix averages separately.</span></div>';
    }
    upd();
    h('p', 'fig-cap', 'Click a cell once to select it, click again to flip it. The starting pattern is the one drawn in the paper&rsquo;s Figure 1, where the slip on step 3 (326 instead of 320) shows up as DC(0,3) = 0 and DC(1,2) = 0 but does not prevent the final answer.', root);
  })();

  /* ---------------------------------------------------------------- C: data */
  (function data() {
    var root = document.getElementById('fig-data');
    h('div', 'fig-title', 'Figure C · The paper&rsquo;s numbers', root);
    h('div', 'fig-sub', 'Every point is a value from the paper&rsquo;s tables. Pick a dataset, toggle models, and read base (deductive consistency at hop 1) and decay off the fitted line.', root);
    var SETS = {
      gsm: { name: 'GSM8K, by hops', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Table 6. Base is hop 1, decay is the negative slope of the least-squares line over hop / 5 (Equation 6).', kind: 'decay', L: 5, series: [
        ['Llama-3.3-70B', [0.89, 0.8274, 0.7909, 0.7669, 0.7079]], ['Llama-3-8B', [0.7629, 0.6572, 0.5777, 0.5254, 0.4988]], ['Phi-4', [0.8911, 0.8365, 0.8103, 0.7929, 0.7612]],
        ['Phi-3.5', [0.8563, 0.7874, 0.7602, 0.6865, 0.6616]], ['Qwen-2.5-Math-72B', [0.937, 0.9037, 0.8841, 0.8573, 0.8321]], ['Qwen-2.5-Math-7B', [0.8843, 0.854, 0.8456, 0.8283, 0.8409]]] },
      ax: { name: 'GSM8K, axiomatic paraphrase', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Table 8. Premises rewritten as axioms, e.g. ADD(60, 12) yields 72.', kind: 'decay', L: 5, series: [
        ['Llama-3.3-70B', [0.8875, 0.8083, 0.7653, 0.752, 0.7328]], ['Llama-3-8B', [0.7309, 0.6177, 0.5096, 0.4799, 0.4798]], ['Phi-4', [0.8703, 0.8245, 0.8055, 0.7525, 0.7263]],
        ['Phi-3.5', [0.8146, 0.694, 0.6106, 0.5795, 0.5715]], ['Qwen-2.5-Math-72B', [0.9196, 0.851, 0.8149, 0.8038, 0.8019]], ['Qwen-2.5-Math-7B', [0.8627, 0.8001, 0.7672, 0.7418, 0.7483]]] },
      van: { name: 'GSM8K, vanilla paraphrase', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Table 9. Conventional rewording of each premise.', kind: 'decay', L: 5, series: [
        ['Llama-3.3-70B', [0.863, 0.79, 0.7561, 0.7242, 0.7203]], ['Llama-3-8B', [0.7538, 0.612, 0.5503, 0.4997, 0.4961]], ['Phi-4', [0.8505, 0.8062, 0.7856, 0.7655, 0.7408]],
        ['Phi-3.5', [0.8397, 0.739, 0.7178, 0.6679, 0.6279]], ['Qwen-2.5-Math-72B', [0.9175, 0.8758, 0.8569, 0.8427, 0.8063]], ['Qwen-2.5-Math-7B', [0.8671, 0.8206, 0.7841, 0.7854, 0.8267]]] },
      rev: { name: 'GSM8K, reversed paraphrase', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Table 10. The effect is stated before its cause.', kind: 'decay', L: 5, series: [
        ['Llama-3.3-70B', [0.8481, 0.7828, 0.7508, 0.7148, 0.7211]], ['Llama-3-8B', [0.7163, 0.5509, 0.4612, 0.4609, 0.4617]], ['Phi-4', [0.8532, 0.8102, 0.7874, 0.7724, 0.7442]],
        ['Phi-3.5', [0.7958, 0.7308, 0.6917, 0.6351, 0.6355]], ['Qwen-2.5-Math-72B', [0.9051, 0.8636, 0.8279, 0.8105, 0.7979]], ['Qwen-2.5-Math-7B', [0.8463, 0.7914, 0.7298, 0.7543, 0.7952]]] },
      pre: { name: 'GSM8K, by prefix', x: 'prefix length (k)', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Table 12. Deductive consistency barely moves as more of the reference proof is given.', kind: 'flat', series: [
        ['Phi-3.5', [0.7664, 0.7772, 0.7767, 0.8153, 0.7707]], ['Qwen-2.5-Math-7B', [0.8549, 0.8366, 0.851, 0.8641, 0.8922]], ['Qwen-2.5-Math-72B', [0.8802, 0.8704, 0.8803, 0.9067, 0.8967]],
        ['Llama-3-8B', [0.5884, 0.5826, 0.5932, 0.5984, 0.6637]], ['Llama-3.3-70B', [0.7981, 0.7929, 0.7937, 0.7952, 0.7905]], ['Phi-4', [0.8254, 0.8277, 0.8309, 0.8199, 0.7996]]] },
      syn: { name: 'SynDeduct, by hops', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: 'Tables 22 and 23. Problems with up to 12 hops, built from a computation graph with only addition and subtraction.', kind: 'drop', series: [
        ['Qwen-2.5-Math-7B', [0.2083, 0.1205, 0.0867, 0.0898, 0.0792, 0.0607, 0.0403, 0.0383, 0.025, 0.025, 0.0167, 0]], ['Qwen-2.5-7B', [0.5458, 0.3705, 0.325, 0.263, 0.2562, 0.244, 0.1639, 0.1633, 0.1479, 0.0917, 0.0792, 0.05]],
        ['Qwen-2.5-Math-72B', [0.5674, 0.4894, 0.4433, 0.3852, 0.3635, 0.3381, 0.3222, 0.3367, 0.3229, 0.2861, 0.2667, 0.2583]], ['Qwen-2.5-72B', [0.6868, 0.5848, 0.4825, 0.4046, 0.3354, 0.2643, 0.2167, 0.175, 0.1562, 0.0889, 0.0667, 0.0417]],
        ['Llama-3-8B', [0.2993, 0.2023, 0.1825, 0.1602, 0.1469, 0.1357, 0.0903, 0.0883, 0.1104, 0.0861, 0.0417, 0.0083]], ['DeepSeek-R1-Llama-70B', [0.7389, 0.6879, 0.6742, 0.6509, 0.6542, 0.6488, 0.6431, 0.6083, 0.5958, 0.5556, 0.4667, 0.3333]],
        ['Llama-3.3-70B', [0.8465, 0.8129, 0.7675, 0.725, 0.7125, 0.6833, 0.6347, 0.6017, 0.5854, 0.575, 0.5417, 0.6083]], ['DeepSeek-R1-Qwen-7B', [0.5424, 0.3871, 0.3308, 0.287, 0.2802, 0.2262, 0.2097, 0.1633, 0.1604, 0.125, 0.0667, 0.0667]]] },
      mit: { name: 'Mitigations on GSM8K (RL and SFT)', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Tables 13 to 16. Compare Qwen-2.5 with its Math (RL) variant, and Qwen or Llama with the R1 distilled (SFT) variant.', kind: 'decay', L: 5, series: [
        ['Qwen-2.5-72B', [0.9149, 0.861, 0.8078, 0.7656, 0.7287]], ['Qwen-2.5-Math-72B (RL)', [0.9164, 0.8739, 0.8305, 0.7895, 0.7861]], ['Qwen-2.5-7B', [0.8881, 0.8453, 0.8101, 0.7738, 0.762]], ['Qwen-2.5-Math-7B (RL)', [0.8427, 0.8021, 0.7739, 0.7499, 0.7499]],
        ['Qwen-2.5-Math-7B (SFT set)', [0.8509, 0.8093, 0.8002, 0.7957, 0.7964]], ['R1-Distill-Qwen-7B', [0.8468, 0.7989, 0.7451, 0.7309, 0.6851]], ['Llama-3.3-70B', [0.8532, 0.7876, 0.7515, 0.7075, 0.6926]], ['R1-Distill-Llama-70B', [0.8366, 0.7726, 0.7093, 0.6741, 0.6369]]] },
      mon: { name: 'Calculator monitor, Llama-3-8B', x: 'hops', lo: 0, hi: 1, xs: [1, 2, 3, 4, 5], note: 'Table 5 and Table 19. A reviewer model calls a calculator and an editor model rewrites the calculation.', kind: 'decay', L: 5, series: [
        ['Without monitor', [0.7629, 0.6572, 0.5777, 0.5254, 0.4988]], ['With monitor', [0.9081, 0.8098, 0.7356, 0.6651, 0.61]]] },
    };
    var order = ['gsm', 'ax', 'van', 'rev', 'pre', 'syn', 'mit', 'mon'];
    var TONE = ['var(--sk-ink)', 'var(--sk-gray)', '#a0672d', '#c9a15a'];
    var DASH = [null, '7 5', null, '7 5', '2 5', '11 5 2 5', '2 5', '11 5 2 5'];
    var MARK = ['c', 'c', 's', 's', 't', 't', 'd', 'd'];
    var cur = 'gsm', on = {};
    var controls = h('div', 'controls-row', null, root);
    var sel = h('select', 'sel', null, controls);
    sel.setAttribute('aria-label', 'Dataset');
    order.forEach(function (k) { var o = h('option', null, SETS[k].name, sel); o.value = k; });
    var chips = h('div', 'chips', null, root);
    var svg = el('svg', { viewBox: '0 0 640 330', role: 'img', 'aria-label': 'Deductive consistency against hops or prefix length for the selected models' }, root);
    var out = h('div', 'readout', null, root);
    var note = h('p', 'fig-cap', '', root);

    function pick(k) {
      cur = k; on = {};
      SETS[k].series.forEach(function (s, i) { on[i] = SETS[k].series.length <= 4 || i < 4; });
      sel.value = k; draw();
    }
    sel.onchange = function () { pick(sel.value); };

    function fit(y, L) { // least squares of y on hop / L, negated
      var n = y.length, xs = y.map(function (_, i) { return (i + 1) / L; }), mx = 0, my = 0, i;
      for (i = 0; i < n; i++) { mx += xs[i]; my += y[i]; } mx /= n; my /= n;
      var c = 0, v = 0; for (i = 0; i < n; i++) { c += (xs[i] - mx) * (y[i] - my); v += (xs[i] - mx) * (xs[i] - mx); }
      return -c / v;
    }
    function mark(g, m, x, y, col) {
      var a = { fill: col, stroke: 'var(--sk-bg)', 'stroke-width': 1.5 };
      if (m === 'c') el('circle', Object.assign({ cx: x, cy: y, r: 4.6 }, a), g);
      else if (m === 's') el('rect', Object.assign({ x: x - 4.2, y: y - 4.2, width: 8.4, height: 8.4 }, a), g);
      else if (m === 't') el('path', Object.assign({ d: 'M' + x + ' ' + (y - 5.4) + 'L' + (x + 5) + ' ' + (y + 4) + 'L' + (x - 5) + ' ' + (y + 4) + 'Z' }, a), g);
      else el('path', Object.assign({ d: 'M' + x + ' ' + (y - 5.6) + 'L' + (x + 5) + ' ' + y + 'L' + x + ' ' + (y + 5.6) + 'L' + (x - 5) + ' ' + y + 'Z' }, a), g);
    }

    function draw() {
      var D = SETS[cur], S = D.series;
      chips.textContent = '';
      S.forEach(function (s, i) {
        var b = h('button', 'chip', '<i class="sw" style="border-top:3px ' + (DASH[i] ? 'dashed' : 'solid') + ' ' + TONE[i % 4] + '"></i>' + s[0], chips);
        b.type = 'button'; b.setAttribute('aria-pressed', !!on[i]);
        b.onclick = function () { on[i] = !on[i]; draw(); };
      });
      svg.textContent = '';
      var x0 = 52, y0 = 16, w = 570, hh = 258, g = el('g', null, svg);
      var all = [].concat.apply([], S.map(function (q) { return q[1]; }));
      var yr = [Math.max(0, Math.floor((Math.min.apply(null, all) - 0.03) * 10) / 10), Math.min(1, Math.ceil(Math.max.apply(null, all) * 10) / 10)];
      if (yr[1] - yr[0] < 0.2) yr[1] = yr[0] + 0.2;
      var step = yr[1] - yr[0] > 0.65 ? 0.2 : 0.1;
      var Y = function (v) { return y0 + hh - (v - yr[0]) / (yr[1] - yr[0]) * hh; };
      var n = D.xs.length, X = function (i) { return x0 + 14 + i / (n - 1) * (w - 28); };
      for (var v = yr[0]; v <= yr[1] + 0.0001; v += step) {
        el('path', { d: 'M' + x0 + ' ' + Y(v) + 'H' + (x0 + w), stroke: 'var(--sk-faint)', 'stroke-width': 1.2, fill: 'none', 'stroke-dasharray': v === yr[0] ? null : '3 6' }, g);
        var tl = el('text', { x: x0 - 8, y: Y(v) + 5, 'text-anchor': 'end', 'font-size': 15, class: 'tg' }, g); tl.textContent = v.toFixed(1);
      }
      D.xs.forEach(function (xv, i) {
        if (n > 8 && i % 2 === 1 && i !== n - 1) return;
        var t = el('text', { x: X(i), y: y0 + hh + 22, 'text-anchor': 'middle', 'font-size': 15, class: 'tg' }, g); t.textContent = xv;
      });
      var xl = el('text', { x: x0 + w, y: y0 + hh + 46, 'text-anchor': 'end', 'font-size': 17 }, g); xl.textContent = D.x;
      var yl = el('text', { x: x0 - 8, y: 11, 'text-anchor': 'start', 'font-size': 17 }, g); yl.textContent = 'deductive consistency';
      el('path', { d: 'M' + x0 + ' ' + y0 + 'V' + (y0 + hh) + 'H' + (x0 + w), stroke: 'var(--sk-ink)', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, g);
      var rows = [];
      S.forEach(function (s, i) {
        if (!on[i]) return;
        var col = TONE[i % 4], pts = s[1].map(function (y, j) { return [X(j), Y(y)]; });
        el('path', { d: V.poly(pts), stroke: col, 'stroke-width': 2.8, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': DASH[i] }, g);
        pts.forEach(function (p) { mark(g, MARK[i], p[0], p[1], col); });
        var ys = s[1], row = [s[0], ys[0]];
        if (D.kind === 'decay') { row.push(fit(ys, D.L)); }
        else if (D.kind === 'drop') { row.push(ys[0] - ys[ys.length - 1]); }
        else { row.push(Math.max.apply(null, ys) - Math.min.apply(null, ys)); }
        rows.push(row);
      });
      var lab = D.kind === 'decay' ? 'decay' : D.kind === 'drop' ? 'fall, hop 1 to 12' : 'spread across k';
      var html = '<table class="rank"><tr><th>model</th><th>' + (D.kind === 'flat' ? 'value at k = 1' : 'base (hop 1)') + '</th><th>' + lab + '</th></tr>';
      rows.forEach(function (r) { html += '<tr><td>' + r[0] + '</td><td>' + r[1].toFixed(3) + '</td><td>' + r[2].toFixed(3) + '</td></tr>'; });
      out.innerHTML = rows.length ? html + '</table>' : '<div class="pair"><span>Select at least one model.</span></div>';
      note.innerHTML = D.note + (D.kind === 'decay' ? ' The decay column is computed here from the plotted points; where the paper tabulates decay (Tables 3 to 5) the values match.' : D.kind === 'drop' ? ' Base and the overall fall are read directly from the table.' : ' The spread is the maximum minus the minimum over prefixes.');
    }
    pick('gsm');
  })();
})();
