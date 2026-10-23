// Tests for the invite token and /api/verify-invite. Run: npm test
// Uses throwaway secrets generated per run. The real INVITE_SIGNING_SECRET is never read here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { OFFERS, newPayload, signInvite, verifyInvite, b64urlEncode, b64urlDecode } from '../lib/invite.js';
import { onRequest } from '../functions/api/verify-invite.js';
import { cardFor, modeForHost } from '../lib/offers.js';

const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
const SECRET = hex();
const OTHER_SECRET = hex();
const env = { INVITE_SIGNING_SECRET: SECRET };

let ipCounter = 0;
const nextIp = () => `203.0.113.${++ipCounter}`; // documentation range; each test uses its own IP so rate limits never leak between tests

function call(token, { ip = nextIp(), method = 'POST', body, e = env } = {}) {
  const init = { method, headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip } };
  if (method !== 'GET' && method !== 'HEAD') init.body = body !== undefined ? body : JSON.stringify({ t: token });
  return onRequest({ request: new Request('https://example.test/api/verify-invite', init), env: e });
}

async function mint(over = {}, secret = SECRET) {
  const payload = { ...newPayload({ offer: 'getting_started', email: 'Dana@Example.com' }), ...over };
  return signInvite(payload, secret);
}

async function assertNotFound(res) {
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not Found');
}

test('a valid token verifies and returns only ok and offer', async () => {
  const token = await mint();
  const res = await call(token);
  assert.equal(res.status, 200);
  const text = await res.text();
  const body = JSON.parse(text);
  assert.deepEqual(Object.keys(body), ['ok', 'offer', 'card']);
  assert.equal(body.ok, true);
  assert.equal(body.offer, 'getting_started');
  assert.equal(body.card.price, '$97');
  assert.ok(!text.includes(token), 'the response must not echo the token');
  assert.ok(!text.includes(token.split('.')[1]), 'the response must not echo the signature');
  assert.ok(!text.includes(SECRET), 'the response must not contain the secret');
  assert.ok(!/dana@example\.com/i.test(text), 'the response must not contain the email');
});

test('all four offers verify, and the email is lowercased in the payload', async () => {
  for (const offer of OFFERS) {
    const token = await mint({ o: offer });
    const res = await call(token);
    assert.equal(res.status, 200, offer);
    assert.equal((await res.json()).offer, offer);
  }
  const p = newPayload({ offer: 'getting_started', email: '  Dana@Example.COM ' });
  assert.equal(p.e, 'dana@example.com');
  assert.match(p.n, /^[0-9a-f]{6}$/);
});

test('flipping one character of the payload fails with 404', async () => {
  const token = await mint();
  const [payload, sig] = token.split('.');
  const i = Math.floor(payload.length / 2);
  const flipped = payload.slice(0, i) + (payload[i] === 'A' ? 'B' : 'A') + payload.slice(i + 1);
  assert.notEqual(flipped, payload);
  await assertNotFound(await call(`${flipped}.${sig}`));
});

test('flipping one character of the signature fails with 404', async () => {
  const token = await mint();
  const [payload, sig] = token.split('.');
  const i = Math.floor(sig.length / 2);
  const flipped = sig.slice(0, i) + (sig[i] === 'A' ? 'B' : 'A') + sig.slice(i + 1);
  await assertNotFound(await call(`${payload}.${flipped}`));
});

test('an expired token fails with 404', async () => {
  const token = await mint({ x: Math.floor(Date.now() / 1000) - 60 });
  await assertNotFound(await call(token));
});

test('an unknown offer key fails with 404, even when correctly signed', async () => {
  const token = await mint({ o: 'the_audit' });
  await assertNotFound(await call(token));
});

test('a token signed with a different secret fails with 404', async () => {
  const token = await mint({}, OTHER_SECRET);
  await assertNotFound(await call(token));
});

