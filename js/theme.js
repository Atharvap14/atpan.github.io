(function () {
  'use strict';
  var root = document.documentElement;

  /* ---------- theme ---------- */
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#121211' : '#f3eee2');
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    });
    if (root.getAttribute('data-theme') === 'dark') {
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', '#121211');
    }
  }
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

})();
