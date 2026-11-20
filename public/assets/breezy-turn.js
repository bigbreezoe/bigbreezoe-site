/* Breezy's turnaround (Nov 18). Loaded after the page is up, so the shared script stays small.
   Adds more drawings of the same cloud to the Ask Breezy button (three-quarter, flying, pointing, and six turn angles; all face left,
   and .bzc-turn mirrors them to face right). He leans into a flight, points at the step with his cloud arm, flies back,
   and looks left and right now and then. Only transform and opacity move. Reduced motion: no flight pose, no glance. */
(function () {
  'use strict';
  var doc = document, b = doc.querySelector('.bz-btn'), c = b && b.querySelector('.bzc'), body = c && c.querySelector('.bzc-body');
  if (!body || c.querySelector('.bzc-turn')) return;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  var turn = doc.createElement('span'); turn.className = 'bzc-turn';
  while (body.firstChild) turn.appendChild(body.firstChild);
  body.appendChild(turn);
  var front = turn.querySelector('img'); front.className = 'bzc-vf';
  [['vp', 'point'], ['vy', 'fly'], ['vt', 'turn']].forEach(function (v) {
    var i = doc.createElement('img'); i.className = 'bzc-' + v[0]; i.src = '/media/breezy-cloud-' + v[1] + '.webp';
    i.width = 176; i.height = 109; i.alt = ''; i.decoding = 'async';
    turn.insertBefore(i, front.nextSibling);
  });

  // Which drawing shows and which way it faces. view: front, tq, fly or point. dir: "l" or "r".
  function view(v, dir) {
    c.setAttribute('data-view', v || 'front');
    if (dir) c.setAttribute('data-dir', dir); else c.removeAttribute('data-dir');
  }
  function away() { return b.classList.contains('bz-away'); }

  // Watch the button: bz-away goes on when he flies to a step and comes off when he flies home.
  var t = 0, wentLeft = true, wasAway = away();
  function onMove() {
    var now = away();
    if (now === wasAway) return;
    wasAway = now; clearTimeout(t);
    if (now) {
      var el = doc.querySelector('.bz-lit'), m = /translate\((-?\d+)/.exec(b.style.transform);
      wentLeft = !m || +m[1] < 0;
      // same rule the button uses to pick a side: it sits to the right of the step when there is room
      var r = el && el.getBoundingClientRect(), dir = !r || r.right + 16 + b.offsetWidth < innerWidth ? 'l' : 'r';
      if (calm) return view('point', dir);
      view('fly', wentLeft ? 'l' : 'r');
      t = setTimeout(function () { if (away()) view('point', dir); }, 1000);
    } else if (calm) view('front');
    else { view('fly', wentLeft ? 'r' : 'l'); t = setTimeout(function () { if (!away()) view('front'); }, 1000); }
  }
  new MutationObserver(onMove).observe(b, { attributes: true, attributeFilter: ['class'] });

  // The turnaround (Nov 19: six more angles, so a turn is drawn in steps instead of one jump). s1 to s4 turn from the
  // front to a full side view, s5 is the back three-quarter and s6 the back. They load on the first quiet moment,
  // not with the page. At home with nothing else going on he looks left and right; every third time he spins all the way round.
  var more = 0, n = 0;
  function loadMore() {
    more = [];
    for (var k = 1; k < 7; k++) {
      var i = doc.createElement('img'); i.className = 'bzc-s' + k; i.src = '/media/breezy-cloud-s' + k + '.webp';
      i.width = 176; i.height = 109; i.alt = ''; i.decoding = 'async';
      turn.appendChild(i); more.push(i);
    }
  }
  function ready() { return more.every(function (i) { return i.complete && i.naturalWidth; }); }
  function steps(names, dir) { return names.split(' ').map(function (v) { return [v, dir]; }); }
  var LOOK = steps('s1 s2 s3 s3 s3 s2 s1', 'l').concat([['front', '']], steps('s1 s2 s3 s3 s3 s2 s1', 'r'), [['front', '']]);
  var SPIN = steps('s1 s2 s3 s4 s5', 'l').concat([['s6', '']], steps('s5 s4 s3 s2 s1', 'r'), [['front', '']]);
  function play(seq, ms, el) {
    el = el || c;
    el.setAttribute('data-step', '');
    seq.forEach(function (s, i) {
      setTimeout(function () {
        if (!el.hasAttribute('data-step')) return;
        if (el === c && away()) return el.removeAttribute('data-step');
        el.setAttribute('data-view', s[0]);
        if (s[1]) el.setAttribute('data-dir', s[1]); else el.removeAttribute('data-dir');
        if (i === seq.length - 1) el.removeAttribute('data-step');
      }, i * ms);
    });
  }
  if (!calm) setInterval(function () {
    if (doc.hidden || away() || b.getAttribute('aria-expanded') === 'true' || (c.getAttribute('data-view') || 'front') !== 'front') return;
    if (!more) return loadMore();
    if (!ready()) return;
    n++;
    if (n % 3) play(LOOK, 150); else play(SPIN, 130);
  }, 13000);

  // The small Breezys (Nov 20): the one on "Your road" and the one in the chat header turn too. They are drawn after
  // this file runs, so each is set up the first time it is seen on screen. Same angles, same files, no flight poses.
  function small(el) {
    var bd = el.querySelector('.bzc-body'), list = [];
    el._bz = list;
    if (!bd) return list;
    var tn = doc.createElement('span'); tn.className = 'bzc-turn';
    while (bd.firstChild) tn.appendChild(bd.firstChild);
    bd.appendChild(tn);
    var f = tn.querySelector('img'); if (f) f.className = 'bzc-vf';
    for (var k = 1; k < 7; k++) {
      var i = doc.createElement('img'); i.className = 'bzc-s' + k; i.src = '/media/breezy-cloud-s' + k + '.webp';
      i.width = 176; i.height = 109; i.alt = ''; i.decoding = 'async';
      tn.appendChild(i); list.push(i);
    }
    return list;
  }
  var m = 0;
  if (!calm) setInterval(function () {
    if (doc.hidden) return;
    m++;
    [].forEach.call(doc.querySelectorAll('.bzc-road,.bzc-face'), function (el, j) {
      if (!el.offsetWidth) return;
      var list = el._bz || small(el);
      if (list.length < 6 || el.hasAttribute('data-step')) return;
      if (!list.every(function (i) { return i.complete && i.naturalWidth; })) return;
      setTimeout(function () { play((m + j) % 3 ? LOOK : SPIN, (m + j) % 3 ? 150 : 130, el); }, j * 1200);
    });
  }, 9000);

  window.BBCloudView = view;
  window.BBCloudSpin = function (all) { if (!more) loadMore(); (function go() { if (ready()) play(all ? SPIN : LOOK, all ? 130 : 150); else setTimeout(go, 200); })(); };
})();
