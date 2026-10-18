// Tests for /api/verify-session. Run: npm test
// Stripe is never contacted: global fetch is replaced with a stub. The key below is a throwaway string.

import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/verify-session.js';
import { PAYMENT_LINKS, paymentLinkEntry, calendarFor, CALENDARS } from '../lib/fulfillment.js';

const KEY = 'sk_test_' + 'x'.repeat(40);
const env = { STRIPE_SECRET_KEY: KEY };
const realFetch = globalThis.fetch;

const LINK_60 = 'plink_1URtDBR9ZB06h9S6guTEGj0y'; // getting_started
const LINK_KICKOFF = 'plink_1URtDLR9ZB06h9S6ZLjMJKUA'; // the_basics_founding
const LINK_30 = 'plink_1URtDZR9ZB06h9S6oiKXqYP5'; // quick_fix_30
const LINK_UPLOAD = 'plink_1URtEGR9ZB06h9S6olG84L6G'; // shorts_pack_5
const LINK_DOWNLOAD = 'plink_1URtEKR9ZB06h9S68a7cabC2'; // audio_kit_17

let n = 0;
const sid = (mode = 'test') => `cs_${mode}_` + 'a1B2c3D4e5F6g7H8i9J0'.slice(0, 20) + String(++n).padStart(8, '0');
let ipCounter = 0;
const nextIp = () => `198.51.100.${++ipCounter}`;

function stripeSession(id, over = {}) {
  return {
    id,
    object: 'checkout.session',
    status: 'complete',
    payment_status: 'paid',
    livemode: id.startsWith('cs_live_'),
    payment_link: LINK_60,
    amount_total: 9700,
    currency: 'usd',
    customer_details: { name: 'Dana Whitfield', email: 'dana@example.com' },
    metadata: {},
    line_items: { data: [{ quantity: 1 }] },
    ...over,
  };
}

// Run one request with a stubbed Stripe. Returns { res, calls }.
async function run(id, { session, stripeStatus = 200, throwNetwork = false, host = 'example.test', method = 'POST', body, e = env, ip = nextIp() } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init && init.headers });
    if (throwNetwork) throw new Error('network down');
    return new Response(JSON.stringify(stripeStatus === 200 ? (session ?? stripeSession(id)) : { error: {} }), { status: stripeStatus, headers: { 'content-type': 'application/json' } });
  };
  try {
    const init = { method, headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip } };
    if (method !== 'GET' && method !== 'HEAD') init.body = body !== undefined ? body : JSON.stringify({ s: id });
    const res = await onRequest({ request: new Request(`https://${host}/api/verify-session`, init), env: e });
    return { res, calls };
  } finally {
    globalThis.fetch = realFetch;
  }
}

async function assertNotFound({ res }) {
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not Found');
}

test('a paid session returns the minimum and nothing else', async () => {
  const id = sid();
  const { res, calls } = await run(id);
  assert.equal(res.status, 200);
  const text = await res.text();
  const j = JSON.parse(text);
  assert.deepEqual(Object.keys(j), ['ok', 'offer', 'label', 'fulfillment', 'bookingMinutes', 'quantity', 'unit', 'firstName', 'amountFormatted', 'calendarUrl']);
  assert.equal(j.offer, 'getting_started');
  assert.equal(j.label, 'Getting Started');
  assert.equal(j.fulfillment, 'book_60');
  assert.equal(j.bookingMinutes, 60);
  assert.equal(j.firstName, 'Dana');
  assert.equal(j.amountFormatted, '$97');
  assert.match(j.calendarUrl, /^https:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\/[A-Za-z0-9_-]+/);
  assert.ok(!text.includes(id), 'must not echo the session id');
  assert.ok(!text.includes(KEY), 'must not contain the Stripe key');
  assert.ok(!/dana@example\.com|Whitfield/.test(text), 'must not contain the email or surname');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  // The key goes to api.stripe.com only, as a bearer token, for exactly this session.
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://api.stripe.com/v1/checkout/sessions/${id}?expand%5B%5D=line_items`);
  assert.equal(calls[0].headers.authorization, `Bearer ${KEY}`);
});

test('amounts format as whole dollars or dollars and cents', async () => {
  for (const [cents, want] of [[9700, '$97'], [250000, '$2,500'], [49900, '$499'], [1700, '$17'], [1750, '$17.50']]) {
    const id = sid();
    const { res } = await run(id, { session: stripeSession(id, { amount_total: cents }) });
    assert.equal((await res.json()).amountFormatted, want);
  }
});

