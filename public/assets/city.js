/* Breezoe City missions page. Reads and writes only the signed-in member's own rows (Supabase row-level security:
   core_missions and core_mission_events). State and progress are folded by BBCore from the events.
   Needs members.js (BBMembers) and core.js (BBCore). */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s) { return doc.querySelector(s); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uuid() { return (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }

  var STATE_WORDS = { planned: 'Not started', ready: 'Ready', running: 'In progress', needs_approval: 'Waiting on your yes', verifying: 'Checking', done: 'Done', failed: 'Stopped' };
  var client = null, user = null, missions = [], busy = false;

  function show(which) {
    ['[data-city-signedout]', '[data-city-locked]', '[data-city-open]', '[data-city-error]'].forEach(function (s) { var n = $(s); if (n) n.hidden = s !== which; });
  }
  function fail(msg) { var n = $('[data-city-error]'); if (n) { n.querySelector('p').textContent = msg; } show('[data-city-error]'); }

  function toCore(ev) { return { id: ev.id, type: ev.type, at: Date.parse(ev.created_at) || 0, checkId: ev.check_id, source: ev.source, ref: ev.id, note: ev.note }; }

  function load() {
    return Promise.all([
      client.from('core_missions').select('id,template,title,checks,created_at').order('created_at', { ascending: true }),
      client.from('core_mission_events').select('id,mission_id,type,check_id,source,note,created_at').order('created_at', { ascending: true })
    ]).then(function (r) {
      if (r[0].error || r[1].error) throw (r[0].error || r[1].error);
      var byMission = {};
      r[1].data.forEach(function (e) { (byMission[e.mission_id] = byMission[e.mission_id] || []).push(e); });
      missions = r[0].data.map(function (row) {
        var evs = byMission[row.id] || [];
        var m = BBCore.replay(BBCore.create({ id: row.id, residentId: user.id, title: row.title, template: row.template, checks: row.checks }), evs.map(toCore));
        m.notes = {}; evs.forEach(function (e) { if (e.type === 'evidence' && e.note) m.notes[e.check_id] = e.note; });
        return m;
      });
      render();
    });
  }

  function addEvents(missionId, events) {
    var rows = events.map(function (e) { return { id: uuid(), mission_id: missionId, user_id: user.id, type: e.type, check_id: e.checkId || null, source: e.source || null, note: e.note || null }; });
    return client.from('core_mission_events').insert(rows).then(function (r) { if (r.error) throw r.error; });
  }

  function start(t) {
    var id = uuid();
    return client.from('core_missions').insert({ id: id, user_id: user.id, template: t.template, title: t.title, checks: t.checks })
      .then(function (r) { if (r.error) throw r.error; return addEvents(id, [{ type: 'ready' }, { type: 'start' }]); });
  }

  function act(fn) {
    if (busy) return; busy = true;
    var msg = $('[data-city-msg]'); if (msg) msg.textContent = 'Saving...';
    Promise.resolve().then(fn).then(load).then(function () { if (msg) msg.textContent = ''; })
      .catch(function () { if (msg) msg.textContent = 'That did not save. Check your connection and try again.'; })
      .then(function () { busy = false; });
  }

  function render() {
    var p = BBCore.progress(missions, { roadSteps: 20, badges: BBCore.BADGES });
    $('[data-city-percent]').textContent = p.percent + '%';
    $('[data-city-bar]').style.width = p.percent + '%';
    $('[data-city-count]').textContent = p.count === 1 ? '1 mission done' : p.count + ' missions done';
    $('[data-city-badges]').innerHTML = p.badges.length ? BBCore.BADGES.filter(function (b) { return p.badges.indexOf(b.id) !== -1; }).map(function (b) { return '<span class="cy-badge">' + esc(b.label) + '</span>'; }).join('') : '';

    var started = {}; missions.forEach(function (m) { started[m.template] = true; });
    $('[data-city-starters]').innerHTML = BBCore.TEMPLATES.filter(function (t) { return !started[t.template]; }).map(function (t, i) {
      return '<div class="cy-card glass"><h3>' + esc(t.title) + '</h3><ul class="cy-checks">' + t.checks.map(function (c) { return '<li>' + esc(c.label) + '</li>'; }).join('') +
        '</ul><button class="btn btn-sm" data-start="' + esc(t.template) + '">Start this mission</button></div>';
    }).join('') || '<p class="note">You started every mission we have so far. New ones come as the City grows.</p>';

    $('[data-city-missions]').innerHTML = missions.map(function (m) {
      var a = BBCore.assess(m.checks, m.evidence);
      var have = {}; m.evidence.forEach(function (e) { if (!e.withdrawn) have[e.checkId] = true; });
      var checks = m.checks.map(function (c) {
        var done = !!have[c.id], body;
        if (done) body = '<span class="cy-ok">Done</span>' + (m.notes[c.id] ? '<div class="cy-note">' + esc(String(m.notes[c.id]).slice(0, 400)) + '</div>' : '');
        else if (m.state === 'done') body = '';
        else if (c.kind === 'note') body = '<textarea rows="3" maxlength="2000" aria-label="' + esc(c.label) + '" data-note="' + esc(m.id) + '|' + esc(c.id) + '"></textarea><button class="btn btn-sm" data-add="' + esc(m.id) + '|' + esc(c.id) + '">Add it</button>';
        else body = '<button class="btn btn-sm" data-yes="' + esc(m.id) + '|' + esc(c.id) + '">Yes, that\'s true</button>';
        return '<li class="' + (done ? 'is-done' : '') + '"><b>' + esc(c.label) + '</b>' + body + '</li>';
      }).join('');
      var foot = m.state === 'done' ? '<p class="cy-done">Done. This counts on your Golden Road.</p>'
        : '<button class="btn btn-sm" data-check="' + esc(m.id) + '"' + (a.complete ? '' : ' disabled') + '>Check my mission</button>' +
          (a.complete ? '' : '<p class="note">' + a.missing.length + ' step' + (a.missing.length === 1 ? '' : 's') + ' to go. A mission only counts when every step has proof.</p>');
      return '<article class="cy-card glass"><div class="mono">' + esc(STATE_WORDS[m.state] || m.state) + '</div><h3>' + esc(m.title) + '</h3><ol class="cy-steps">' + checks + '</ol>' + foot + '</article>';
    }).join('') || '<p class="note">No missions yet. Start one below.</p>';
  }

  doc.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.start) { var t = BBCore.TEMPLATES.filter(function (x) { return x.template === b.dataset.start; })[0]; if (t) act(function () { return start(t); }); }
    if (b.dataset.yes) { var y = b.dataset.yes.split('|'); act(function () { return addEvents(y[0], [{ type: 'evidence', checkId: y[1], source: 'resident_click' }]); }); }
    if (b.dataset.add) {
      var k = b.dataset.add.split('|'), box = doc.querySelector('[data-note="' + b.dataset.add + '"]'), text = box ? box.value.trim() : '';
      if (!text) { if (box) box.focus(); return; }
      act(function () { return addEvents(k[0], [{ type: 'evidence', checkId: k[1], source: 'resident_note', note: text }]); });
    }
    if (b.dataset.check) act(function () { return addEvents(b.dataset.check, [{ type: 'submit' }]); });
  });

  function boot() {
    if (!window.BBMembers || !window.BBCore) return fail('The City did not load. Refresh the page.');
    BBMembers.ready.then(function (ok) {
      if (!ok) return fail('Sign-in is not available right now. Try again soon.');
      function onUser(u) {
        user = u; client = BBMembers.client();
        if (!user) return show('[data-city-signedout]');
        var pilot = BBMembers.pilot();
        var check = pilot ? Promise.resolve(true) : client.from('residencies').select('status').eq('user_id', user.id).maybeSingle()
          .then(function (r) { return !!(r.data && r.data.status === 'active'); });
        check.then(function (open) {
          if (!open) return show('[data-city-locked]');
          show('[data-city-open]');
          return load();
        }).catch(function () { fail('The City could not load your missions. Refresh the page.'); });
      }
      BBMembers.onChange(onUser);
      onUser(BBMembers.user());
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
