/* Big Breezoe site script. One small file, no library.
   Reveal on entry, click-to-play YouTube, lazy motion clips, the hero loop, gear lanes, the menu, the Kit form loader. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  window.__bbReady = true;

  function ready(fn) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn); else fn(); }
  function all(sel, el) { return [].slice.call((el || doc).querySelectorAll(sel)); }

  /* Reveal once as each block enters. Children of [data-rv-group] get a stagger index. */
  function reveal() {
    all('[data-rv-group]').forEach(function (g) {
      all('[data-rv]', g).forEach(function (el, i) { el.style.setProperty('--i', String(i % 8)); });
    });
    var els = all('[data-rv]:not(.in)');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* YouTube: nothing loads from YouTube until someone clicks. */
  function youtube() {
    all('[data-yt]').forEach(function (box) {
      var btn = box.querySelector('.yt-play');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var id = box.getAttribute('data-yt');
        var f = doc.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
        f.title = btn.getAttribute('aria-label') || 'YouTube video';
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        f.allowFullscreen = true;
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        box.replaceChild(f, btn);
        f.focus();
      });
    });
  }

  /* Motion clips: sources attach only near the viewport. Reduced motion keeps the still poster. */
  function makeSources(v) {
    var base = v.getAttribute('data-clip');
    if (!base || v.getAttribute('data-loaded')) return;
    v.setAttribute('data-loaded', '1');
    [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (t) {
      var s = doc.createElement('source'); s.src = base + '.' + t[0]; s.type = t[1]; v.appendChild(s);
    });
    v.load();
  }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function clips() {
    var vids = all('video[data-clip]');
    if (reduce || saveData) return;
    vids.forEach(function (v) {
      v.muted = true; v.playsInline = true;
      if (v.hasAttribute('data-hero')) { makeSources(v); play(v); return; }
    });
    var lazy = vids.filter(function (v) { return !v.hasAttribute('data-hero'); });
    if (!('IntersectionObserver' in window)) { lazy.forEach(function (v) { makeSources(v); }); return; }
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { makeSources(e.target); near.unobserve(e.target); } });
    }, { rootMargin: '400px 0px' });
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.hasAttribute('data-once') && v.getAttribute('data-played')) return;
          v.setAttribute('data-played', '1'); play(v);
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.5 });
    lazy.forEach(function (v) { near.observe(v); seen.observe(v); });
  }

  /* Gear lanes on the home page. */
  function lanes() {
    var btns = all('[data-lane-btn]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var ln = b.getAttribute('data-lane-btn');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        all('#gear-list .lane').forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-lane') === ln); });
      });
    });
  }

  /* Menus built on <details>: close on outside click, Escape, or picking a link. */
  function menus() {
    var ds = all('details.bb-menu, details.lang');
    if (!ds.length) return;
    doc.addEventListener('click', function (e) {
      ds.forEach(function (d) { if (d.open && (!d.contains(e.target) || e.target.closest('a'))) d.open = false; });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      ds.forEach(function (d) { if (d.open) { d.open = false; var s = d.querySelector('summary'); if (s) s.focus(); } });
    });
  }

  /* Kit's form script loads only when the form is close or touched. */
  function kit() {
    var f = doc.querySelector('form.formkit-form');
    if (!f) return;
    var done = 0;
    function go() { if (done) return; done = 1; var s = doc.createElement('script'); s.src = 'https://f.convertkit.com/ckjs/ck.5.js'; doc.head.appendChild(s); }
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { o.disconnect(); go(); } }, { rootMargin: '600px' });
      o.observe(f);
    } else go();
    f.addEventListener('focusin', go, { once: true });
  }

  ready(function () { reveal(); youtube(); clips(); lanes(); menus(); kit(); });
  window.BB = { reveal: reveal };
})();