test('every failure is byte-for-byte the same response', async () => {
  const good = await mint();
  const cases = [
    await call(good, { method: 'GET' }),
    await call(good, { method: 'PUT' }),
    await call(null, { body: 'not json' }),
    await call(null, { body: JSON.stringify({}) }),
    await call(null, { body: JSON.stringify({ t: 123 }) }),
    await call('abc'),
    await call('a.b.c'),
    await call(await mint({ x: 1 })),
    await call(await mint({ o: 'nope' })),
    await call(await mint({}, OTHER_SECRET)),
    await call(good, { e: {} }), // secret missing
    await call(good, { e: { INVITE_SIGNING_SECRET: '' } }),
  ];
  const first = cases[0];
  for (const res of cases) {
    assert.equal(res.status, first.status);
    assert.equal(res.headers.get('content-type'), first.headers.get('content-type'));
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(await res.clone().text(), 'Not Found');
  }
});

test('a body larger than 2 KB is rejected', async () => {
  await assertNotFound(await call(null, { body: JSON.stringify({ t: 'x'.repeat(5000) }) }));
});

test('10 failures from one IP block that IP, even for a valid token; other IPs are unaffected', async () => {
  const ip = nextIp();
  for (let i = 0; i < 10; i++) await assertNotFound(await call('bad-token', { ip }));
  const good = await mint();
  await assertNotFound(await call(good, { ip })); // valid, but this IP is blocked
  const other = await call(good, { ip: nextIp() });
  assert.equal(other.status, 200);
});

test('9 failures do not block, and GET requests do not count as failures', async () => {
  const ip = nextIp();
  for (let i = 0; i < 9; i++) await assertNotFound(await call('bad-token', { ip }));
  for (let i = 0; i < 20; i++) await assertNotFound(await call(null, { ip, method: 'GET' }));
  const res = await call(await mint(), { ip });
  assert.equal(res.status, 200);
});

test('verifyInvite checks the expiry against the clock it is given', async () => {
  const now = 1_800_000_000;
  const token = await signInvite({ o: 'getting_started', e: 'a@b.co', x: now + 10, n: 'abc123' }, SECRET);
  assert.ok(await verifyInvite(token, SECRET, now));
  assert.equal(await verifyInvite(token, SECRET, now + 10), null); // expiry is exclusive
  assert.equal(await verifyInvite(token, SECRET, now + 11), null);
});

test('base64url round trips and rejects bad characters', () => {
  const bytes = crypto.getRandomValues(new Uint8Array(37));
  assert.deepEqual(Array.from(b64urlDecode(b64urlEncode(bytes))), Array.from(bytes));
  assert.throws(() => b64urlDecode('abc+/='));
});

// ---- the mint script, run as a real process --------------------------------------------------

const script = fileURLToPath(new URL('../scripts/mint-invite.mjs', import.meta.url));
function runMint(args, envVars) {
  const e = { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, ...envVars };
  return spawnSync(process.execPath, [script, ...args], { env: e, encoding: 'utf8' });
}

test('mint-invite prints a URL whose token the verifier accepts', async () => {
  const r = runMint(['--offer', 'the_basics_founding', '--email', 'dana@example.com', '--days', '14', '--base', 'https://preview.example.test'], { INVITE_SIGNING_SECRET: SECRET });
  assert.equal(r.status, 0, r.stderr);
  const url = r.stdout.split('\n')[0];
  assert.match(url, /^https:\/\/preview\.example\.test\/checkout\/\?t=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const token = new URL(url).searchParams.get('t');
  const v = await verifyInvite(token, SECRET);
  assert.equal(v.offer, 'the_basics_founding');
  assert.equal(v.email, 'dana@example.com');
  const days = (v.expires - Date.now() / 1000) / 86400;
  assert.ok(days > 13.99 && days <= 14.01, `expiry should be about 14 days, got ${days}`);
  assert.ok(!r.stdout.includes(SECRET) && !r.stderr.includes(SECRET), 'the secret must never be printed');
});

test('mint-invite with no secret exits with an error and prints no URL', () => {
  const r = runMint(['--offer', 'getting_started', '--email', 'dana@example.com'], {});
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /INVITE_SIGNING_SECRET is not set/);
});

