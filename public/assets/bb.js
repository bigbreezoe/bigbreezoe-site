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
    // A fast flick can carry a block past the screen between two observer checks. Catch those on scroll.
    var tick = 0;
    function sweep() {
      tick = 0;
      var left = all('[data-rv]:not(.in)');
      if (!left.length) { window.removeEventListener('scroll', onScroll); return; }
      left.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) { el.classList.add('in'); io.unobserve(el); } });
    }
    function onScroll() { if (!tick) tick = requestAnimationFrame(sweep); }
    window.addEventListener('scroll', onScroll, { passive: true });
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
        f.allow = 'accelerometer; autoplay; clipboard-write; compute-pressure; encrypted-media; gyroscope; picture-in-picture; web-share';
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
  function posters(vids) {
    // Posters for clips below the fold load only when the clip comes near the screen.
    var set = function (v) { var p = v.getAttribute('data-poster'); if (p && !v.poster) v.poster = p; };
    if (!('IntersectionObserver' in window)) { vids.forEach(set); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { set(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '600px 0px' });
    vids.forEach(function (v) { if (v.hasAttribute('data-poster')) io.observe(v); });
  }
  function clips() {
    var vids = all('video[data-clip]');
    posters(vids);
    if (reduce || saveData) return;
    vids.forEach(function (v) {
      v.muted = true; v.playsInline = true;
      // The hero loop starts after the page has loaded, so it never competes with the first paint.
      if (v.hasAttribute('data-hero')) {
        var go = function () { setTimeout(function () { makeSources(v); v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true }); play(v); }, 400); };
        if (doc.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
      }
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

  /* Start here on the home page: pick a path, see its one next step and the intake form. */
  function pick() {
    var btns = all('[data-pick-btn]');
    if (!btns.length) return;
    var hint = doc.querySelector('[data-pick-hint]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-pick-btn');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        all('[data-pick-panel]').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-pick-panel') === key); });
        if (hint) hint.hidden = true;
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

  /* Kit's form script (and its cookies) loads only once someone starts using the form.
     Without it the form still posts straight to Kit. */
  function kit() {
    all('form.formkit-form').forEach(function (f) {
      f.addEventListener('focusin', function () {
        if (doc.querySelector('script[src*="convertkit.com/ckjs"]')) return;
        var s = doc.createElement('script'); s.src = 'https://f.convertkit.com/ckjs/ck.5.js'; doc.head.appendChild(s);
      }, { once: true });
    });
  }

  /* Product pages: on phones a buy bar is there whenever the main Buy now is off screen, above or below. */
  function buyBar() {
    var bar = doc.querySelector('.p-bar'), buy = doc.querySelector('.p-buy');
    if (!bar || !buy || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (e) {
      var off = !e[0].isIntersecting;
      bar.classList.toggle('on', off); bar.setAttribute('aria-hidden', off ? 'false' : 'true');
      var a = bar.querySelector('a'); if (a) a.tabIndex = off ? 0 : -1;
    }).observe(buy);
  }

  /* Breezy, the on-page helper. Only the button lives here; assets/breezy.js loads on the first click.
     Off on the hidden post-payment pages and the translated pages. */
  var bzV = (doc.currentScript && doc.currentScript.getAttribute('data-bz')) || '';
  function breezy() {
    if (/^\/(checkout|booked|upload|download|store\/audio-kit\/download|es|fr|hi|zh)(\/|$)/.test(location.pathname)) return;
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'bz-btn';
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'breezy');
    b.innerHTML = CLOUD + '<span class="bz-say">Ask Breezy</span>';
    b.addEventListener('click', function () {
      if (window.BBBreezy) return window.BBBreezy.toggle();
      if (b.getAttribute('data-loading')) return;
      b.setAttribute('data-loading', '1');
      var s = doc.createElement('script'); s.src = '/assets/breezy.js?v=' + bzV;
      s.onload = function () { window.BBBreezy.init(b); window.BBBreezy.toggle(); };
      s.onerror = function () { b.removeAttribute('data-loading'); };
      doc.head.appendChild(s);
    });
    doc.body.appendChild(b);
    guide(b);
  }

  /* Breezy the cloud. It floats in the corner, and on a page that marks its next step with data-next it drifts over,
     points at that step and lights it up. Pages can also call window.BBCloud.point(el, words) and .home().
     Only transform and opacity move. With reduced motion it stays put and the step still lights up. */
  var CLOUD = '<svg class="bz-cloud" viewBox="0 0 120 84" aria-hidden="true" focusable="false">' +
    '<path class="bz-puff" d="M30 76c-14 0-24-9-24-21 0-11 8-19 19-21 2-15 15-26 31-26 13 0 24 7 29 18 2-1 5-1 7-1 13 0 23 10 23 23 0 16-12 28-28 28z"/>' +
    '<g class="bz-eyes"><ellipse cx="47" cy="47" rx="4.2" ry="5.6"/><ellipse cx="73" cy="47" rx="4.2" ry="5.6"/></g>' +
    '<path class="bz-smile" d="M51 58c5 5 13 5 18 0"/>' +
    '<circle class="bz-cheek" cx="38" cy="57" r="4.5"/><circle class="bz-cheek" cx="82" cy="57" r="4.5"/></svg>' +
    '<span class="bz-arrow" aria-hidden="true"></span>';
  function guide(b) {
    var lit = null, timer = 0, homeT = 0, tip = doc.createElement('span');
    tip.className = 'bz-tip'; tip.setAttribute('role', 'status'); b.appendChild(tip);
    function clear() { if (lit) lit.classList.remove('bz-lit'); lit = null; }
    function home() {
      clear(); b.classList.remove('bz-away'); b.style.transform = ''; tip.textContent = '';
      var arr = b.querySelector('.bz-arrow'); if (arr) arr.style.transform = '';
    }
    function place() {
      if (!lit) return;
      var r = lit.getBoundingClientRect(), w = innerWidth, h = innerHeight, bw = b.offsetWidth, bh = b.offsetHeight;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      // sit beside the step: to its right if there is room, else to its left, kept on screen
      var x = r.right + 16 + bw < w ? r.right + 16 : Math.max(8, r.left - bw - 16);
      var y = Math.min(Math.max(8, cy - bh / 2), h - bh - 8);
      // measure from the cloud's home corner, so a move still in flight doesn't throw the sum off
      var cs = getComputedStyle(b), dx = x - (w - (parseFloat(cs.right) || 16) - bw), dy = y - (h - (parseFloat(cs.bottom) || 16) - bh);
      b.style.transform = 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px)';
      var ang = Math.atan2(cy - (y + bh / 2), cx - (x + bw / 2)) * 180 / Math.PI;
      var arr = b.querySelector('.bz-arrow'); if (arr) arr.style.transform = 'rotate(' + Math.round(ang) + 'deg)';
    }
    function point(el, words) {
      if (!el || b.getAttribute('aria-expanded') === 'true') return;
      clear(); lit = el; el.classList.add('bz-lit');
      tip.textContent = words || el.getAttribute('data-next') || 'This is your next step.';
      b.classList.add('bz-away'); place();
      clearTimeout(homeT); homeT = setTimeout(home, 9000);
    }
    var raf = 0;
    function track() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; place(); }); }
    addEventListener('scroll', track, { passive: true }); addEventListener('resize', track);
    b.addEventListener('click', home, true);
    window.BBCloud = { point: point, home: home };
    // On a page with a marked next step, Breezy offers it after a quiet moment, once per visit to that step.
    function idle() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var next = all('[data-next]').filter(function (el) { var r = el.getBoundingClientRect(); return r.width && r.top < innerHeight && r.bottom > 0 && !el.hasAttribute('data-next-shown'); })[0];
        if (next) { next.setAttribute('data-next-shown', ''); point(next); }
      }, 6000);
    }
    ['scroll', 'pointerdown', 'keydown'].forEach(function (t) { addEventListener(t, idle, { passive: true }); });
    idle();
  }

  ready(function () { reveal(); youtube(); clips(); lanes(); pick(); menus(); kit(); buyBar(); breezy(); });
  window.BB = { reveal: reveal };
})();
