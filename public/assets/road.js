/* The Golden Road: draws the member progress road as a winding golden brick road with Breezy floating over the
   spot you've reached. It reads BBProgress (assets/progress.js) and adds itself to every progress box that file
   draws, so progress.js stays the one place that counts wins. Plain code, no AI.
   Motion rules from bb.css: only transform and opacity move, 700 ms, --ease. With reduced motion everything is
   placed where it belongs and nothing moves. The drawing is decoration (aria-hidden); the progress bar in the
   box is what screen readers use. Breezy's line under the road is plain text. */
(function () {
  'use strict';
  var doc = document, NS = 'http://www.w3.org/2000/svg', W = 1000, H = 260, SHOWN = 'bb-road-shown';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // road styles live in their own file so bb.css stays as it is
  (function () {
    if (doc.querySelector('link[data-road]')) return;
    var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/road.css?v=2'; l.setAttribute('data-road', '');
    doc.head.appendChild(l);
  })();

  /* ---------- the road's shape: one gentle S through the scene, measured by length ---------- */
  function at(t) { return { x: 70 + 860 * t, y: 182 - 38 * Math.sin(Math.PI * 2 * t * 1.15 + 0.35) - 18 * t }; }
  var N = 240, pts = [], len = [0];
  for (var i = 0; i <= N; i++) { pts.push(at(i / N)); if (i) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); }
  var total = len[N];
  function along(p) { // p = 0..100 of the road's length -> point
    var want = Math.max(0, Math.min(100, p)) / 100 * total, k = 1;
    while (k < N && len[k] < want) k++;
    var a = pts[k - 1], b = pts[k], f = (want - len[k - 1]) / ((len[k] - len[k - 1]) || 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }
  var D = 'M' + pts.map(function (q) { return q.x.toFixed(1) + ' ' + q.y.toFixed(1); }).join('L');

  /* ---------- where you are on the road, in the story's places (Series Bible, Golden Road) ---------- */
  var PLACES = [
    [0, 'The Everyday Village'], [10, 'The Crossroads of Possibility'], [20, 'The Basics Golden Road'],
    [50, 'The Jungle of Friction'], [80, 'The Unfinished Crossing'], [100, 'The Socialverse']
  ];
  function place(p) { var n = PLACES[0][1]; PLACES.forEach(function (x) { if (p >= x[0]) n = x[1]; }); return n; }

  // Breezy helps; you take the step. One line for each next win.
  var LINES = {
    signup: 'Your first brick is signing up. Tap in and I\'ll light the road.',
    blueprint: 'Open your Blueprint. Step one is waiting right there.',
    step1: 'Write your one-person sentence. You pick the person. I\'ll hold the light.',
    step2: 'Pick your lane. Look at all three, then choose the one that fits your week.',
    step3: 'Write what you\'ll never do. Saying no keeps the road clear.',
    step4: 'Plan five pieces, one job each. Small and clear beats big and blurry.',
    step5: 'Set your normal week and your floor. Real life fits on this road.',
    step6: 'Pick what you\'ll film on. The phone you already have counts.',
    step7: 'Publish your first piece. It doesn\'t have to be perfect. It has to be out.',
    site: 'Get your page online. Your plan turns into a place people can visit.',
    shop: 'Open your small shop. The lights of the Socialverse are right there.'
  };
  var END = 'You made it to the Socialverse, Digital Builder. Now wave in the next traveler.';

  /* ---------- drawing ---------- */
  function el(tag, attrs, kids) {
    var n = doc.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function svg(cls) { return el('svg', { 'class': cls, viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true', focusable: 'false' }); }
  function star(x, y, r, cls) {
    var s = r * 0.28;
    return el('path', { 'class': cls, d: 'M' + x + ' ' + (y - r) + 'Q' + (x + s) + ' ' + (y - s) + ' ' + (x + r) + ' ' + y + 'Q' + (x + s) + ' ' + (y + s) + ' ' + x + ' ' + (y + r) +
      'Q' + (x - s) + ' ' + (y + s) + ' ' + (x - r) + ' ' + y + 'Q' + (x - s) + ' ' + (y - s) + ' ' + x + ' ' + (y - r) + 'Z' });
  }
  function stones(gold) {
    var g = el('g', { 'class': gold ? 'gr-stones gold' : 'gr-stones' });
    for (var p = 10; p <= 100; p += 10) {
      var q = along(p);
      g.appendChild(el('circle', { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: p === 100 ? 15 : 11, 'class': 'gr-stone' }));
    }
    return g;
  }
  function road(gold) {
    var g = el('g', { 'class': gold ? 'gr-road gold' : 'gr-road' });
    g.appendChild(el('path', { d: D, 'class': 'gr-edge' }));
    g.appendChild(el('path', { d: D, 'class': 'gr-bed' }));
    g.appendChild(el('path', { d: D, 'class': 'gr-joints' }));
    g.appendChild(el('path', { d: D, 'class': 'gr-seam' }));
    if (gold) g.appendChild(el('path', { d: D, 'class': 'gr-shine' }));
    return g;
  }
  function scenery() {
    var g = el('g', { 'class': 'gr-scene' });
    // back: soft hills; middle: a far city for the Socialverse; front stays clear for the road
    g.appendChild(el('path', { 'class': 'gr-hill far', d: 'M0 150Q140 92 290 132T600 118T880 100T1000 112V260H0Z' }));
    g.appendChild(el('path', { 'class': 'gr-hill near', d: 'M0 196Q170 150 360 184T720 170T1000 150V260H0Z' }));
    var city = el('g', { 'class': 'gr-city' });
    [[884, 46, 14, 58], [902, 30, 16, 74], [922, 52, 12, 52], [938, 38, 18, 66], [960, 58, 12, 46]].forEach(function (b) {
      city.appendChild(el('rect', { x: b[0], y: b[1], width: b[2], height: b[3], rx: 2 }));
    });
    g.appendChild(city);
    var lights = el('g', { 'class': 'gr-lights' });
    [[889, 60], [889, 76], [907, 44], [913, 60], [907, 84], [926, 66], [943, 52], [949, 70], [964, 72]].forEach(function (w) {
      lights.appendChild(el('rect', { x: w[0], y: w[1], width: 4, height: 5, rx: 1 }));
    });
    g.appendChild(lights);
    return g;
  }
  var CLOUD = '<path class="bz-puff" d="M30 76c-14 0-24-9-24-21 0-11 8-19 19-21 2-15 15-26 31-26 13 0 24 7 29 18 2-1 5-1 7-1 13 0 23 10 23 23 0 16-12 28-28 28z"/>' +
    '<g class="bz-eyes"><ellipse cx="47" cy="47" rx="4.2" ry="5.6"/><ellipse cx="73" cy="47" rx="4.2" ry="5.6"/></g>' +
    '<path class="bz-smile" d="M51 58c5 5 13 5 18 0"/><circle class="bz-cheek" cx="38" cy="57" r="4.5"/><circle class="bz-cheek" cx="82" cy="57" r="4.5"/>';

  function build() {
    var wrap = doc.createElement('div'); wrap.className = 'gr';
    var stage = doc.createElement('div'); stage.className = 'gr-stage'; stage.setAttribute('aria-hidden', 'true');

    var base = svg('gr-base'); base.appendChild(scenery()); base.appendChild(road(false)); base.appendChild(stones(false));
    var fill = doc.createElement('div'); fill.className = 'gr-fill';
    var inner = doc.createElement('div'); inner.className = 'gr-fill-in';
    var gold = svg('gr-gold'); gold.appendChild(road(true)); gold.appendChild(stones(true));
    inner.appendChild(gold); fill.appendChild(inner);

    var top = svg('gr-top');
    var sparks = el('g', { 'class': 'gr-sparks' }); top.appendChild(sparks);
    var pops = el('g', { 'class': 'gr-pops' }); top.appendChild(pops);
    var walker = el('g', { 'class': 'gr-walker' });
    walker.appendChild(el('circle', { 'class': 'gr-ring', r: 15 }));
    walker.appendChild(el('circle', { 'class': 'gr-dot', r: 7 }));
    var guide = el('g', { 'class': 'gr-breezy' });
    guide.appendChild(el('path', { 'class': 'gr-trail', d: 'M0 0C-6 -22 14 -34 4 -56' }));
    var cloud = el('g', { 'class': 'gr-cloud', transform: 'translate(-34 -112) scale(.58)' });
    cloud.innerHTML = CLOUD;
    guide.appendChild(cloud);
    walker.appendChild(guide);
    top.appendChild(walker);

    stage.appendChild(base); stage.appendChild(fill); stage.appendChild(top);
    var say = doc.createElement('p'); say.className = 'gr-say';
    wrap.appendChild(stage); wrap.appendChild(say);
    return { wrap: wrap, fill: fill, inner: inner, walker: walker, sparks: sparks, pops: pops, say: say, lights: base.querySelector('.gr-lights') };
  }

  /* ---------- moving it ---------- */
  function setTo(r, p, late) {
    var q = along(p), fx = p >= 100 ? 1 : Math.max(0, Math.min(1, (q.x + 4) / W));
    // the gold layer is revealed left to right: the outer box slides left, the inner slides back, so nothing stretches
    r.fill.style.transform = 'translateX(' + ((fx - 1) * 100).toFixed(2) + '%)';
    r.inner.style.transform = 'translateX(' + ((1 - fx) * 100).toFixed(2) + '%)';
    r.walker.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px)';
    r.lights.classList.toggle('on', p >= 100);
    // a few sparkles on the gold you've already walked (after the walk, when it's animating)
    r.sparks.textContent = '';
    clearTimeout(r.sparkT);
    if (late) { r.sparkT = setTimeout(function () { sparkle(r, p); }, 700); return; }
    sparkle(r, p);
  }
  function sparkle(r, p) {
    [3, 9, 16, 24, 33, 45, 58, 72, 86].forEach(function (back, i) {
      if (p - back < 1) return;
      var s = along(p - back), off = i % 2 ? -22 : 20;
      var st = star(+(s.x + (i % 3 - 1) * 6).toFixed(1), +(s.y + off).toFixed(1), i % 3 ? 5 : 7, 'gr-spark');
      st.style.animationDelay = (i * 0.37).toFixed(2) + 's';
      r.sparks.appendChild(st);
    });
  }
  function pop(r, p) {
    var q = along(p), g = el('g', { 'class': 'gr-pop', transform: 'translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')' });
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2, s = star(+(Math.cos(a) * 26).toFixed(1), +(Math.sin(a) * 26).toFixed(1), 6, 'gr-spark');
      s.style.animationDelay = (i * 0.07).toFixed(2) + 's';
      g.appendChild(s);
    }
    r.pops.appendChild(g);
    setTimeout(function () { g.remove(); }, 1400);
  }
  function words(r, p, demo) {
    // the next win is the first one the box progress.js drew hasn't ticked yet
    var B = window.BBProgress, next = null;
    var box = r.wrap.closest('[data-progress]'), items = box ? box.querySelectorAll('.pg-wins li') : [];
    [].forEach.call(items, function (li, i) { if (!next && B && !li.classList.contains('done')) next = B.wins[i]; });
    if (demo && B) { var sum = 0; next = null; B.wins.forEach(function (w) { sum += w.pct; if (!next && sum > p) next = w; }); }
    var line = p >= 100 || !next ? END : (LINES[next.id] || 'Next brick: ' + next.name + '.');
    var lock = next && next.members && p < 100 ? ' That stretch opens with Members.' : '';
    r.say.innerHTML = '<span class="gr-where">' + place(p) + '</span> <b>Breezy:</b> ' + line + lock;
  }

  function mount(box) {
    var pg = box.querySelector('.pg-box'); if (!pg || pg.querySelector('.gr')) return;
    var B = window.BBProgress; if (!B) return;
    var r = build(), now = B.percent(), from = 0;
    // preview hosts only: ?road=45 shows the road at 45% (nothing is saved), so the look can be checked at any stage
    var demo = /(\.pages\.dev|^localhost|^127\.0\.0\.1)$/.test(location.hostname) && /[?&]road=(\d{1,3})/.exec(location.search);
    if (demo) { now = Math.min(100, +demo[1]); from = 0; }
    if (!demo) try { from = +sessionStorage.getItem(SHOWN) || 0; } catch (e) { /* private mode */ }
    if (from > now) from = now;
    var anchor = pg.querySelector('.pg-bar');
    pg.insertBefore(r.wrap, anchor || pg.firstChild.nextSibling);
    words(r, now, !!demo);
    if (reduce || from === now) { r.wrap.classList.add('still'); setTo(r, now); if (!demo) remember(now); return; }
    // start where you were last shown, then walk to now once the road is on screen
    r.wrap.classList.add('still'); setTo(r, from);
    var go = function () {
      r.wrap.offsetWidth; r.wrap.classList.remove('still');
      requestAnimationFrame(function () {
        setTo(r, now, true);
        for (var p = Math.floor(from / 10) * 10 + 10; p <= now; p += 10) (function (p) { setTimeout(function () { pop(r, p); }, 700); })(p);
        if (!demo) remember(now);
      });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); go(); } }, { threshold: 0.4 });
      io.observe(r.wrap);
    } else go();
  }
  function remember(p) { try { sessionStorage.setItem(SHOWN, String(p)); } catch (e) { /* private mode */ } }

  function init() {
    [].forEach.call(doc.querySelectorAll('[data-progress]'), function (box) {
      mount(box);
      // progress.js redraws the box when a win lands; put the road back each time
      if ('MutationObserver' in window) new MutationObserver(function () { mount(box); }).observe(box, { childList: true });
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
  window.BBRoad = { along: along, place: place };
})();
