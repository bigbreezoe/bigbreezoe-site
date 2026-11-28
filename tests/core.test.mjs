// Breezoe Core v0 (public/assets/core.js): missions only count when every step has proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
// Load it the way the browser does: a plain script that sets self.BBCore.
const sandbox = { self: {} };
vm.runInNewContext(readFileSync(new URL('../public/assets/core.js', import.meta.url), 'utf8'), sandbox);
const C = sandbox.self.BBCore;

const checks = [{ id: 'draft', required: true }, { id: 'approved', required: true }];
const base = () => C.create({ id: 'm1', residentId: 'r1', title: 'Inquiry to reply', checks });
const walk = [{ id: '1', type: 'ready' }, { id: '2', type: 'start' }];

test('done only with proof for every step', () => {
  let m = C.replay(base(), [...walk, { id: '3', type: 'evidence', checkId: 'draft', source: 'resident_note' }, { id: '4', type: 'submit' }]);
  assert.equal(m.state, 'verifying');
  m = C.replay(m, [{ id: '5', type: 'evidence', checkId: 'approved', source: 'resident_click' }, { id: '6', type: 'submit' }]);
  assert.equal(m.state, 'done');
});

test('a model saying done is not proof', () => {
  assert.equal(C.assess(checks, [{ checkId: 'draft', source: 'model_claim' }, { checkId: 'approved', source: 'model_claim' }]).complete, false);
});

test('a repeated event changes nothing', () => {
  const m = C.replay(base(), [...walk, ...walk]);
  assert.equal(m.state, 'running');
  assert.equal(m.seen.length, 2);
});

test("another Resident's event is rejected", () => {
  assert.equal(C.apply(base(), { id: 'x', type: 'ready', residentId: 'r2' }).state, 'planned');
});

test('withdrawn proof takes back the award', () => {
  let m = C.replay(base(), [...walk, { id: '3', type: 'evidence', checkId: 'draft', source: 'resident_note' },
    { id: '4', type: 'evidence', checkId: 'approved', source: 'resident_click' }, { id: '5', type: 'submit' }]);
  assert.equal(C.progress([m]).count, 1);
  m = C.apply(m, { id: '6', type: 'withdraw_evidence', checkId: 'approved' });
  assert.equal(m.state, 'verifying');
  assert.equal(C.progress([m]).count, 0);
});

test('progress and badges come from done missions only, once each', () => {
  const r = C.progress([{ id: 'a', state: 'done' }, { id: 'a', state: 'done' }, { id: 'b', state: 'running' }], { roadSteps: 4, badges: C.BADGES });
  assert.equal(r.count, 1);
  assert.equal(r.percent, 25);
  assert.deepEqual([...r.badges], ['first-mission']); // copy: the array comes from the script's own realm
});

test('every starter mission has required steps with labels', () => {
  for (const t of C.TEMPLATES) {
    assert.ok(t.template && t.title && t.checks.length > 0);
    for (const c of t.checks) assert.ok(c.id && c.label && ['note', 'click'].includes(c.kind));
  }
});
