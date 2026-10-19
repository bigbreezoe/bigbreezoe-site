import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { verifySignature } from './worker.js';

const SECRET = 'whsec_test_secret_for_unit_tests';
const kv = () => {
  const m = new Map();
  return {
    m,
    get: async (k) => m.get(k)?.v ?? null,
    put: async (k, v, o) => { m.set(k, { v, o }); },
    getWithMetadata: async (k) => ({ value: m.get(k)?.v ?? null, metadata: m.get(k)?.meta ?? null })
  };
};
const sign = async (body, t = Math.floor(Date.now() / 1000), secret = SECRET) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${t},v1=${mac}`;
};
const post = async (env, event, headerOverride) => {
  const body = JSON.stringify(event);
  const sig = headerOverride ?? (await sign(body));
  return worker.fetch(new Request('https://bigbreezoe.com/api/stripe/webhook', { method: 'POST', body, headers: { 'stripe-signature': sig } }), env);
};
const SESSION = 'cs_test_a1B2c3D4e5F6g7H8';
const paidEvent = (id = 'evt_1', plink = 'plink_1URtDUR9ZB06h9S6XK4zO3BL') => ({
  id, type: 'checkout.session.completed',
  data: { object: { id: SESSION, payment_status: 'paid', payment_link: plink, amount_total: 9700, livemode: false } }
});

test('signature: good, bad, stale, missing secret', async () => {
  const body = '{"a":1}';
  assert.equal(await verifySignature(body, await sign(body), SECRET), true);
  assert.equal(await verifySignature(body, await sign(body, undefined, 'whsec_wrong'), SECRET), false);
  assert.equal(await verifySignature(body, await sign(body, 1000), SECRET), false);
  assert.equal(await verifySignature(body, await sign(body), ''), false);
  assert.equal(await verifySignature(body, null, SECRET), false);
  assert.equal(await verifySignature(body + ' ', await sign(body), SECRET), false);
});

test('bad signature is rejected and nothing is stored', async () => {
  const env = { STRIPE_STATE: kv(), STRIPE_WEBHOOK_SECRET: SECRET };
  const res = await post(env, paidEvent(), 't=1,v1=deadbeef');
  assert.equal(res.status, 400);
  assert.equal(env.STRIPE_STATE.m.size, 0);
});

test('paid session is recorded, verify works, repeat event is ignored', async () => {
  const env = { STRIPE_STATE: kv(), STRIPE_WEBHOOK_SECRET: SECRET };
  const r1 = await post(env, paidEvent());
  assert.equal(r1.status, 200);
  assert.equal((await r1.json()).outcome, 'paid_recorded');
  const v = await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/verify?s=${SESSION}`), env);
  assert.deepEqual(await v.json(), { paid: true, offer: 'working_session_60', kind: 'book', minutes: 60 });
  const r2 = await post(env, paidEvent());
  assert.equal((await r2.json()).duplicate, true);
});

test('unpaid or unknown sessions are never verified', async () => {
  const env = { STRIPE_STATE: kv(), STRIPE_WEBHOOK_SECRET: SECRET };
  const unpaid = paidEvent('evt_2'); unpaid.data.object.payment_status = 'unpaid';
  assert.equal((await (await post(env, unpaid)).json()).outcome, 'completed_not_paid');
  const unknown = paidEvent('evt_3', 'plink_NOPE');
  assert.equal((await (await post(env, unknown)).json()).outcome, 'paid_unknown_offer');
  for (const s of [SESSION, 'cs_test_zzzzzzzzzzzz', 'bad', '']) {
    const v = await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/verify?s=${s}`), env);
    assert.deepEqual(await v.json(), { paid: false });
  }
});

test('download only for a paid audio kit session', async () => {
  const env = { STRIPE_STATE: kv(), STRIPE_WEBHOOK_SECRET: SECRET };
  await post(env, paidEvent('evt_4', 'plink_1URtDUR9ZB06h9S6XK4zO3BL'));
  let res = await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/download?s=${SESSION}`), env);
  assert.equal(res.status, 404); // paid, but for a different offer
  const env2 = { STRIPE_STATE: kv(), STRIPE_WEBHOOK_SECRET: SECRET };
  await post(env2, paidEvent('evt_5', 'plink_1URtEKR9ZB06h9S68a7cabC2'));
  res = await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/download?s=${SESSION}`), env2);
  assert.equal(res.status, 503); // paid, file not uploaded yet
  let ver = await (await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/verify?s=${SESSION}`), env2)).json();
  assert.equal(ver.ready, false);
  env2.STRIPE_STATE.m.set('asset:audio-kit', { v: new TextEncoder().encode('PDF').buffer, meta: { type: 'application/pdf' } });
  res = await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/download?s=${SESSION}`), env2);
  assert.equal(res.status, 200);
  ver = await (await worker.fetch(new Request(`https://bigbreezoe.com/api/stripe/verify?s=${SESSION}`), env2)).json();
  assert.equal(ver.ready, true);
  assert.match(res.headers.get('content-disposition'), /attachment/);
});

test('refund and dispute events raise a human alert', async () => {
  const env = { STRIPE_STATE: kv(), STRIPE_WEBHOOK_SECRET: SECRET };
  const res = await post(env, { id: 'evt_6', type: 'charge.refunded', data: { object: { id: 'ch_1' } } });
  assert.equal((await res.json()).outcome, 'needs_human');
  assert.ok([...env.STRIPE_STATE.m.keys()].some((k) => k.startsWith('alert:')));
});
