/* Member progress road: a bar from 0 to 100%, a small cheer at every 5%, a badge at every 10%.
   Plain code, no AI. Progress is kept in this browser, and in the member's account when they're signed in
   (Supabase user metadata, through BBMembers). Badges are just badges: no points, prizes or money.
   Pages mark wins with BBProgress.done('id') and show the road with <div data-progress></div>. */
(function () {
  'use strict';
  var doc = document, KEY = 'bb-progress-v1';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each win and how much of the road it fills. Free wins reach 10%; the rest opens with Members.
  var WINS = [
    { id: 'signup', pct: 3, name: 'Sign up free' },
    { id: 'blueprint', pct: 2, name: 'Open your Blueprint' },
    { id: 'step1', pct: 5, name: 'Write your one-person sentence (step 1)' },
    { id: 'step2', pct: 10, name: 'Pick your lane (step 2)', members: true },
    { id: 'step3', pct: 10, name: "Write what you'll never do (step 3)", members: true },
    { id: 'step4', pct: 10, name: 'Plan five pieces, one job each (step 4)', members: true },
    { id: 'step5', pct: 10, name: 'Set your normal week and your floor (step 5)', members: true },
    { id: 'step6', pct: 10, name: "Pick what you'll film on (step 6)", members: true },
    { id: 'step7', pct: 10, name: 'Publish your first piece (step 7)', members: true },
    { id: 'site', pct: 15, name: 'Get your page online', members: true },
    { id: 'shop', pct: 15, name: 'Open your small shop', members: true }
  ];
  var BADGES = { 10: 'First Step', 20: 'Lane Finder', 30: 'Rule Maker', 40: 'Job Picker', 50: 'Week Builder',
    60: 'Gear Smart', 70: 'First Post', 80: 'Steady Builder', 90: 'Page Builder', 100: 'Digital Builder' };
  var CHEERS = ['Nice start!', 'Look at you go!', "You're on the road!", 'Keep going!', 'Another step done!'];

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function store(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } }
  var s = load(); s.done = s.done || []; s.seen = s.seen || 0;

  function pct(done) { return Math.min(100, WINS.reduce(function (t, w) { return t + (done.indexOf(w.id) > -1 ? w.pct : 0); }, 0)); }
  function M() { return window.BBMembers && window.BBMembers.on ? window.BBMembers : null; }

  // keep the account copy in step with this browser (both directions, never losing a win)
  function sync() {
    var m = M(); if (!m || !m.user()) return;
    var u = m.user(), acct = (u.user_metadata && u.user_metadata.bb_progress) || {};
    var both = (acct.done || []).concat(s.done).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var seen = Math.max(acct.seen || 0, s.seen);
    var changed = both.length !== (acct.done || []).length || seen !== (acct.seen || 0);
    s.done = both; s.seen = seen; store(s);
    if (changed && m.saveMeta) m.saveMeta({ bb_progress: { done: both, seen: seen } });
  }

  /* ---------- cheers and badges ---------- */
  var queue = [], showing = false;
  function toast(kind, big, small) { queue.push([kind, big, small]); if (!showing) next(); }
  function next() {
    var t = queue.shift(); if (!t) { showing = false; return; }
    showing = true;
    var el = doc.createElement('div');
    el.className = 'pg-toast pg-' + t[0]; el.setAttribute('role', 'status');
    el.innerHTML = (t[0] === 'badge' ? '<span class="pg-medal" aria-hidden="true">' + t[2].pct + '%</span>' : '<span class="pg-spark" aria-hidden="true"></span>') +
      '<span><b>' + t[1] + '</b><br>' + t[2].text + '</span>';
    doc.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    setTimeout(function () { el.classList.remove('on'); setTimeout(function () { el.remove(); next(); }, reduce ? 0 : 400); }, t[0] === 'badge' ? 4200 : 2800);
  }
  function celebrate(from, to) {
    for (var p = Math.floor(from / 5) * 5 + 5; p <= to; p += 5) {
      if (p % 10 === 0) toast('badge', 'Badge earned: ' + BADGES[p], { pct: p, text: "You're " + p + '% down the road.' });
      else toast('cheer', p + '% done. ' + CHEERS[(p / 5) % CHEERS.length], { text: 'One step at a time.' });
    }
  }

  /* ---------- the road ---------- */
  function draw() {
    var now = pct(s.done);
    [].forEach.call(doc.querySelectorAll('[data-progress]'), function (el) {
      var badges = Object.keys(BADGES).map(function (k) {
        var got = now >= +k;
        return '<li class="pg-badge' + (got ? ' got' : '') + '" title="' + BADGES[k] + '"><span class="pg-medal" aria-hidden="true">' + k + '%</span><span>' + BADGES[k] + '</span><span class="sr">' + (got ? ' earned' : ' not yet') + '</span></li>';
      }).join('');
      var wins = WINS.map(function (w) {
        var d = s.done.indexOf(w.id) > -1;
        return '<li class="' + (d ? 'done' : '') + (w.members ? ' mem' : '') + '"><span class="pg-tick" aria-hidden="true"></span><span>' + w.name + '</span>' +
          (d ? '<span class="sr"> done</span>' : w.members ? '<span class="bp-tag">Members</span>' : '') + '<span class="pg-pct">+' + w.pct + '%</span></li>';
      }).join('');
      el.innerHTML = '<div class="pg-box">' +
        '<div class="pg-top"><p class="pg-h">Your road</p><p class="pg-now"><b>' + now + '%</b> done</p></div>' +
        '<div class="pg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + now + '" aria-label="Your progress"><span style="width:' + now + '%"></span>' +
        '<i style="left:10%"></i><i style="left:20%"></i><i style="left:30%"></i><i style="left:40%"></i><i style="left:50%"></i><i style="left:60%"></i><i style="left:70%"></i><i style="left:80%"></i><i style="left:90%"></i></div>' +
        '<p class="fine">A small cheer at every 5%, a badge at every 10%. Badges show your steps. They aren\'t points or prizes.</p>' +
        '<ol class="pg-badges" aria-label="Badges">' + badges + '</ol>' +
        '<ol class="pg-wins" aria-label="Wins">' + wins + '</ol></div>';
    });
  }

  function done(id) {
    if (s.done.indexOf(id) > -1 || !WINS.some(function (w) { return w.id === id; })) return;
    var before = pct(s.done);
    s.done.push(id);
    var after = pct(s.done);
    if (after > s.seen) { celebrate(Math.max(before, s.seen), after); s.seen = after; }
    store(s); sync(); draw();
  }

  window.BBProgress = { done: done, percent: function () { return pct(s.done); }, wins: WINS, badges: BADGES };

  function init() {
    draw();
    var m = M();
    if (m) m.ready.then(function (ok) {
      if (!ok) return;
      m.onChange(function (u) { if (u) { done('signup'); sync(); draw(); } });
      if (m.user()) { done('signup'); sync(); draw(); }
      m.onChange(function (u) { [].forEach.call(doc.querySelectorAll('[data-progress-signedin]'), function (n) { n.hidden = !u; }); });
      [].forEach.call(doc.querySelectorAll('[data-progress-signedin]'), function (n) { n.hidden = !m.user(); });
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
