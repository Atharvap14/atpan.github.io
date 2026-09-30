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
  /* ---------- top bar: hides on scroll down, returns on scroll up ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var lastY = window.pageYOffset, ticking = false;
    var update = function () {
      ticking = false;
      var y = window.pageYOffset, dy = y - lastY;
      if (y < 80 || nav.contains(document.activeElement)) nav.classList.remove('nav-hidden');
      else if (dy > 6) nav.classList.add('nav-hidden');
      else if (dy < -6) nav.classList.remove('nav-hidden');
      if (Math.abs(dy) > 6 || y < 80) lastY = y;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    nav.addEventListener('focusin', function () { nav.classList.remove('nav-hidden'); });
  }
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

})();
