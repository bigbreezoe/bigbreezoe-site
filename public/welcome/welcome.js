/* Welcome page: the "step onto the road" button, the nine-tap intake and the package match.
   Plain code, no AI. Answers stay in this browser (localStorage) and nothing is sent anywhere. */
(function () {
  'use strict';
  var doc = document, KEY = 'bb-welcome-v1';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return doc.getElementById(id); }
  function all(sel, el) { return [].slice.call((el || doc).querySelectorAll(sel)); }
  function cloud(el, words) { if (window.BBCloud && el) window.BBCloud.point(el, words); }
  function go(el) { if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }

  // Breezy's lines between questions. Index = the step just answered.
  var SAYS = ["No wrong answers. Just where you are today.", 'Good. Wherever you are is a fine place to start.',
    'That tells me how much help you want finding your lane.', "Got it. A plan that fits your week beats one you can't keep.",
    'Everyone gets stuck somewhere. Naming it is the first fix.', 'Good. Show up where your people already are.',
    'Good news: lots of people start with just a phone.', 'Free tools first is always an option.', ''];

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* private mode: keep going */ } }

  // The package match from the member journey map. Returns [best fit, other option].
  function match(a) {
    var best, alt;
    if (a.goal === 'look' || a.budget === '0') { best = 'free'; alt = a.niche === 'no' ? 'niche' : 'diy-small'; }
    else if (a.goal === 'systems' && a.stage === 'selling') { best = 'basics'; alt = 'live'; }
    else if (a.learn === 'live') { best = 'live'; alt = a.niche === 'no' ? 'niche' : 'free'; }
    else if (a.learn === 'fix') { best = 'fix'; alt = 'live'; }
    else if (a.niche === 'no') { best = 'niche'; alt = 'free'; }
    else if (a.learn === 'diy' || a.learn === 'watch') { best = a.budget === 'lt25' ? 'diy-small' : 'diy'; alt = 'free'; }
    else { best = 'free'; alt = 'live'; }
    if (alt === best) alt = best === 'free' ? 'live' : 'free';
    return [best, alt];
  }

  function init() {
    var enter = $('wl-enter'), video = $('wl-video'), quiz = $('wl-quiz'), form = $('wl-form');
    if (!quiz || !form) return;
    var qs = all('.wl-q', form), step = 0, a = load();
    var next = $('wl-next'), back = $('wl-back'), count = $('wl-count'), fill = $('wl-fill'), say = $('wl-breezy');
    var result = $('wl-result');
    // if the avatar picture can't load, keep the sun and the bricks and drop the broken image
    var av = doc.querySelector('.wl-avatar img');
    if (av) { var nope = function () { av.parentNode.classList.add('wl-noimg'); }; if (av.complete && !av.naturalWidth) nope(); else av.addEventListener('error', nope); }

    if (enter) enter.addEventListener('click', function (e) {
      e.preventDefault(); go($('clip'));
      if (video) { try { var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (err) { /* autoplay blocked: the controls are there */ } }
    });
    if (video) video.addEventListener('ended', function () { cloud(doc.querySelector('a[href="#get"]'), "That's the road. Here's what's yours."); });

    // put saved answers back
    qs.forEach(function (q) {
      var name = q.getAttribute('data-q'), v = a[name];
      all('input', q).forEach(function (i) { i.checked = Array.isArray(v) ? v.indexOf(i.value) > -1 : v === i.value; });
    });

    function value(q) {
      var name = q.getAttribute('data-q'), picked = all('input:checked', q).map(function (i) { return i.value; });
      return q.hasAttribute('data-multi') ? picked : picked[0];
    }
    function answered(q) { var v = value(q); return Array.isArray(v) ? v.length > 0 : !!v; }

    function show(i, focus) {
      step = i;
      qs.forEach(function (q, n) { q.hidden = n !== i; });
      count.textContent = 'Step ' + (i + 1) + ' of ' + qs.length;
      fill.style.transform = 'scaleX(' + ((i + 1) / qs.length) + ')';
      back.disabled = i === 0;
      next.textContent = i === qs.length - 1 ? 'See my match' : 'Next';
      next.disabled = !answered(qs[i]);
      if (focus) { var first = qs[i].querySelector('input'); if (first) first.focus({ preventScroll: true }); }
      if (!next.disabled) cloud(next, 'Tap ' + next.textContent + ' when you are ready.');
    }

    form.addEventListener('change', function () {
      var q = qs[step]; a[q.getAttribute('data-q')] = value(q); save(a);
      next.disabled = !answered(q);
      if (!next.disabled) cloud(next, SAYS[step] || 'Tap Next.');
    });
    next.addEventListener('click', function () {
      if (!answered(qs[step])) return;
      say.textContent = SAYS[step] || '';
      if (step < qs.length - 1) show(step + 1, true); else finish(false);
    });
    back.addEventListener('click', function () { if (step > 0) { say.textContent = ''; show(step - 1, true); } });

    function finish(quiet) {
      var m = match(a);
      a.match = m; save(a);
      all('.wl-pick', result).forEach(function (el) {
        var k = el.getAttribute('data-pick'), i = m.indexOf(k);
        el.hidden = i < 0; el.style.order = String(i);
        el.classList.toggle('wl-best', i === 0);
      });
      quiz.hidden = true; result.hidden = false;
      if (quiet) return;
      var h = $('wl-result-h'); if (h) { h.focus({ preventScroll: true }); go(result); }
      // let the scroll settle, then Breezy points at the first step
      setTimeout(function () { cloud(result.querySelector('.wl-best .btn'), "This is your first step."); }, 700);
    }
    function restart(clearAll) {
      if (clearAll) { a = {}; save(a); all('input', form).forEach(function (i) { i.checked = false; }); }
      say.textContent = ''; result.hidden = true; quiz.hidden = false; show(0, true); go(quiz);
    }
    $('wl-restart').addEventListener('click', function () { restart(true); });
    $('wl-again').addEventListener('click', function () { restart(false); });

    quiz.hidden = false;
    if (a.match && a.learn) { finish(true); } else { show(0, false); }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
