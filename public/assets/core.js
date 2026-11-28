/* Breezoe Core v0 (browser + Node). Missions, evidence and Golden Road progress for Breezoe City.
   Original Big Breezoe code (design: Big Breezoe/automation/breezoe-core/DESIGN.md in the Claude work Folder).
   A mission's state is folded from its append-only events. Done means every required check has evidence;
   the model saying "done" never counts. A repeated event id changes nothing. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BBCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TRANSITIONS = {
    planned: ['ready', 'failed'],
    ready: ['running', 'failed'],
    running: ['needs_approval', 'verifying', 'failed'],
    needs_approval: ['running', 'failed'],
    verifying: ['done', 'running', 'failed'],
    done: [],
    failed: ['ready']
  };
  var UNTRUSTED = { model_claim: true };

  function assess(checks, evidence) {
    var usable = evidence.filter(function (e) { return !e.withdrawn && !UNTRUSTED[e.source]; });
    var missing = checks.filter(function (c) {
      return c.required !== false && !usable.some(function (e) { return e.checkId === c.id; });
    }).map(function (c) { return c.id; });
    return { complete: checks.length > 0 && missing.length === 0, missing: missing };
  }

  function create(o) {
    if (!o || !o.id || !o.residentId) throw new Error('mission needs an id and a residentId');
    return { id: o.id, residentId: o.residentId, title: o.title || '', template: o.template || '', state: 'planned', checks: o.checks || [], evidence: [], seen: [], history: [] };
  }

  function clone(m) {
    return { id: m.id, residentId: m.residentId, title: m.title, template: m.template, state: m.state, checks: m.checks,
      evidence: m.evidence.slice(), seen: m.seen.slice(), history: m.history.slice() };
  }

  function move(m, to, at, note) {
    if (TRANSITIONS[m.state].indexOf(to) === -1) { m.history.push({ at: at, rejected: m.state + ' -> ' + to }); return m; }
    m.history.push({ at: at, from: m.state, to: to, note: note }); m.state = to; return m;
  }

  // ev: { id, type, at, residentId, checkId, source, ref }
  function apply(m0, ev) {
    if (!ev || !ev.id) throw new Error('every event needs an id');
    if (m0.seen.indexOf(ev.id) !== -1) return m0;
    var m = clone(m0); m.seen.push(ev.id);
    if (ev.residentId && ev.residentId !== m.residentId) { m.history.push({ at: ev.at, rejected: 'wrong resident' }); return m; }
    switch (ev.type) {
      case 'ready': return move(m, 'ready', ev.at);
      case 'start': return move(m, 'running', ev.at);
      case 'ask_approval': return move(m, 'needs_approval', ev.at);
      case 'approved': return move(m, 'running', ev.at);
      case 'evidence': m.evidence.push({ checkId: ev.checkId, source: ev.source, ref: ev.ref || ev.id, at: ev.at }); return m;
      case 'withdraw_evidence':
        m.evidence = m.evidence.map(function (e) { return e.checkId === ev.checkId && (!ev.ref || e.ref === ev.ref) ? Object.assign({}, e, { withdrawn: true }) : e; });
        if (m.state === 'done' && !assess(m.checks, m.evidence).complete) { m.history.push({ at: ev.at, from: 'done', to: 'verifying' }); m.state = 'verifying'; }
        return m;
      case 'submit':
        if (m.state !== 'verifying') move(m, 'verifying', ev.at);
        if (m.state !== 'verifying') return m;
        var a = assess(m.checks, m.evidence);
        if (a.complete) return move(m, 'done', ev.at, 'all checks have evidence');
        m.history.push({ at: ev.at, waiting_on: a.missing }); return m;
      case 'fail': return move(m, 'failed', ev.at);
      case 'retry': return move(m, 'ready', ev.at);
      default: m.history.push({ at: ev.at, rejected: 'unknown event' }); return m;
    }
  }

  function replay(base, events) { return events.reduce(apply, base); }

  function progress(missions, opts) {
    opts = opts || {};
    var steps = opts.roadSteps || 20, badges = opts.badges || [];
    var ids = {};
    missions.forEach(function (m) { if (m.state === 'done') ids[m.id] = true; });
    var count = Object.keys(ids).length;
    return { count: count, percent: Math.min(100, Math.round(count / steps * 100)),
      badges: badges.filter(function (b) { return count >= b.afterDone; }).map(function (b) { return b.id; }) };
  }

  // Starter missions. Each check names what counts as proof. Residents add proof themselves in v0.
  var TEMPLATES = [
    { template: 'inquiry-reply', title: 'Turn one real inquiry into a reply you approved',
      checks: [
        { id: 'inquiry', label: 'Paste the inquiry you got (a DM, email or form message)', required: true, kind: 'note' },
        { id: 'draft', label: 'Paste the reply your AI drafted', required: true, kind: 'note' },
        { id: 'approved', label: 'You read it and you would send it', required: true, kind: 'click' }
      ] },
    { template: 'ai-instructions', title: 'Give your AI its instructions',
      checks: [
        { id: 'pasted', label: 'Your instructions are in your Claude or ChatGPT project', required: true, kind: 'click' },
        { id: 'first-run', label: 'Paste what your AI answered to "what\'s next"', required: true, kind: 'note' }
      ] },
    { template: 'free-guide', title: 'Make your free guide and one way to get it',
      checks: [
        { id: 'guide', label: 'Paste the link to your one-page free guide', required: true, kind: 'note' },
        { id: 'signup', label: 'You signed up yourself and the guide arrived', required: true, kind: 'click' }
      ] }
  ];

  var BADGES = [
    { id: 'first-mission', label: 'First mission done', afterDone: 1 },
    { id: 'three-missions', label: 'Three missions done', afterDone: 3 }
  ];

  return { TRANSITIONS: TRANSITIONS, assess: assess, create: create, apply: apply, replay: replay, progress: progress, TEMPLATES: TEMPLATES, BADGES: BADGES };
});
