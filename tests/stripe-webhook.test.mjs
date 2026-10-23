// Tests for /api/stripe-webhook. Run: npm test
// Neither Stripe nor n8n is contacted: global fetch is replaced with a stub. Secrets below are throwaway strings.

import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/stripe-webhook.js';
import { sign, verifySignature, parseSignatureHeader, slimEvent } from '../lib/stripe-webhook.js';

const SECRET = 'whsec_' + 'y'.repeat(32);
const N8N = 'https://n8n.example.test/webhook/bb-stripe';
const SHARED = 'z'.repeat(32);
const LINK_60 = 'plink_1URtDBR9ZB06h9S6guTEGj0y'; // getting_started, test mode
const realFetch = globalThis.fetch;

function memoryKv() {
  const m = new Map();
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), size: () => m.size };
}

let n = 0;
function purchaseEvent(over = {}, objOver = {}) {
  return {
    id: `evt_test_${++n}`,
    type: 'checkout.session.completed',
    livemode: false,
    created: 1760000000,
    data: {
      object: {
        id: `cs_test_${'a'.repeat(24)}${n}`,
        object: 'checkout.session',
        payment_status: 'paid',
        payment_link: LINK_60,
        amount_total: 9700,
        currency: 'usd',
        customer_details: { name: 'Dana Whitfield', email: 'Dana@Example.com', address: { line1: '1 Secret St' } },
        consent: null,
        ...objOver,
      },
    },
    ...over,
  };
}