test('every fulfillment type is reported, and only booking types get a calendar', async () => {
  const cases = [
    [LINK_KICKOFF, 'the_basics_founding', 'book_60_kickoff', 60, true],
    [LINK_30, 'quick_fix_30', 'book_30', 30, false], // no 30-minute calendar supplied yet, so none is returned
    [LINK_UPLOAD, 'shorts_pack_5', 'upload_no_booking', 0, false],
    [LINK_DOWNLOAD, 'audio_kit_17', 'download_instant', 0, false],
  ];
  for (const [link, offer, fulfillment, minutes, hasCal] of cases) {
    const id = sid();
    const { res } = await run(id, { session: stripeSession(id, { payment_link: link }) });
    assert.equal(res.status, 200, offer);
    const j = await res.json();
    assert.equal(j.offer, offer);
    assert.equal(j.fulfillment, fulfillment);
    assert.equal(j.bookingMinutes, minutes);
    assert.equal(j.calendarUrl !== '', hasCal, offer);
  }
});

test('anything that is not paid and complete is a 404', async () => {
  const bad = [
    { payment_status: 'unpaid' },
    { payment_status: 'no_payment_required' },
    { status: 'open' },
    { status: 'expired' },
    { object: 'payment_intent' },
  ];
  for (const over of bad) {
    const id = sid();
    await assertNotFound(await run(id, { session: stripeSession(id, over) }));
  }
});

test('a session from an unknown or missing payment link is a 404', async () => {
  for (const link of ['plink_1UNotOurs000000000000000', null, undefined, '', 12345]) {
    const id = sid();
    await assertNotFound(await run(id, { session: stripeSession(id, { payment_link: link }) }));
  }
});

test('a session id that does not match the one asked for is a 404', async () => {
  const id = sid();
  await assertNotFound(await run(id, { session: stripeSession(sid()) }));
});

test('session metadata, if present, must agree with the table', async () => {
  const id = sid();
  await assertNotFound(await run(id, { session: stripeSession(id, { metadata: { offer: 'full_playbook' } }) }));
  const id2 = sid();
  const { res } = await run(id2, { session: stripeSession(id2, { metadata: { offer: 'getting_started' } }) });
  assert.equal(res.status, 200);
});

test('test sessions never work on production, live sessions never work on previews, and Stripe is not asked', async () => {
  const t = sid('test');
  const r1 = await run(t, { host: 'bigbreezoe.com' });
  await assertNotFound(r1);
  assert.equal(r1.calls.length, 0);
  const t2 = sid('test');
  const r1b = await run(t2, { host: 'www.bigbreezoe.com' });
  await assertNotFound(r1b);
  assert.equal(r1b.calls.length, 0);
  const l = sid('live');
  const r2 = await run(l, { host: 'example.test' });
  await assertNotFound(r2);
  assert.equal(r2.calls.length, 0);
});

test('a live session on production is a 404 until live Payment Links are added to the table', async () => {
  assert.deepEqual(Object.keys(PAYMENT_LINKS.live), []);
  const l = sid('live');
  await assertNotFound(await run(l, { host: 'bigbreezoe.com', session: stripeSession(l, { payment_link: LINK_60 }) }));
});

test('the test table has no live-looking ids and the lookup ignores inherited keys', () => {
  for (const k of Object.keys(PAYMENT_LINKS.test)) assert.match(k, /^plink_[A-Za-z0-9]+$/);
  assert.equal(paymentLinkEntry('test', '__proto__'), null);
  assert.equal(paymentLinkEntry('test', 'constructor'), null);
  assert.equal(paymentLinkEntry('live', LINK_60), null);
});

test('bad ids, wrong methods and bad bodies are 404 and never reach Stripe', async () => {
  const ids = ['', 'cs_test_', 'cs_test_short', 'pi_test_aaaaaaaaaaaaaaaaaaaaaaaa', 'cs_test_aaaaaaaaaaaaaaaaaaaaaaaa/../x', 'cs_test_aaaaaaaaaaaaaaaaaaaaaaaa?x=1', null, 5, {}];
  for (const id of ids) {
    const r = await run('ignored', { body: JSON.stringify({ s: id }) });
    await assertNotFound(r);
    assert.equal(r.calls.length, 0);
  }
  for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
    const r = await run(sid(), { method });
    await assertNotFound(r);
    assert.equal(r.calls.length, 0);
  }
  for (const body of ['not json', '{"s":', '', 'x'.repeat(5000)]) {
    const r = await run('ignored', { body });
    await assertNotFound(r);
    assert.equal(r.calls.length, 0);
  }
});

