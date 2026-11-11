// Breezy's AI mode. GET /api/chat -> { "ai": true|false }.  POST /api/chat  body: { "messages": [{ role, content }] } -> { "reply": "..." }.
//
// Off by default: without both env.ANTHROPIC_API_KEY and env.BREEZY_AI === "on" (Cloudflare Pages secrets), GET says
// { ai: false } and the page answers from its own pre-written replies, sending nothing here. When it is on, the page
// tells the visitor first. Any failure returns 503 and the page falls back to the pre-written reply.
// Nothing is stored: no message, no IP, no log line with message text.

import { aiEnabled, cleanMessages, factsFrom, askModel, MAX_BODY_BYTES } from '../../lib/breezy.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ASKS = 20; // per IP per window, per isolate: a speed bump on cost, not a wall
const MAX_TRACKED_IPS = 5000;
const asks = new Map(); // ip -> [timestamp, ...]

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' } });

function overLimit(ip, now) {
  const list = (asks.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_ASKS) { asks.set(ip, list); return true; }
  list.push(now);
  asks.set(ip, list);
  if (asks.size > MAX_TRACKED_IPS) asks.delete(asks.keys().next().value);
  return false;
}

export function onRequestGet({ env }) {
  return json({ ai: aiEnabled(env) });
}

export async function onRequestPost({ request, env }) {
  if (!aiEnabled(env)) return json({ ai: false }, 503);

  // Only this site's own pages may ask.
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (!origin || new URL(origin).host !== url.host) return json({ error: 'forbidden' }, 403);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'too long' }, 413);
  let body = null;
  try { body = JSON.parse(raw); } catch { /* handled below */ }
  const messages = cleanMessages(body);
  if (!messages) return json({ error: 'bad request' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (overLimit(ip, Date.now())) return json({ error: 'slow down' }, 429);

  // The price list comes from the site's own file, never from the browser.
  let facts = '';
  try {
    const res = await env.ASSETS.fetch(new URL('/store/store-config.js', url));
    if (res.ok) facts = factsFrom(await res.text());
  } catch { /* the prompt sends visitors to /store/ when the list is missing */ }

  const reply = await askModel({ key: env.ANTHROPIC_API_KEY, messages, facts });
  return reply ? json({ reply }) : json({ ai: false }, 503);
}
