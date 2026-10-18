// POST /api/verify-invite   body: { "t": "<token>" }
//
// Success: 200 { "ok": true, "offer": "<key>", "card": { ...that one offer's card } }. The card comes from lib/offers.js,
// which never ships to the browser, so a visitor only ever sees the offer their own token matches. Nothing else is
// returned: not the token, not the signature, not the email, not the secret.
// Every other outcome (wrong method, bad body, bad or expired token, unknown offer, rate limited, missing secret)
// returns the same 404, so a wrong token is indistinguishable from a page that does not exist.
//
// The signing secret comes from env.INVITE_SIGNING_SECRET (a Cloudflare Pages secret). It is never logged.

import { verifyInvite } from '../../lib/invite.js';
import { cardFor } from '../../lib/offers.js';

const WINDOW_MS = 10 * 60 * 1000; // look back 10 minutes
const MAX_FAILS = 10; // this many failures from one IP, then everything from that IP is a 404
const MAX_TRACKED_IPS = 5000; // keep the map from growing without bound
const MAX_BODY_BYTES = 2048;

// Per-isolate memory: this resets when the isolate restarts and is not shared between Cloudflare locations.
// It is a speed bump against guessing, not a wall. The real protection is the 256-bit signature.
const failures = new Map(); // ip -> [timestamp, ...]

const HEADERS = { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' };

function notFound() {
  return new Response('Not Found', { status: 404, headers: HEADERS });
}

function recentFailures(ip, now) {
  const list = (failures.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(ip, list);
  else failures.delete(ip);
  return list.length;
}

function recordFailure(ip, now) {
  const list = (failures.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  failures.set(ip, list);
  if (failures.size > MAX_TRACKED_IPS) failures.delete(failures.keys().next().value);
}

export async function onRequest({ request, env }) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Blocked IPs get a 404 for everything, including a valid token.
  if (recentFailures(ip, now) >= MAX_FAILS) return notFound();

  if (request.method !== 'POST') return notFound();

  if (!env || typeof env.INVITE_SIGNING_SECRET !== 'string' || !env.INVITE_SIGNING_SECRET) {
    console.error('verify-invite: signing secret is not configured'); // says nothing about the secret itself
    return notFound();
  }

  let token;
  try {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_BODY_BYTES) throw new Error('too large');
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new Error('too large');
    token = JSON.parse(text).t;
  } catch {
    recordFailure(ip, now);
    return notFound();
  }

  const invite = await verifyInvite(token, env.INVITE_SIGNING_SECRET, Math.floor(now / 1000));
  if (!invite) {
    recordFailure(ip, now);
    return notFound();
  }

  // No card for this environment (for example production before live links exist) looks exactly like a bad token.
  const card = cardFor(invite.offer, new URL(request.url).hostname);
  if (!card) {
    recordFailure(ip, now);
    return notFound();
  }

  return new Response(JSON.stringify({ ok: true, offer: invite.offer, card }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' },
  });
}
