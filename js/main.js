(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function whenVisible(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting); });
    }, { threshold: threshold || 0.3, rootMargin: '0px 0px -5% 0px' }).observe(el);
  }

  var ICON = {
    pause: '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" rx="1.2"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.2"/></svg>',
    play: '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  };

  function hash(str) { var h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h) + 1; }

  /* ---------- one-shot doodles (underline, frame, headings) ---------- */
  function doodle(svg, name, opts) {
    var scene = window.SCENES[name];
    if (!scene) return;
    var p = new window.SketchPlayer(svg, scene, Object.assign({ once: true, seed: hash(name) }, opts));
    p.reduced = reduced;
    whenVisible(svg, function (v) { if (v && !p.started) { p.started = true; p.setVisible(true); if (reduced) { p.seekMs(1e6); } else p.play(); } }, 0.2);
  }

  /* ---------- paper sketches ---------- */
  function mountPaper(card) {
    var name = card.getAttribute('data-scene');
    var scene = window.SCENES[name];
    var box = card.querySelector('.sketch');
    var svg = box.querySelector('svg');
    if (!scene || !svg) return;

    var player = new window.SketchPlayer(svg, scene, { seed: hash(name) });
    var userPaused = false, dragging = false, started = false;

    var controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML =
      '<button class="ctl toggle" type="button" aria-label="Pause animation">' + ICON.pause + ICON.play + '</button>' +
      '<input class="scrub" type="range" min="0" max="1000" step="1" value="0" aria-label="Scrub animation">' +
      '<button class="ctl replay" type="button" aria-label="Replay animation">' + ICON.replay + '</button>';
    box.appendChild(controls);
    var btn = controls.querySelector('.toggle'), rep = controls.querySelector('.replay'), scrub = controls.querySelector('.scrub');

    function ui(p) {
      card.setAttribute('data-state', p.playing ? 'playing' : 'paused');
      btn.setAttribute('aria-label', p.playing ? 'Pause animation' : 'Play animation');
      if (!dragging) {
        var v = p.progress();
        scrub.value = Math.round(v * 1000);
        scrub.style.setProperty('--p', (v * 100).toFixed(1) + '%');
      }
    }
    player.onUpdate = ui;

    btn.addEventListener('click', function () { userPaused = player.playing; player.toggle(); });
    svg.addEventListener('click', function () { userPaused = player.playing; player.toggle(); });
    rep.addEventListener('click', function () { userPaused = false; player.replay(); });
    scrub.addEventListener('input', function () {
      dragging = true; userPaused = true;
      player.pause();
      player.seek(scrub.value / 1000);
      scrub.style.setProperty('--p', (scrub.value / 10) + '%');
    });
    scrub.addEventListener('change', function () { dragging = false; });
    scrub.addEventListener('pointerup', function () { dragging = false; });

    whenVisible(card, function (visible) {
      if (visible) {
        player.setVisible(true);
        if (!started) {
          started = true;
          if (reduced) { userPaused = true; ui(player); } else player.play();
        } else if (!userPaused && !player.playing) player.play();
      } else {
        player.setVisible(false); // stop rendering off-screen (playing state is kept)
      }
    }, 0.35);

    // build now so the controls are in sync; reduced-motion users get the finished sketch
    player.build();
    ui(player);
    (window.sketchPlayers = window.sketchPlayers || {})[name] = player;
  }

  function thumbs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-thumb]'), function (svg) {
      var name = svg.getAttribute('data-thumb'), scene = window.SCENES[name];
      if (!scene) return;
      var p = new window.SketchPlayer(svg, scene, { seed: hash(name) });
      p.reduced = true; // static, finished frame
      p.build();
    });
  }

  function boot() {
    thumbs();
    var papers = document.querySelectorAll('.paper[data-scene]');
    Array.prototype.forEach.call(papers, mountPaper);

    var u = document.getElementById('name-underline');
    if (u) doodle(u, 'underline', { w: 420, h: 34 });
    var pd = document.getElementById('portrait-doodle');
    if (pd) doodle(pd, 'portrait', { w: 500, h: 500 });
    Array.prototype.forEach.call(document.querySelectorAll('[data-doodle]'), function (s) {
      doodle(s, s.getAttribute('data-doodle'), { w: 240, h: 14 });
    });
  }

  // wait (briefly) for the handwriting font so text is measured correctly
  var ready = Promise.resolve();
  if (document.fonts && document.fonts.load) {
    ready = Promise.race([
      Promise.all([document.fonts.load('600 40px Caveat'), document.fonts.load('400 16px Roboto')]).then(function () { return document.fonts.ready; }),
      new Promise(function (res) { setTimeout(res, 2500); }),
    ]);
  }
  ready.then(boot, boot);
})();
