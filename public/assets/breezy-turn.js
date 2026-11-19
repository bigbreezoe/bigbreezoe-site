/* Breezy's turnaround (Nov 18). Loaded after the page is up, so the shared script stays small.
   Adds three more drawings of the same cloud to the Ask Breezy button (three-quarter, flying, pointing; all face left,
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

  // The turnaround: at home with nothing else going on, he looks left, then right, then back.
  if (!calm) setInterval(function () {
    if (doc.hidden || away() || b.getAttribute('aria-expanded') === 'true' || (c.getAttribute('data-view') || 'front') !== 'front') return;
    [['tq', 'l', 0], ['front', '', 1100], ['tq', 'r', 1500], ['front', '', 2700]].forEach(function (s) {
      setTimeout(function () { if (!away()) view(s[0], s[1]); }, s[2]);
    });
  }, 13000);

  window.BBCloudView = view;
})();