test('Stripe says the session does not exist: 404', async () => {
  await assertNotFound(await run(sid(), { stripeStatus: 404 }));
});

test('Stripe or key trouble is a 503 retry, not a 404, so a real buyer is never told the page is gone', async () => {
  for (const stripeStatus of [401, 403, 429, 500, 502]) {
    const { res } = await run(sid(), { stripeStatus });
    assert.equal(res.status, 503, String(stripeStatus));
    assert.deepEqual(await res.json(), { ok: false, retry: true });
  }
  const net = await run(sid(), { throwNetwork: true });
  assert.equal(net.res.status, 503);
});

test('a missing Stripe key is a 503 retry and Stripe is not called', async () => {
  for (const e of [{}, { STRIPE_SECRET_KEY: '' }, { STRIPE_SECRET_KEY: 123 }]) {
    const r = await run(sid(), { e });
    assert.equal(r.res.status, 503);
    assert.equal(r.calls.length, 0);
  }
});

test('the name is cut to a short first word and is plain data', async () => {
  const id = sid();
  const { res } = await run(id, { session: stripeSession(id, { customer_details: { name: '  <img src=x onerror=alert(1)>  Smith' } }) });
  const j = await res.json();
  assert.equal(j.firstName, '<img');
  const id2 = sid();
  const r2 = await run(id2, { session: stripeSession(id2, { customer_details: { name: 'A'.repeat(500) } }) });
  assert.equal((await r2.res.json()).firstName.length, 40);
  const id3 = sid();
  const r3 = await run(id3, { session: stripeSession(id3, { customer_details: null }) });
  assert.equal((await r3.res.json()).firstName, '');
});

test('ten failures from one address block even a good session from that address', async () => {
  const ip = '198.51.100.250';
  for (let i = 0; i < 10; i++) await run('x', { ip, body: '{"s":"nope"}' });
  const r = await run(sid(), { ip });
  await assertNotFound(r);
  assert.equal(r.calls.length, 0);
  const other = await run(sid(), { ip: nextIp() });
  assert.equal(other.res.status, 200);
});

test('calendar config: the 60-minute schedule is a Google appointment page, 30 is empty until supplied', () => {
  assert.match(calendarFor(60), /^https:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\//);
  assert.equal(calendarFor(30), '');
  assert.equal(calendarFor(45), '');
  assert.equal(calendarFor(0), '');
  for (const url of Object.values(CALENDARS)) assert.ok(url === '' || url.startsWith('https://calendar.google.com/'));
});

test('quantity and unit come from the line items, for the offers sold by quantity', async () => {
  const id = sid();
  const { res } = await run(id, { session: stripeSession(id, { payment_link: LINK_UPLOAD, line_items: { data: [{ quantity: 3 }] } }) });
  const j = await res.json();
  assert.equal(j.offer, 'shorts_pack_5');
  assert.equal(j.label, 'Shorts Pack');
  assert.equal(j.quantity, 3);
  assert.equal(j.unit, 'pack');
  const id2 = sid();
  const r2 = await run(id2, { session: stripeSession(id2, { payment_link: 'plink_1URtEDR9ZB06h9S6E93l8sVx', line_items: { data: [{ quantity: 2 }] } }) });
  const j2 = await r2.res.json();
  assert.deepEqual([j2.label, j2.quantity, j2.unit], ['Video or Podcast Edit', 2, 'episode']);
});

test('a missing, malformed or absurd quantity is null, never a guess', async () => {
  for (const line_items of [undefined, null, { data: [] }, { data: [{ quantity: 0 }] }, { data: [{ quantity: 1.5 }] }, { data: [{ quantity: '3' }] }, { data: [{ quantity: 100000 }] }, { data: [null] }]) {
    const id = sid();
    const { res } = await run(id, { session: stripeSession(id, { payment_link: LINK_UPLOAD, line_items }) });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).quantity, null);
  }
});
