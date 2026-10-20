// Tests for /api/download-kit and for keeping the PDF out of anything public. Run: npm test
// Stripe is stubbed and the "private storage" is an in-memory stand-in. The key below is a throwaway string.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest, FILE_KEY, FILE_NAME } from '../functions/api/download-kit.js';

const KEY = 'sk_test_' + 'y'.repeat(40);
const realFetch = globalThis.fetch;
const KIT_LINK = 'plink_1URtEKR9ZB06h9S68a7cabC2'; // audio_kit_17
const OTHER_LINK = 'plink_1URtDBR9ZB06h9S6guTEGj0y'; // getting_started
const PDF_BYTES = new TextEncoder().encode('%PDF-1.7 test bytes, not the real kit');

let n = 0;
const sid = (mode = 'test') => `cs_${mode}_` + 'Zz9Yy8Xx7Ww6Vv5Uu4Tt'.slice(0, 20) + String(++n).padStart(8, '0');
let ipCounter = 0;
const nextIp = () => `192.0.2.${++ipCounter}`;

function session(id, over = {}) {
  return { id, object: 'checkout.session', status: 'complete', payment_status: 'paid', livemode: id.startsWith('cs_live_'), payment_link: KIT_LINK, amount_total: 1700, currency: 'usd', customer_details: { name: 'Dana' }, metadata: {}, line_items: { data: [{ quantity: 1 }] }, ...over };
}

function storage(present = true) {
  const reads = [];
  return {
    reads,
    async get(key, type) {
      reads.push([key, type]);
      return present && key === FILE_KEY ? new Response(PDF_BYTES).body : null;
    },
  };
}

async function run(id, { sess, stripeStatus = 200, host = 'example.test', method = 'GET', e, ip = nextIp(), query } = {}) {
  const stripeCalls = [];
  globalThis.fetch = async (url) => {
    stripeCalls.push(String(url));
    return new Response(JSON.stringify(stripeStatus === 200 ? sess ?? session(id) : { error: {} }), { status: stripeStatus });
  };
  try {
    const env = e === undefined ? { STRIPE_SECRET_KEY: KEY, PRIVATE_FILES: storage() } : e;
    const q = query !== undefined ? query : id === undefined ? '' : `?s=${encodeURIComponent(id)}`;
    const res = await onRequest({ request: new Request(`https://${host}/api/download-kit${q}`, { method, headers: { 'CF-Connecting-IP': ip } }), env });
    return { res, stripeCalls, env };
  } finally {
    globalThis.fetch = realFetch;
  }
}

async function assertNotFound({ res }) {
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not Found');
}

test('a paid audio kit session gets the PDF with download headers and no caching', async () => {
  const id = sid();
  const { res, env, stripeCalls } = await run(id);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.equal(res.headers.get('content-disposition'), `attachment; filename="${FILE_NAME}"`);
  assert.match(res.headers.get('cache-control'), /no-store/);
  assert.match(res.headers.get('x-robots-tag'), /noindex/);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), PDF_BYTES);
  assert.deepEqual(env.PRIVATE_FILES.reads, [[FILE_KEY, 'stream']]);
  assert.equal(stripeCalls.length, 1);
});

test('it works again and again from the same link: nothing is one-shot, and Stripe is asked every time', async () => {
  const id = sid();
  const e = { STRIPE_SECRET_KEY: KEY, PRIVATE_FILES: storage() };
  for (let i = 0; i < 3; i++) {
    const { res, stripeCalls } = await run(id, { e });
    assert.equal(res.status, 200, `request ${i + 1}`);
    assert.equal(stripeCalls.length, 1);
  }
  assert.equal(e.PRIVATE_FILES.reads.length, 3);
});

test('a paid session for any other product does not unlock the kit, and storage is not touched', async () => {
  const id = sid();
  const r = await run(id, { sess: session(id, { payment_link: OTHER_LINK }) });
  await assertNotFound(r);
  assert.equal(r.env.PRIVATE_FILES.reads.length, 0);
});

test('unpaid, expired, unknown-link and wrong-mode sessions are all 404 and storage is not touched', async () => {
  const cases = [
    (id) => ({ sess: session(id, { payment_status: 'unpaid' }) }),
    (id) => ({ sess: session(id, { status: 'expired' }) }),
    (id) => ({ sess: session(id, { payment_link: 'plink_1UNotOurs000000000000000' }) }),
    (id) => ({ sess: session(id, { payment_link: null }) }),
    () => ({ host: 'bigbreezoe.com' }), // a test session on production
  ];
  for (const make of cases) {
    const id = sid();
    const r = await run(id, make(id));
    await assertNotFound(r);
    assert.equal(r.env.PRIVATE_FILES.reads.length, 0);
  }
  const live = sid('live');
  const r = await run(live, { host: 'example.test' });
  await assertNotFound(r);
  assert.equal(r.stripeCalls.length, 0);
});