test('mint-invite rejects a short secret, a bad offer, a bad email and a bad --days', () => {
  const ok = ['--offer', 'getting_started', '--email', 'dana@example.com'];
  assert.equal(runMint(ok, { INVITE_SIGNING_SECRET: 'short' }).status, 1);
  assert.equal(runMint(['--offer', 'free_lunch', '--email', 'dana@example.com'], { INVITE_SIGNING_SECRET: SECRET }).status, 1);
  assert.equal(runMint(['--offer', 'getting_started', '--email', 'not-an-email'], { INVITE_SIGNING_SECRET: SECRET }).status, 1);
  assert.equal(runMint([...ok, '--days', '0'], { INVITE_SIGNING_SECRET: SECRET }).status, 1);
  assert.equal(runMint([...ok, '--days', '9999'], { INVITE_SIGNING_SECRET: SECRET }).status, 1);
  // none of those failures may have printed a URL
  assert.ok(!runMint(ok, { INVITE_SIGNING_SECRET: 'short' }).stdout.includes('/checkout/'));
});

// ---- the card each invite resolves to ------------------------------------------------------------

test('each offer returns only its own card: no other offer price, name or link appears in the response', async () => {
  const prices = { getting_started: '$97', the_basics_standard: '$997', the_basics_founding: '$499', full_playbook: '$2,500' };
  for (const offer of OFFERS) {
    const res = await call(await mint({ o: offer }));
    assert.equal(res.status, 200, offer);
    const text = await res.text();
    const card = JSON.parse(text).card;
    assert.equal(card.price, prices[offer]);
    assert.match(card.link, /^https:\/\/buy\.stripe\.com\/test_/);
    for (const other of OFFERS.filter((o) => o !== offer)) {
      assert.ok(!text.includes(cardFor(other, 'preview.example.test').link), `${offer} response leaked the ${other} link`);
      if (prices[other] !== prices[offer]) assert.ok(!text.includes(`"${prices[other]}"`), `${offer} response leaked the ${other} price`);
    }
    assert.ok(card.windows.includes('Eastern Time'));
  }
});

test('the founding rate never appears in the standard or Getting Started card, and the Playbook price appears only in its own', async () => {
  for (const offer of ['getting_started', 'the_basics_standard', 'full_playbook']) {
    const text = JSON.stringify(cardFor(offer, 'x.test'));
    assert.ok(!text.includes('499') && !text.includes('founding'), `${offer} mentions the founding rate`);
  }
  for (const offer of ['getting_started', 'the_basics_standard', 'the_basics_founding']) {
    assert.ok(!JSON.stringify(cardFor(offer, 'x.test')).includes('2,500'));
  }
});

test('production hosts use only live links; an invalid invite is still a 404 and a test link is never shown on production', async () => {
  assert.equal(modeForHost('bigbreezoe.com'), 'live');
  assert.equal(modeForHost('WWW.bigbreezoe.com'), 'live');
  assert.equal(modeForHost('bigbreezoe1.pages.dev'), 'test');
  assert.equal(modeForHost('127.0.0.1'), 'test');
  const live = OFFERS.map((o) => cardFor(o, 'bigbreezoe.com').link);
  assert.equal(new Set(live).size, 4);
  for (const l of live) assert.match(l, /^https:\/\/buy\.stripe\.com\/(?!test_)[A-Za-z0-9]+$/);
  const request = new Request('https://bigbreezoe.com/api/verify-invite', {
    method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': nextIp() }, body: JSON.stringify({ t: 'not-a-real-token' }),
  });
  await assertNotFound(await onRequest({ request, env }));
});

test('every test link is a buy.stripe.com Payment Link and all four are different', () => {
  const links = OFFERS.map((o) => cardFor(o, 'x.test').link);
  assert.equal(new Set(links).size, 4);
  for (const l of links) assert.match(l, /^https:\/\/buy\.stripe\.com\/test_[A-Za-z0-9]+$/);
});
