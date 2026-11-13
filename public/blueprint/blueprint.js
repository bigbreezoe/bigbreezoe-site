/* Blueprint page: the email unlock, then (only after sign-up) Breezy's free step 1 sample, the Members lock and the guide.
   Plain code, no AI. The email goes to Kit (form 9923204), the same form the rest of the site uses,
   so Kit sends the emailed copy. Step 1 answers stay in this browser (localStorage) and are sent nowhere. */
(function () {
  'use strict';
  var doc = document, KEY = 'bb-blueprint-v1';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return doc.getElementById(id); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: keep going */ } }
  function cloud(el, words) { if (window.BBCloud && el) window.BBCloud.point(el, words); }
  var state = load();

  /* ---------- 1. Email unlock ---------- */
  // Pulls the sections of /blueprint/guide/ into this page, so the Blueprint lives in one file.
  function win(id) { if (window.BBProgress) window.BBProgress.done(id); }
  function showGuide(focus) {
    var full = $('bp-full'), box = $('bp-open'), form = $('bp-unlock');
    if (!full || !box) return;
    win('blueprint');
    if (form) form.hidden = true;
    var mb = $('bp-members'); if (mb) mb.hidden = true;
    box.hidden = false;
    // Breezy's step 1 sample, the Members lock and the guide show only after sign-up
    [].forEach.call(doc.querySelectorAll('.bp-after'), function (s) { s.hidden = false; });
    if (focus) { box.focus({ preventScroll: true }); box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    if (full.getAttribute('data-done')) return;
    full.setAttribute('data-done', '1');
    fetch('/blueprint/guide/', { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        var page = new DOMParser().parseFromString(html, 'text/html');
        var parts = page.querySelectorAll('main .wrap > section');
        if (!parts.length) throw new Error('empty');
        [].forEach.call(parts, function (s) { full.appendChild(doc.importNode(s, true)); });
      })
      .catch(function () {
        full.innerHTML = '<p><a class="link-arrow" href="/blueprint/guide/">Read the Blueprint</a></p>';
      });
  }

  function unlock() {
    var form = $('bp-unlock'), input = $('bp-email'), btn = $('bp-go'), msg = $('bp-msg');
    if (!form || !input) return;
    if (state.open) { showGuide(false); return; }
    // Preview sites only (never bigbreezoe.com): ?preview=open shows the signed-up view without sending an email.
    if (/(\.pages\.dev|localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]preview=open\b/.test(location.search)) { win('signup'); showGuide(false); return; }

    function opened(sent) {
      state.open = true; save(state); win('signup');
      if (!sent) { var s = $('bp-sent'); if (s) s.textContent = "The email copy didn't go through, but you can read it all right here. You can try your email again later."; }
      showGuide(true);
    }
    function busy(on) { if (btn) btn.disabled = on; if (msg) msg.textContent = on ? 'Opening...' : ''; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!input.checkValidity()) { input.reportValidity(); return; }
      busy(true);
      // Kit answers in JSON when asked. If the browser can't read the answer, send it plainly and open anyway.
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (r.ok && (!j.status || j.status === 'success')) { opened(true); return; }
            busy(false);
            if (msg) msg.textContent = "That email didn't work. Check it and try again.";
            input.focus();
          });
        })
        .catch(function () {
          fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' })
            .then(function () { opened(true); }, function () { opened(false); });
        });
    });
  }

  /* ---------- 2. Breezy's step 1 sample ---------- */
  var VAGUE = /^(everyone|everybody|anyone|anybody|people|all|beginners?|my audience|audience|creators?|users?|customers?)$/i;
  var LINES = {
    who: 'Good. Now, what are they stuck on?',
    what: "Got it. Last one: what do they want instead?",
    out: 'Here you go. Read it out loud once.'
  };

  function coach() {
    var form = $('bp-s1');
    if (!form) return;
    var say = $('bp-say'), next = $('bp-next'), redo = $('bp-redo'), result = $('bp-result'), line = $('bp-line');
    var qs = [].slice.call(form.querySelectorAll('.bp-q'));
    var order = ['who', 'what', 'out'], step = 0, nudged = false;
    var a = state.s1 || {};

    function input(name) { return $('bp-' + name); }
    function talk(t) { if (say) say.textContent = t; }
    function sentence() {
      var clean = function (t) { return String(t || '').trim().replace(/[.!?]+$/, ''); };
      return 'I help ' + clean(a.who) + ' who struggle with ' + clean(a.what) + ' so they can ' + clean(a.out) + '.';
    }
    function show(i) {
      step = i;
      qs.forEach(function (q, k) { q.hidden = k > i; });
      if (next) next.textContent = i === order.length - 1 ? 'Write my sentence' : 'Next';
      if (redo) redo.hidden = i === 0;
    }
    function finish() {
      form.hidden = true;
      if (line) line.textContent = sentence();
      if (result) result.hidden = false;
      talk(LINES.out);
      win('step1');
      if (!$('bp-lock').hidden) cloud($('bp-lock-h'), 'Want help with step 2? That one is for Members.');
    }
    function reset() {
      a = {}; state.s1 = a; save(state); nudged = false;
      order.forEach(function (n) { var el = input(n); if (el) el.value = ''; });
      form.hidden = false; if (result) result.hidden = true;
      talk("Let's try again. Who do you want to help?");
      show(0); var f = input('who'); if (f) f.focus();
    }

    // put back saved answers
    order.forEach(function (n) { var el = input(n); if (el && a[n]) el.value = a[n]; });
    if (a.who && a.what && a.out) finish(); else show(0);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = order[step], el = input(name), v = el ? el.value.trim() : '';
      if (!v) { talk("Type a few words. It's okay if it's messy."); if (el) el.focus(); return; }
      if (name === 'who' && !nudged && (VAGUE.test(v) || v.split(/\s+/).length < 2)) {
        nudged = true;
        talk("That's a lot of people. Can you picture just one of them? Add a detail, like their job or what their day looks like. Or tap Next to keep it.");
        el.focus(); return;
      }
      a[name] = v; state.s1 = a; save(state);
      if (step === order.length - 1) { finish(); return; }
      talk(LINES[name]);
      show(step + 1);
      var nx = input(order[step]); if (nx) nx.focus();
    });
    if (redo) redo.addEventListener('click', reset);
    var again = $('bp-again'); if (again) again.addEventListener('click', reset);
    var copy = $('bp-copy');
    if (copy) copy.addEventListener('click', function () {
      var t = sentence();
      var ok = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy it'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { talk('Copy didn\'t work here. Press and hold the sentence to copy it.'); });
      else talk('Press and hold the sentence to copy it.');
    });
  }

  // With member sign-in switched on, signing up (or in) opens the page. Without it, the email unlock does.
  function gate() {
    var M = window.BBMembers;
    if (!M || !M.on || state.open) { unlock(); return; }
    var f = $('bp-unlock'); if (f) f.hidden = true;
    if (/(\.pages\.dev|localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]preview=open\b/.test(location.search)) { win('signup'); showGuide(false); return; }
    M.ready.then(function (ok) {
      if (!ok) { if (f) f.hidden = false; unlock(); return; }
      if (M.user()) showGuide(false);
      M.onChange(function (u) { if (u) showGuide(true); });
      doc.addEventListener('bb:signedup', function () {
        win('signup');
        var s = $('bp-sent'); if (s) s.textContent = 'Check your email: tap the link to confirm your account. Your Blueprint copy is on its way too, from hello@bigbreezoe.com.';
        showGuide(true);
      });
    });
  }
  function init() { gate(); coach(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
