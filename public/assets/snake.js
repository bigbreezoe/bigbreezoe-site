/* The Golden Road that runs behind the home page (Nov 19).
   It picks up under the hero picture, snakes down through every section and
   narrows until it ends at "Start here". Drawn once as one SVG; nothing moves,
   so reduced motion needs no special case. No JS, no road: the page reads the same. */
(function () {
  var doc = document, main = doc.getElementById('main'), hero = doc.getElementById('top'), end = doc.getElementById('work');
  if (!main || !hero || !end || !doc.createElementNS) return;
  var NS = 'http://www.w3.org/2000/svg', box = doc.createElement('div'), lastKey = '';
  box.className = 'snake'; box.setAttribute('aria-hidden', 'true');
  main.insertBefore(box, main.firstChild);

  function el(n, a) { var e = doc.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function f(n) { return Math.round(n * 10) / 10; }

  function draw() {
    var W = main.clientWidth, y0 = hero.offsetTop + hero.offsetHeight - 6;
    var y1 = end.offsetTop + Math.min(150, end.offsetHeight * 0.3), L = y1 - y0;
    if (W < 280 || L < 400) return;
    var key = W + ':' + Math.round(y0) + ':' + Math.round(y1);
    if (key === lastKey) return; lastKey = key;

    var small = W < 700;
    var w0 = Math.min(W * (small ? 0.62 : 0.4), 560), w1 = small ? 30 : 46;   // road width, top and bottom
    var amp = Math.min(W * (small ? 0.24 : 0.3), 470);
    var turns = Math.max(3, Math.round(L / (small ? 760 : 980)));
    var N = Math.max(120, Math.round(L / 14)), P = [], i, t;
    for (i = 0; i <= N; i++) {
      t = i / N;
      var ease = t * t * (3 - 2 * t);
      P.push({
        x: W / 2 + amp * (1 - 0.62 * t) * Math.sin(Math.PI * turns * t) * Math.min(1, t * 9),
        y: y0 + L * t,
        w: (w0 + (w1 - w0) * ease) / 2
      });
    }
    // normals
    for (i = 0; i <= N; i++) {
      var a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      P[i].nx = dy / d; P[i].ny = -dx / d;
    }
    function side(s, k) { var o = []; for (var j = 0; j <= N; j++) o.push(f(P[j].x + P[j].nx * P[j].w * s * k) + ' ' + f(P[j].y + P[j].ny * P[j].w * s * k)); return o; }
    function poly(k) { return 'M' + side(1, k).join('L') + 'L' + side(-1, k).reverse().join('L') + 'Z'; }

    // brick courses: a line across the road every so often, with staggered joints between them
    var courses = '', joints = '', run = 0, next = 0, row = 0, prev = null;
    for (i = 1; i <= N; i++) {
      var p = P[i], q = P[i - 1]; run += Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
      if (run < next) continue;
      next = run + Math.max(13, p.w * 0.36); row++;
      courses += 'M' + f(p.x + p.nx * p.w) + ' ' + f(p.y + p.ny * p.w) + 'L' + f(p.x - p.nx * p.w) + ' ' + f(p.y - p.ny * p.w);
      if (prev) {
        var cols = p.w > 110 ? 5 : p.w > 55 ? 4 : p.w > 26 ? 3 : 2, off = row % 2 ? 0.5 : 0;
        for (var c = 1; c < cols + (off ? 1 : 0); c++) {
          var u = ((c - off) / cols) * 2 - 1; if (u <= -0.98 || u >= 0.98) continue;
          joints += 'M' + f(prev.x + prev.nx * prev.w * u) + ' ' + f(prev.y + prev.ny * prev.w * u) + 'L' + f(p.x + p.nx * p.w * u) + ' ' + f(p.y + p.ny * p.w * u);
        }
      }
      prev = p;
    }

    var H = Math.ceil(y1 + 40), svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, preserveAspectRatio: 'none' });
    var defs = el('defs', {}), g1 = el('linearGradient', { id: 'snk-g', gradientUnits: 'userSpaceOnUse', x1: 0, y1: y0, x2: 0, y2: y1 });
    [[0, '#FFD57D'], [0.45, '#F0A840'], [1, '#C67430']].forEach(function (s) { g1.appendChild(el('stop', { offset: s[0], 'stop-color': s[1] })); });
    var g2 = el('linearGradient', { id: 'snk-f', gradientUnits: 'userSpaceOnUse', x1: 0, y1: y0, x2: 0, y2: y0 + Math.min(260, L * 0.08) });
    g2.appendChild(el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 })); g2.appendChild(el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 1 }));
    var mask = el('mask', { id: 'snk-m', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H });
    mask.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#snk-f)' }));
    defs.appendChild(g1); defs.appendChild(g2); defs.appendChild(mask); svg.appendChild(defs);
    var g = el('g', { mask: 'url(#snk-m)' });
    g.appendChild(el('path', { d: poly(1.5), 'class': 'snake-glow' }));
    g.appendChild(el('path', { d: poly(1.1), 'class': 'snake-kerb' }));
    g.appendChild(el('path', { d: poly(1), fill: 'url(#snk-g)', 'class': 'snake-bed' }));
    g.appendChild(el('path', { d: courses, 'class': 'snake-line' }));
    g.appendChild(el('path', { d: joints, 'class': 'snake-line' }));
    svg.appendChild(g);
    box.textContent = ''; box.appendChild(svg);
  }

  var timer;
  function later() { clearTimeout(timer); timer = setTimeout(draw, 160); }
  draw();
  window.addEventListener('load', later);
  window.addEventListener('resize', later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(main);
})();