test('missing or bad session ids, and any method except GET, are 404 without asking Stripe', async () => {
  for (const q of ['', '?s=', '?s=cs_test_short', '?s=pi_test_aaaaaaaaaaaaaaaaaaaaaaaa', '?x=1']) {
    const r = await run(undefined, { query: q });
    await assertNotFound(r);
    assert.equal(r.stripeCalls.length, 0);
  }
  for (const method of ['POST', 'HEAD', 'PUT', 'DELETE']) {
    const r = await run(sid(), { method });
    await assertNotFound(r);
    assert.equal(r.stripeCalls.length, 0);
  }
});

test('Stripe trouble is a 503 text message, never a 404 and never the file', async () => {
  for (const stripeStatus of [401, 429, 500]) {
    const { res } = await run(sid(), { stripeStatus });
    assert.equal(res.status, 503);
    assert.match(await res.text(), /try again/i);
  }
  const { res } = await run(sid(), { e: { PRIVATE_FILES: storage() } }); // no Stripe key
  assert.equal(res.status, 503);
});

test('a missing binding or a missing file is a 503 and says nothing about storage', async () => {
  for (const e of [{ STRIPE_SECRET_KEY: KEY }, { STRIPE_SECRET_KEY: KEY, PRIVATE_FILES: {} }, { STRIPE_SECRET_KEY: KEY, PRIVATE_FILES: storage(false) }, { STRIPE_SECRET_KEY: KEY, PRIVATE_FILES: { get: async () => { throw new Error('kv down'); } } }]) {
    const { res } = await run(sid(), { e });
    assert.equal(res.status, 503);
    const text = await res.text();
    assert.ok(!/PRIVATE_FILES|kv|storage|\.pdf/i.test(text), text);
  }
});

test('ten failures from one address block even a paid session from that address', async () => {
  const ip = '192.0.2.250';
  for (let i = 0; i < 10; i++) await run(undefined, { ip, query: '?s=nope' });
  const r = await run(sid(), { ip });
  await assertNotFound(r);
  assert.equal(r.stripeCalls.length, 0);
});

// The PDF must never be reachable without a paid session: not in public/, not in git, not named in any public file.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.wrangler') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test('no PDF exists anywhere in the repo, and no public file names the stored file', () => {
  const files = walk(root);
  assert.deepEqual(files.filter((f) => /\.pdf$/i.test(f)), []);
  for (const f of files.filter((f) => f.includes(join(root, 'public')) && /\.(html|js|json|txt|css)$/.test(f))) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!text.includes(FILE_KEY), `${f} names the private file key`);
    assert.ok(!/Audio-Kit\.pdf/i.test(text), `${f} links the PDF`);
  }
});

test('every download offer maps to one private file of its own, and nothing else unlocks a file', async () => {
  const { DOWNLOADS, downloadFor } = await import('../lib/downloads.js');
  const keys = new Set();
  for (const [offer, f] of Object.entries(DOWNLOADS)) {
    assert.ok(!keys.has(f.key), `${offer} shares a storage key`); keys.add(f.key);
    assert.match(f.name, /\.(pdf|zip)$/, offer);
    assert.equal(f.type, f.name.endsWith('.zip') ? 'application/zip' : 'application/pdf', offer);
    assert.doesNotMatch(f.key, /^public\//, offer);
  }
  assert.equal(Object.keys(DOWNLOADS).length, 6);
  for (const bad of ['getting_started', 'working_session_60', '', null, undefined, 'toString', '__proto__']) assert.equal(downloadFor(bad), null, String(bad));
});

test('no product file is ever in public/ or in the repo', () => {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
  const walk = (d) => readdirSync(d).flatMap((n) => { if (['node_modules', '.git', '.wrangler'].includes(n)) return []; const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const bad = walk(repo).filter((p) => /\.(zip|xlsx)$/i.test(p) || /Kit-Builder|Weekly-Operating-System|Prompt-Pack|Intake-Automation|Starter-Bundle/i.test(p) && /\.(pdf|zip)$/i.test(p));
  assert.deepEqual(bad, []);
});
