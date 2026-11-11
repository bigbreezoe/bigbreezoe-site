import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aiEnabled, cleanMessages, factsFrom, systemPrompt, askModel, MODEL } from '../lib/breezy.js';
import { onRequestGet, onRequestPost } from '../functions/api/chat.js';

const storeConfig = readFileSync(new URL('../public/store/store-config.js', import.meta.url), 'utf8');
const ON = { ANTHROPIC_API_KEY: 'test-key-not-real', BREEZY_AI: 'on' };
const post = (body, headers = { origin: 'https://bigbreezoe.com' }) =>
  new Request('https://bigbreezoe.com/api/chat', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('the AI mode is off unless both the key and the switch are set', () => {
  assert.equal(aiEnabled({}), false);
  assert.equal(aiEnabled({ ANTHROPIC_API_KEY: 'k' }), false);
  assert.equal(aiEnabled({ BREEZY_AI: 'on' }), false);
  assert.equal(aiEnabled(ON), true);
});

test('GET reports the mode and never the key', async () => {
  assert.deepEqual(await onRequestGet({ env: {} }).json(), { ai: false });
  const on = await onRequestGet({ env: ON }).text();
  assert.equal(on, '{"ai":true}');
});

test('POST is refused with 503 while the AI mode is off, so the page uses its own replies', async () => {
  const res = await onRequestPost({ request: post({ messages: [{ role: 'user', content: 'hi' }] }), env: {} });
  assert.equal(res.status, 503);
});

test('POST from another site is refused', async () => {
  const res = await onRequestPost({ request: post({ messages: [{ role: 'user', content: 'hi' }] }, { origin: 'https://evil.example' }), env: ON });
  assert.equal(res.status, 403);
});

test('messages must be a short alternating chat that ends on the visitor', () => {
  assert.equal(cleanMessages(null), null);
  assert.equal(cleanMessages({ messages: [] }), null);
  assert.equal(cleanMessages({ messages: [{ role: 'system', content: 'x' }] }), null);
  assert.equal(cleanMessages({ messages: [{ role: 'user', content: 'x'.repeat(601) }] }), null);
  assert.equal(cleanMessages({ messages: [{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }] }), null);
  assert.equal(cleanMessages({ messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] }), null);
  assert.equal(cleanMessages({ messages: Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'a' })) }), null);
  assert.deepEqual(cleanMessages({ messages: [{ role: 'assistant', content: 'old' }, { role: 'user', content: ' hi ' }] }), [{ role: 'user', content: 'hi' }]);
});

test('the facts come from store-config.js, without checkout addresses or private time targets', () => {
  const facts = factsFrom(storeConfig);
  assert.match(facts, /Shorts pack/);
  assert.match(facts, /price: 49/);
  assert.doesNotMatch(facts, /buy\.stripe\.com/);
  assert.doesNotMatch(facts, /hours:/);
  assert.equal(factsFrom('nothing here'), '');
});

test('the system prompt carries the honesty rules', () => {
  const p = systemPrompt('FACTS HERE');
  assert.match(p, /You are an AI, not Cris/);
  assert.match(p, /no income, earnings or growth claims/);
  assert.match(p, /Never ask for passwords/);
  assert.match(p, /FACTS HERE/);
});

test('askModel sends the key in a header, returns the text, and returns null on failure', async () => {
  let seen;
  const ok = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ content: [{ type: 'text', text: ' Hello. ' }] }), { status: 200 }); };
  const reply = await askModel({ key: 'test-key-not-real', messages: [{ role: 'user', content: 'hi' }], facts: 'f', fetchImpl: ok });
  assert.equal(reply, 'Hello.');
  assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen.init.headers['x-api-key'], 'test-key-not-real');
  const sent = JSON.parse(seen.init.body);
  assert.equal(sent.model, MODEL);
  assert.ok(!seen.init.body.includes('test-key-not-real'));
  assert.equal(await askModel({ key: 'k', messages: [], facts: '', fetchImpl: async () => new Response('no', { status: 500 }) }), null);
  assert.equal(await askModel({ key: 'k', messages: [], facts: '', fetchImpl: async () => { throw new Error('down'); } }), null);
});
