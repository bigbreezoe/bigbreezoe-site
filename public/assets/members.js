/* Big Breezoe members: sign up, sign in (email + password, Google, Apple), forgot password.
   Accounts live in Supabase Auth. Passwords go straight to Supabase and never touch this site's code or Kit.
   New members' emails are also added to the Kit form (9923204), so they get the Blueprint email and stay on the list.
   Use: <div data-members></div> on a page, plus this script. Pages can listen with BBMembers.onChange(fn). */
(function () {
  'use strict';
  // Supabase project address and its publishable key. The publishable key is made to sit in browsers;
  // the project's secret key never goes in this repo. Leave both empty and sign-in stays off
  // (the Blueprint page then falls back to the plain email unlock).
  var CONFIG = { url: 'https://dcdmigmhmfoousjmfobm.supabase.co', key: 'sb_publishable_w4atcnYCUhWN2Gk3ho6FsA_r_Zq3Fmg' };
  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  var KIT = 'https://app.kit.com/forms/9923204/subscriptions';

  var doc = document, client = null, user = null, providers = {}, fns = [];
  var on = !!(CONFIG.url && CONFIG.key);

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function emit() { fns.forEach(function (f) { try { f(user); } catch (e) { /* one page bug shouldn't stop the rest */ } }); }
  function here() { return location.origin + location.pathname; }

  // Adds the email to Kit. Fire and forget: Kit sends the Blueprint email from there.
  function kit(email) {
    if (!email) return;
    var fd = new FormData(); fd.append('email_address', email);
    try { fetch(KIT, { method: 'POST', body: fd, mode: 'no-cors' }).catch(function () {}); } catch (e) { /* offline */ }
  }
  // Google and Apple sign-ups reach Kit once, the first time they come back signed in.
  function kitOnce(u) {
    if (!u || !u.email) return;
    var k = 'bb-kit-' + u.id;
    try { if (localStorage.getItem(k)) return; } catch (e) { /* private mode */ }
    var fresh = u.created_at && (Date.now() - new Date(u.created_at).getTime() < 15 * 60 * 1000);
    var social = u.app_metadata && u.app_metadata.provider && u.app_metadata.provider !== 'email';
    if (fresh && social) kit(u.email);
    try { localStorage.setItem(k, '1'); } catch (e) { /* private mode */ }
  }

  function loadSdk() {
    return new Promise(function (ok, no) {
      if (window.supabase && window.supabase.createClient) return ok();
      var s = doc.createElement('script'); s.src = SDK; s.async = true;
      s.onload = function () { ok(); }; s.onerror = no; doc.head.appendChild(s);
    });
  }

  var ready = !on ? Promise.resolve(false) : loadSdk().then(function () {
    client = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
    // which one-tap buttons are switched on in Supabase (Google, Apple)
    var settings = fetch(CONFIG.url + '/auth/v1/settings', { headers: { apikey: CONFIG.key } })
      .then(function (r) { return r.json(); }).then(function (j) { providers = j.external || {}; }).catch(function () {});
    client.auth.onAuthStateChange(function (event, session) {
      user = session ? session.user : null;
      if (event === 'SIGNED_IN') kitOnce(user);
      if (event === 'PASSWORD_RECOVERY') doc.dispatchEvent(new CustomEvent('bb:recovery'));
      emit();
    });
    return Promise.all([settings, client.auth.getSession().then(function (r) { user = r.data.session ? r.data.session.user : null; })])
      .then(function () { return true; });
  }).catch(function () { return false; });

  /* ---------- the sign-up / sign-in box ---------- */
  function mount(el) {
    var mode = el.getAttribute('data-members') === 'signin' ? 'in' : 'up';

    function draw() {
      if (user) {
        el.innerHTML = '<div class="mb-box mb-done"><p class="mb-h">You\'re signed in.</p><p class="fine">' + esc(user.email || '') + '</p>' +
          '<div class="btns"><a class="btn" href="/blueprint/">Open my Blueprint</a><button type="button" class="btn btn-ghost" data-act="out">Sign out</button></div></div>';
        return;
      }
      var g = providers.google, a = providers.apple, up = mode === 'up';
      el.innerHTML = '<div class="mb-box">' +
        '<div class="mb-tabs" role="tablist"><button type="button" role="tab" aria-selected="' + up + '" data-act="up">Sign up free</button><button type="button" role="tab" aria-selected="' + !up + '" data-act="in">Sign in</button></div>' +
        (g || a ? '<div class="mb-social">' + (g ? '<button type="button" class="btn btn-ghost" data-act="google">Continue with Google</button>' : '') +
          (a ? '<button type="button" class="btn btn-ghost" data-act="apple">Continue with Apple</button>' : '') + '</div><p class="mb-or">or use your email</p>' : '') +
        '<form class="mb-form" novalidate>' +
        '<label class="sr" for="mb-email">Email address</label><input id="mb-email" type="email" autocomplete="email" placeholder="you@email.com" required>' +
        '<label class="sr" for="mb-pass">Password</label><input id="mb-pass" type="password" minlength="8" autocomplete="' + (up ? 'new-password' : 'current-password') + '" placeholder="' + (up ? 'Make a password (8 or more letters)' : 'Your password') + '" required>' +
        '<button type="submit" class="btn">' + (up ? 'Make my free account' : 'Sign in') + '</button></form>' +
        (up ? '' : '<button type="button" class="mb-link" data-act="forgot">Forgot your password?</button>') +
        '<p class="fine mb-msg" role="status" aria-live="polite"></p>' +
        (up ? '<p class="fine">Free. You also get the Blueprint by email and one email a week about what I built. Leave any time. I never sell your email.</p>' : '') +
        '</div>';
    }
    function say(t) { var m = el.querySelector('.mb-msg'); if (m) m.textContent = t; }
    function nice(err) {
      var m = (err && err.message) || '';
      if (/already registered|already been registered/i.test(m)) return 'You already have an account. Tap Sign in.';
      if (/invalid login/i.test(m)) return "That email and password don't match. Try again, or tap Forgot your password.";
      if (/not confirmed/i.test(m)) return 'Check your email and tap the link to confirm your account first.';
      if (/rate limit/i.test(m)) return 'Too many tries right now. Wait a few minutes and try again.';
      if (/password/i.test(m)) return 'Your password needs 8 or more letters or numbers.';
      return 'Something went wrong. Try again in a minute.';
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'up' || act === 'in') { mode = act; draw(); var f = el.querySelector('#mb-email'); if (f) f.focus(); return; }
      if (act === 'out') { client.auth.signOut().then(draw); return; }
      if (act === 'google' || act === 'apple') {
        client.auth.signInWithOAuth({ provider: act, options: { redirectTo: here() } }).then(function (r) { if (r.error) say(nice(r.error)); });
        return;
      }
      if (act === 'forgot') {
        var em = el.querySelector('#mb-email');
        if (!em || !em.value || !em.checkValidity()) { say('Type your email above first.'); if (em) em.focus(); return; }
        client.auth.resetPasswordForEmail(em.value.trim(), { redirectTo: location.origin + '/members/?reset=1' })
          .then(function (r) { say(r.error ? nice(r.error) : 'Check your email for a link to make a new password.'); });
      }
    });

    el.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = el.querySelector('#mb-email'), pw = el.querySelector('#mb-pass'), btn = el.querySelector('.mb-form .btn');
      if (!em.checkValidity()) { em.reportValidity(); return; }
      if (pw.value.length < 8) { say('Your password needs 8 or more letters or numbers.'); pw.focus(); return; }
      btn.disabled = true; say(mode === 'up' ? 'Making your account...' : 'Signing in...');
      var email = em.value.trim();
      var job = mode === 'up'
        ? client.auth.signUp({ email: email, password: pw.value, options: { emailRedirectTo: location.origin + '/members/' } })
        : client.auth.signInWithPassword({ email: email, password: pw.value });
      job.then(function (r) {
        btn.disabled = false;
        if (r.error && mode === 'up' && /not authorized|sending|confirmation|rate limit/i.test(r.error.message || '')) {
          // The account email couldn't go out (the sign-in service's mail limits). Don't leave them stuck:
          // they still get the Blueprint here and by email from Kit, and can make the account later.
          kit(email);
          say("We couldn't finish your account just now, but your Blueprint is open below and on its way by email. Try making your account again later.");
          doc.dispatchEvent(new CustomEvent('bb:signedup', { detail: { email: email, noAccount: true } }));
          return;
        }
        if (r.error) { say(nice(r.error)); return; }
        if (mode === 'up') {
          kit(email);
          if (!r.data.session) {
            // account made, waiting on the confirm email: let the page open the free parts now
            say('Your account is made. Check your email and tap the link to confirm it.');
            doc.dispatchEvent(new CustomEvent('bb:signedup', { detail: { email: email } }));
            return;
          }
        }
        user = r.data.user; emit();
      });
    });

    fns.push(draw);
    draw();
  }

  /* ---------- new password after "forgot password" ---------- */
  function recovery(el) {
    doc.addEventListener('bb:recovery', function () {
      el.hidden = false;
      el.innerHTML = '<div class="mb-box"><p class="mb-h">Make a new password</p><form class="mb-form" novalidate>' +
        '<label class="sr" for="mb-new">New password</label><input id="mb-new" type="password" minlength="8" autocomplete="new-password" placeholder="New password (8 or more letters)" required>' +
        '<button type="submit" class="btn">Save my new password</button></form><p class="fine mb-msg" role="status" aria-live="polite"></p></div>';
      el.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var pw = el.querySelector('#mb-new'), m = el.querySelector('.mb-msg');
        if (pw.value.length < 8) { m.textContent = 'Your password needs 8 or more letters or numbers.'; return; }
        client.auth.updateUser({ password: pw.value }).then(function (r) {
          m.textContent = r.error ? 'That didn\'t work. Ask for a new link and try again.' : 'Saved. You\'re signed in.';
        });
      });
      el.scrollIntoView({ block: 'center' });
    });
  }

  window.BBMembers = {
    on: on, ready: ready, kit: kit,
    user: function () { return user; },
    // saves small bits (like progress) on the member's account
    saveMeta: function (data) {
      if (!client || !user) return Promise.resolve();
      return client.auth.updateUser({ data: data }).then(function (r) { if (r.data && r.data.user) user = r.data.user; }).catch(function () {});
    },
    onChange: function (f) { fns.push(f); }
  };

  function init() {
    var boxes = doc.querySelectorAll('[data-members]'), off = doc.querySelectorAll('[data-members-off]');
    var r = doc.querySelector('[data-members-reset]'); if (r && on) recovery(r);
    ready.then(function (ok) {
      [].forEach.call(off, function (n) { n.hidden = ok; });
      if (!ok) return;
      [].forEach.call(boxes, function (b) { b.hidden = false; mount(b); });
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
