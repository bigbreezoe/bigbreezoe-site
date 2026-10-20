// POST /api/verify-session   body: { "s": "<Stripe Checkout Session id>" }
//
// Called by /booked/, /upload/ and /store/audio-kit/download/ after Stripe redirects a buyer with ?s={CHECKOUT_SESSION_ID}.
// The checking itself is in lib/session.js.
//
// Success: 200 { ok, offer, label, fulfillment, bookingMinutes, quantity, unit, firstName, amountFormatted, calendarUrl, calendarSlots, fileKind }
//   Nothing else: not the session id, email, card details, address, or any Stripe object.
// Not a paid session of ours (bad id, unpaid, expired, wrong mode for this host, unknown payment link, rate limited):
//   404 "Not Found", the same response as a page that does not exist.
// Stripe or configuration trouble (cannot tell either way): 503 { ok: false, retry: true }, so a buyer who
//   really paid is told to try again rather than being shown a 404.
//
// STRIPE_SECRET_KEY is a Cloudflare Pages secret. It is sent only to api.stripe.com and never logged.

import { blocked, recordFailure, checkSession } from '../../lib/session.js';

const MAX_BODY_BYTES = 1024;

function notFound() {
  return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' } });
}

function retryLater() {
  return new Response(JSON.stringify({ ok: false, retry: true }), {
    status: 503,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store', 'retry-after': '30' },
  });
}

export async function onRequest({ request, env }) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (blocked(ip, now)) return notFound();
  if (request.method !== 'POST') return notFound();

  let id;
  try {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_BODY_BYTES) throw new Error('too large');
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new Error('too large');
    id = JSON.parse(text).s;
  } catch {
    recordFailure(ip, now);
    return notFound();
  }

  const r = await checkSession({ id, host: new URL(request.url).hostname, env, ip, now });
  if (r.kind === 'retry') return retryLater();
  if (r.kind !== 'ok') return notFound();

  return new Response(JSON.stringify(r.data), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' },
  });
}
