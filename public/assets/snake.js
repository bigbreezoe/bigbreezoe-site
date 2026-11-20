/* The Golden Road that runs behind the home page (Nov 19; redrawn Nov 20 from a real brick picture).
   It picks up where the road leaves the hero picture, snakes down through every section and narrows until it
   ends at "Start here". The bricks come from /media/road-bricks.webp, a straight piece of the same toon road,
   laid along the curve one thin slice at a time so the rows follow the bends and shrink as the road narrows.
   Painted once on a canvas; nothing moves, so reduced motion needs no special case. No JS, no road. */
(function () {
  var doc = document, main = doc.getElementById('main'), hero = doc.getElementById('top'), end = doc.getElementById('work');
  if (!main || !hero || !end || !doc.createElement('canvas').getContext) return;
  var box = doc.createElement('div'), tex = new Image(), lastKey = '', timer;
  box.className = 'snake'; box.setAttribute('aria-hidden', 'true');
  main.insertBefore(box, main.firstChild);

  function draw() {
    if (!tex.complete || !tex.naturalWidth) return;
    var W = main.clientWidth, y0 = hero.offsetTop + hero.offsetHeight - 2;
    var y1 = end.offsetTop + Math.min(150, end.offsetHeight * 0.3), L = y1 - y0;
    if (W < 280 || L < 400) return;
    var key = W + ':' + Math.round(y0) + ':' + Math.round(y1);
    if (key === lastKey) return; lastKey = key;

    var small = W < 700, H = Math.ceil(y1 + 60);
    var w0 = Math.min(W * (small ? 0.9 : 0.7), 900), w1 = small ? 34 : 52;   // road width where it leaves the picture, and at the end
    var x0 = W * (small ? 0.5 : 0.44);                                         // where the road sits at the bottom of the picture
    var amp = Math.min(W * (small ? 0.24 : 0.3), 470);
    var turns = Math.max(3, Math.round(L / (small ? 760 : 980)));
    var N = Math.ceil(L / 2.5), P = [], i, t;
    for (i = 0; i <= N; i++) {
      t = i / N;
      P.push({
        x: W / 2 + (x0 - W / 2) * Math.pow(1 - t, 3) + amp * (1 - 0.62 * t) * Math.sin(Math.PI * turns * t) * Math.min(1, t * 9),
        y: y0 + L * t,
        w: (w1 + (w0 - w1) * Math.pow(1 - t, 2.6)) / 2
      });
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2), k = Math.min(dpr, Math.sqrt(9e6 / (W * H)));
    var cv = doc.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    var c = cv.getContext('2d'), tw = tex.naturalWidth, th = tex.naturalHeight, v = 0;
    for (i = 0; i < N; i++) {
      var a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, seg = Math.sqrt(dx * dx + dy * dy);
      var sc = (2 * a.w) / tw, sh = seg / sc;                 // how much of the brick picture this slice uses
      var m = v % (2 * th), sy = m < th ? m : 2 * th - m;     // run down the picture, then back up, so the join never shows
      sy = Math.max(0, Math.min(th - sh - 1, sy));
      c.setTransform(k, 0, 0, k, 0, 0);
      c.translate(a.x, a.y); c.rotate(Math.atan2(dy, dx) - Math.PI / 2);
      c.drawImage(tex, 0, sy, tw, sh + 1, -a.w, 0, 2 * a.w, seg + 1.2);
      v += sh;
    }
    // soften both ends: the top melts into the picture above it, the bottom fades out under "Start here"
    c.setTransform(k, 0, 0, k, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    var g = c.createLinearGradient(0, y0, 0, y0 + 44);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, y0 - 4, W, 50);
    g = c.createLinearGradient(0, y1 - 70, 0, y1 + 6);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g; c.fillRect(0, y1 - 70, W, 140);
    cv.style.height = H + 'px';
    box.textContent = ''; box.appendChild(cv);
  }

  function later() { clearTimeout(timer); timer = setTimeout(draw, 160); }
  tex.onload = draw;
  tex.src = '/media/road-bricks.webp';
  window.addEventListener('load', later);
  window.addEventListener('resize', later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(main);
})();
