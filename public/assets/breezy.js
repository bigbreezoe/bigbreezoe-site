/* Breezy, the on-page helper. Loaded by bb.js the first time someone clicks "Ask Breezy".
   Answers are built from this site's own facts (store-config.js), so a price changed there changes here. Nothing typed
   here leaves the browser unless /api/chat reports the AI mode is on, and then the panel says so before the first message.
   See docs/BREEZY.md. */
(function () {
  'use strict';
  var doc = document;
  function all(sel, el) { return [].slice.call((el || doc).querySelectorAll(sel)); }
  var EMAIL = 'hello@bigbreezoe.com', MAIL = '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>';
  var ai = false, busy = false, log = [], panel, list, input, launcher;
  var ALIAS = {
    'getting-started': ['getting started', 'coaching', 'one on one', '1 on 1'],
    'session-60': ['working session', 'screen share', '60 min'],
    'quick-fix': ['quick fix', 'broken', 'fix'],
    'intake-form': ['intake', 'auto-reply', 'auto reply'],
    'booking-page': ['booking', 'calendar', 'schedule', 'appointment'],
    'email-welcome': ['email list', 'newsletter', 'welcome email'],
    'follow-up': ['follow-up', 'follow up', 'reminder', 'no-show'],
    'one-page-site': ['website', 'web site', 'domain', 'landing page'],
    'video-edit': ['video edit', 'edit my', 'editing', 'podcast edit', 'edit a video', 'edit the'],
    'shorts-pack': ['shorts', 'clips', 'reels', 'tiktok'],
    'content-week': ['content week'],
    'starter-bundle': ['bundle', 'starter'],
    'three-lane-kit-builder': ['three-lane', 'three lane', 'kit builder'],
    'audio-kit': ['audio kit', 'audio guide'],
    'weekly-os': ['weekly', 'operating system', 'routine', 'planner'],
    'descript-prompt-pack': ['prompt pack', 'prompts', 'descript'],
    'intake-kit': ['intake kit', 'automation kit']
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store() { return window.BB_STORE || null; }
  function loadStore(cb) {
    if (store()) return cb();
    var s = doc.createElement('script'); s.src = '/store/store-config.js'; s.onload = cb; s.onerror = cb; doc.head.appendChild(s);
  }
  function items() {
    var st = store(), out = [], k;
    if (!st) return out;
    for (k in st.SERVICES) {
      var sv = st.SERVICES[k];
      if (sv.price == null || !(sv.menu || k === 'getting-started')) continue;
      out.push({ key: k, name: sv.name, price: sv.price, unit: sv.unit, what: sv.what, href: k === 'getting-started' ? '/start/' : '/store/#services', job: true });
    }
    for (k in st.PRODUCTS) out.push({ key: k, name: st.PRODUCTS[k].name, price: st.PRODUCTS[k].price, href: '/store/' + k + '.html' });
    return out;
  }
  function line(it) {
    return '<b>' + esc(it.name) + '</b>, $' + it.price + (it.unit ? ' (' + esc(it.unit) + ')' : '') + (it.what ? '. ' + esc(it.what) : (it.job ? '' : '. A download you get right after you pay.')) +
      ' <a href="' + it.href + '">' + (it.key === 'getting-started' ? 'Apply here' : 'See it') + '</a>';
  }
  function match(q) {
    var found = [];
    items().forEach(function (it) {
      var words = (ALIAS[it.key] || []).concat([it.name.toLowerCase()]), n = 0;
      words.forEach(function (w) { if (q.indexOf(w) > -1) n++; });
      if (n) found.push({ it: it, n: n });
    });
    found.sort(function (a, b) { return b.n - a.n; });
    return found.slice(0, 3).map(function (f) { return f.it; });
  }
  function gs() { var st = store(); return st && st.SERVICES['getting-started'] ? '$' + st.SERVICES['getting-started'].price : ''; }

  /* The scripted answers. Each one restates what a page on this site already says and links to it. */
  function answer(raw) {
    var q = ' ' + raw.toLowerCase().replace(/[^a-z0-9$\- ]+/g, ' ') + ' ', hit;
    if (/ (who|what) are you | are you (a |an )?(ai|bot|robot|real|human|person)|breezy|george/.test(q))
      return "I'm Breezy, the automated helper on this site. I'm not Cris and I'm not a person. " + (ai ? 'An AI model writes my replies from the facts on this site.' : 'My answers are pre-written from what this site says, and your messages stay in your browser.') + ' For anything I can\'t answer, email ' + MAIL + '.';
    if (/refund|money back|cancel/.test(q))
      return 'The refund terms are on the <a href="/terms.html">Terms page</a>. I won\'t paraphrase them here, so read them there or email ' + MAIL + '.';
    if (/ (earn|earnings|income|profit|rich|revenue) |mak(e|ing) (any |more |real )?money|money (can|will|could|would|do|did) (i|you|we) |(can|will|could|would) i (make|earn)|guarantee|results/.test(q))
      return 'Nothing here promises earnings or results. This site is a record of what Cris is building and what happens, not a guarantee that it works.';
    if (/password|log ?in|my account|is (it|this) safe|secure|trust/.test(q))
      return 'Cris never asks for your passwords. You invite him into your tools, and you keep what he builds in your own accounts. You pay by card through Stripe, with no account to make.';
    if (/how long|turnaround|how fast|how soon|deadline|when will|delivery time/.test(q))
      return 'No turnaround time is published on the site, so I won\'t guess one. Email ' + MAIL + ' and Cris will tell you before you pay.';
    if (/contact|talk to|speak (to|with)|a human|real person|reach (you|cris)|your email|email (you|cris|address)|phone|call you/.test(q))
      return 'Email ' + MAIL + '. Cris reads every email himself.';
    hit = match(q);
    if (hit.length) return hit.map(line).join('<br><br>');
    if (/how (do|can) i (buy|pay|order)|checkout|payment|stripe|credit card|paypal|how (does )?buying/.test(q))
      return 'Three steps: pick a job or a download, pay by card through Stripe, then book a time, send your files, or download. <a href="/store/">Open the store</a>';
    if (/free|blueprint|guide/.test(q))
      return 'The Beginner Creator Blueprint is free: seven steps in order, with a prompt at each one. <a href="/blueprint/">See what\'s in it</a>';
    if (/gear|mic|camera|light|tool|software|capcut|equipment/.test(q))
      return 'The gear list is sorted by cost (free, best value, premium), and every item is labeled by whether Cris uses it. <a href="/gear/">See the gear page</a>';
    if (/episode|video|youtube|watch|channel|latest/.test(q))
      return 'Every episode is on the home page, newest first. <a href="/#watch">Watch the build</a>';
    if (/price|cost|how much|pricing|rates|service|offer|sell|menu|what do you do|download|product|buy/.test(q)) {
      var its = items(), jobs = its.filter(function (i) { return i.job && i.key !== 'getting-started'; }), dl = its.filter(function (i) { return !i.job; });
      if (!its.length) return 'Every job and download is listed with its price in the <a href="/store/">store</a>.';
      function short(a) { return a.map(function (i) { return esc(i.name) + ' $' + i.price; }).join(', '); }
      return 'Start with a Getting Started session, ' + gs() + ', apply first.<br><br><b>One-off jobs:</b> ' + short(jobs) + '.<br><br><b>Downloads:</b> ' + short(dl) + '.<br><br><a href="/store/">Open the store</a>';
    }
    if (/start|begin|new |beginner|stuck|help|where|first|advice|should i/.test(q))
      return 'Two ways to start. Free: the <a href="/blueprint/">Beginner Creator Blueprint</a>. With Cris: a Getting Started session' + (gs() ? ', ' + gs() : '') + ', a 60-minute working session where you bring the one thing that\'s stuck. Applying is free and you pay only if it fits. <a href="/start/">Start here</a>';
    return 'I don\'t have an answer for that one. Email ' + MAIL + ' and Cris will reply himself, or try one of the buttons below.';
  }

  function add(who, html, isText) {
    var m = doc.createElement('div'); m.className = 'bz-msg bz-' + who;
    if (isText) m.textContent = html; else m.innerHTML = html;
    list.appendChild(m);
    // A long reply should open at its first line, not its last.
    list.scrollTop = who === 'bot' ? Math.max(0, m.offsetTop - list.offsetTop - 44) : list.scrollHeight;
    return m;
  }
  function reply(q) {
    if (!ai) return add('bot', answer(q));
    busy = true;
    var wait = add('bot', '…', true);
    fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: log.slice(-10) }) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) { if (!j || !j.reply) throw 0; wait.textContent = j.reply; log.push({ role: 'assistant', content: j.reply }); })
      .catch(function () { log.pop(); wait.innerHTML = answer(q); })
      .then(function () { busy = false; list.scrollTop = list.scrollHeight; });
  }
  function ask(q) {
    q = String(q || '').trim().slice(0, 300);
    if (!q || busy) return;
    add('me', q, true); log.push({ role: 'user', content: q });
    loadStore(function () { reply(q); });
  }
  function build() {
    panel = doc.createElement('section'); panel.className = 'bz glass'; panel.id = 'breezy'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Ask Breezy'); panel.hidden = true;
    panel.innerHTML = '<header class="bz-top"><div><b>Breezy</b><span class="bz-kind">Automated helper, not a person</span></div><button type="button" class="bz-x" aria-label="Close">×</button></header>' +
      '<div class="bz-log" aria-live="polite"></div>' +
      '<div class="bz-chips"><button type="button">Where do I start?</button><button type="button">What does it cost?</button><button type="button">How does buying work?</button><button type="button">Talk to Cris</button></div>' +
      '<form class="bz-form"><label class="sr" for="bz-in">Your question</label><input id="bz-in" type="text" maxlength="300" autocomplete="off" placeholder="Ask about a job, a price, a download"><button class="btn btn-sm" type="submit">Send</button></form>' +
      '<p class="bz-note"></p>';
    doc.body.appendChild(panel);
    list = panel.querySelector('.bz-log'); input = panel.querySelector('input');
    panel.querySelector('.bz-x').addEventListener('click', function () { toggle(false); });
    panel.querySelector('.bz-form').addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
    all('.bz-chips button', panel).forEach(function (b) { b.addEventListener('click', function () { ask(b.textContent); }); });
    note();
    add('bot', "Hi, I'm Breezy, the helper on this site. Ask me about a job, a price, or where to start. For anything else, email " + MAIL + '.');
    // The AI mode is off unless the server says otherwise. If it is on, say so before anything is sent.
    fetch('/api/chat').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.ai) return;
      ai = true; panel.querySelector('.bz-kind').textContent = 'AI assistant, not a person'; note();
    }).catch(function () {});
  }
  function note() {
    panel.querySelector('.bz-note').innerHTML = ai
      ? 'Replies are written by an AI model (Claude, by Anthropic), so your messages are sent to it. Don\'t share passwords, card numbers or private details. <a href="/privacy.html">Privacy</a>'
      : 'Your messages stay in this browser. Nothing you type here is sent anywhere.';
  }
  function toggle(on) {
    if (on && !panel) build();
    if (!panel) return;
    panel.hidden = !on; launcher.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) input.focus(); else launcher.focus();
  }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && !panel.hidden) toggle(false); });
  window.BBBreezy = { init: function (b) { launcher = b; }, toggle: function () { toggle(!panel || panel.hidden); } };
})();