async function run(event, { host = 'feat.bigbreezoe1.pages.dev', env, n8nStatus = 200, n8nThrows = false, badSig = false, t } = {}) {
  const e = env ?? { STRIPE_WEBHOOK_SECRET: SECRET, N8N_PURCHASE_WEBHOOK_URL: N8N, N8N_WEBHOOK_SECRET: SHARED };
  const rawBody = typeof event === 'string' ? event : JSON.stringify(event);
  const ts = t ?? Math.floor(Date.now() / 1000);
  const sig = badSig ? '0'.repeat(64) : await sign(SECRET, ts, rawBody);
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
    if (n8nThrows) throw new Error('down');
    return new Response('', { status: n8nStatus });
  };
  try {
    const request = new Request(`https://${host}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': `t=${ts},v1=${sig}` }, body: rawBody });
    const res = await onRequest({ request, env: e });
    return { res, calls, text: await res.text() };
  } finally {
    globalThis.fetch = realFetch;
  }
}

test('signature: correct, wrong secret, stale, malformed', async () => {
  const body = '{"a":1}';
  const now = 1760000000;
  const good = await sign(SECRET, now, body);
  assert.equal(await verifySignature({ header: `t=${now},v1=${good}`, rawBody: body, secret: SECRET, nowSeconds: now }), true);
  assert.equal(await verifySignature({ header: `t=${now},v1=${good}`, rawBody: body + ' ', secret: SECRET, nowSeconds: now }), false);
  assert.equal(await verifySignature({ header: `t=${now},v1=${good}`, rawBody: body, secret: 'whsec_other', nowSeconds: now }), false);
  assert.equal(await verifySignature({ header: `t=${now},v1=${good}`, rawBody: body, secret: SECRET, nowSeconds: now + 301 }), false);
  assert.equal(await verifySignature({ header: 'nonsense', rawBody: body, secret: SECRET, nowSeconds: now }), false);
  assert.equal(await verifySignature({ header: `t=${now},v1=${good}`, rawBody: body, secret: '', nowSeconds: now }), false);
  assert.deepEqual(parseSignatureHeader(`t=5,v0=abc,v1=${good}`), { t: 5, v1: [good] });
});

test('paid purchase is forwarded slim, with the shared secret and no marketing opt-in', async () => {
  const { res, calls } = await run(purchaseEvent());
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, N8N);
  assert.equal(calls[0].headers['x-bb-webhook-secret'], SHARED);
  const p = calls[0].body;
  assert.equal(p.kind, 'purchase');
  assert.equal(p.offer, 'getting_started');
  assert.equal(p.fulfillment, 'book_60');
  assert.equal(p.email, 'dana@example.com');
  assert.equal(p.firstName, 'Dana');
  assert.equal(p.amountCents, 9700);
  assert.equal(p.promotionsConsent, false);
  assert.ok(!JSON.stringify(p).includes('Secret St'), 'address must not be forwarded');
  assert.ok(!JSON.stringify(p).includes('Whitfield'), 'last name must not be forwarded');
});

test('promotionsConsent is true only for an explicit Stripe opt_in', async () => {
  assert.equal(slimEvent(purchaseEvent({}, { consent: { promotions: 'opt_in' } })).promotionsConsent, true);
  assert.equal(slimEvent(purchaseEvent({}, { consent: { promotions: 'opt_out' } })).promotionsConsent, false);
});

test('unknown payment link is still forwarded as offer "unknown" so Cris is alerted', async () => {
  const { calls } = await run(purchaseEvent({}, { payment_link: 'plink_notours' }));
  assert.equal(calls[0].body.offer, 'unknown');
});

test('unpaid session, unrelated event types are acknowledged and not forwarded', async () => {
  for (const ev of [purchaseEvent({}, { payment_status: 'unpaid' }), purchaseEvent({ type: 'customer.created' })]) {
    const { res, calls, text } = await run(ev);
    assert.equal(res.status, 200);
    assert.equal(text, 'ignored');
    assert.equal(calls.length, 0);
  }
});

test('refund and dispute are forwarded', async () => {
  const refund = { id: 'evt_test_r', type: 'charge.refunded', livemode: false, data: { object: { object: 'charge', id: 'ch_1', amount_refunded: 9700, currency: 'usd', billing_details: { email: 'a@b.co' } } } };
  const dispute = { id: 'evt_test_d', type: 'charge.dispute.created', livemode: false, data: { object: { object: 'dispute', charge: 'ch_1', amount: 9700, currency: 'usd', reason: 'fraudulent' } } };
  assert.equal((await run(refund)).calls[0].body.kind, 'refund');
  assert.equal((await run(dispute)).calls[0].body.kind, 'dispute');
});

test('bad signature and unreadable body are rejected with 400', async () => {
  const bad = await run(purchaseEvent(), { badSig: true });
  assert.equal(bad.res.status, 400);
  assert.equal(bad.calls.length, 0);
  assert.equal((await run('not json')).res.status, 400);
  const stale = await run(purchaseEvent(), { t: Math.floor(Date.now() / 1000) - 3600 });
  assert.equal(stale.res.status, 400);
});

test('test events are refused on production, live events on preview', async () => {
  assert.equal((await run(purchaseEvent(), { host: 'www.bigbreezoe.com' })).res.status, 400);
  assert.equal((await run(purchaseEvent({ livemode: true }))).res.status, 400);
});

test('n8n failure returns 503 so Stripe retries; a 5xx is retried once inline', async () => {
  const down = await run(purchaseEvent(), { n8nStatus: 502 });
  assert.equal(down.res.status, 503);
  assert.equal(down.calls.length, 2);
  const unreachable = await run(purchaseEvent(), { n8nThrows: true });
  assert.equal(unreachable.res.status, 503);
  const rejected = await run(purchaseEvent(), { n8nStatus: 403 });
  assert.equal(rejected.res.status, 503);
  assert.equal(rejected.calls.length, 1);
});

test('missing configuration returns 503 and never forwards', async () => {
  assert.equal((await run(purchaseEvent(), { env: {} })).res.status, 503);
  const noN8n = await run(purchaseEvent(), { env: { STRIPE_WEBHOOK_SECRET: SECRET } });
  assert.equal(noN8n.res.status, 503);
  assert.equal(noN8n.calls.length, 0);
});

test('with WEBHOOK_EVENTS bound, a repeated event id is forwarded once', async () => {
  const kv = memoryKv();
  const env = { STRIPE_WEBHOOK_SECRET: SECRET, N8N_PURCHASE_WEBHOOK_URL: N8N, N8N_WEBHOOK_SECRET: SHARED, WEBHOOK_EVENTS: kv };
  const ev = purchaseEvent();
  const first = await run(ev, { env });
  const second = await run(ev, { env });
  assert.equal(first.calls.length, 1);
  assert.equal(second.calls.length, 0);
  assert.equal(second.text, 'duplicate');
});

test('a failed forward is not marked as handled, so the Stripe retry goes through', async () => {
  const kv = memoryKv();
  const env = { STRIPE_WEBHOOK_SECRET: SECRET, N8N_PURCHASE_WEBHOOK_URL: N8N, N8N_WEBHOOK_SECRET: SHARED, WEBHOOK_EVENTS: kv };
  const ev = purchaseEvent();
  assert.equal((await run(ev, { env, n8nStatus: 500 })).res.status, 503);
  assert.equal(kv.size(), 0);
  assert.equal((await run(ev, { env })).calls.length, 1);
});

test('GET is a plain 404', async () => {
  const res = await onRequest({ request: new Request('https://x.test/api/stripe-webhook'), env: {} });
  assert.equal(res.status, 404);
});
