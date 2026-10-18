// POST /api/verify-session   body: { "s": "<Stripe Checkout Session id>" }
//
// Called by /booked/ after Stripe redirects a buyer there with ?s={CHECKOUT_SESSION_ID}.
// Asks Stripe, with the secret key, whether that session is really paid, then says what to do next.
//
// Success: 200 { ok, offer, label, fulfillment, bookingMinutes, firstName, amountFormatted, calendarUrl }
//   Nothing else: not the session id, email, card details, address, or any Stripe object.
// Not a paid session of ours (bad id, unpaid, expired, wrong mode for this host, unknown payment link, rate limited):
//   404 "Not Found", the same response as a page that does not exist.
// Stripe or configuration trouble (cannot tell either way): 503 { ok: false, retry: true }, so a buyer who
//   really paid is told to try again rather than being shown a 404.
//
// STRIPE_SECRET_KEY is a Cloudflare Pages secret. It is sent only to api.stripe.com and never logged.

import { modeForHost } from '../../lib/offers.js';
import { paymentLinkEntry, calendarFor } from '../../lib/fulfillment.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 10;
const MAX_TRACKED_IPS = 5000;
const MAX_BODY_BYTES = 1024;

// Per-isolate memory, same speed bump as verify-invite. The real protection is that session ids are unguessable.
const failures = new Map(); // ip -> [timestamp, ...]

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{20,200}$/;

function notFound() {
  return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' } });
}

function retryLater() {
  return new Response(JSON.stringify({ ok: false, retry: true }), {
    status: 503,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store', 'retry-after': '30' },
  });
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

function money(amountCents, currency) {
  if (!Number.isInteger(amountCents) || amountCents < 0 || typeof currency !== 'string') return '';
  const whole = amountCents % 100 === 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amountCents / 100);
  } catch {
    return '';
  }
}

// First word of the buyer's name, trimmed and capped. Rendered as text only; the page never treats it as HTML.
function firstNameOf(name) {
  if (typeof name !== 'string') return '';
  const first = name.trim().split(/\s+/)[0] || '';
  return first.slice(0, 40);
}

export async function onRequest({ request, env }) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (recentFailures(ip, now) >= MAX_FAILS) return notFound();
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

  const m = typeof id === 'string' ? SESSION_ID.exec(id) : null;
  if (!m) {
    recordFailure(ip, now);
    return notFound();
  }

  // A test session is only honoured on a non-production host, and a live session only on production.
  const mode = modeForHost(new URL(request.url).hostname);
  if ((m[1] === 'live') !== (mode === 'live')) {
    recordFailure(ip, now);
    return notFound();
  }

  if (!env || typeof env.STRIPE_SECRET_KEY !== 'string' || !env.STRIPE_SECRET_KEY) {
    console.error('verify-session: Stripe key is not configured'); // says nothing about the key itself
    return retryLater();
  }

  let res;
  try {
    res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
      headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
  } catch {
    console.error('verify-session: could not reach Stripe');
    return retryLater();
  }

  if (res.status === 404) {
    recordFailure(ip, now);
    return notFound();
  }
  if (!res.ok) {
    // 401/403 mean a bad key, 429/5xx mean Stripe trouble: none of them says the session is bad.
    console.error(`verify-session: Stripe returned ${res.status}`);
    return retryLater();
  }

  let s;
  try {
    s = await res.json();
  } catch {
    return retryLater();
  }

  const paid = s && s.object === 'checkout.session' && s.id === id && s.status === 'complete' && s.payment_status === 'paid';
  const sessionMode = s && s.livemode === true ? 'live' : 'test';
  const target = paid && sessionMode === mode ? paymentLinkEntry(mode, s.payment_link) : null;
  // If Stripe did copy the link metadata onto the session, it has to agree with our table.
  const metaOffer = s && s.metadata && typeof s.metadata.offer === 'string' ? s.metadata.offer : null;
  if (!target || (metaOffer && metaOffer !== target.offer)) {
    recordFailure(ip, now);
    return notFound();
  }

  const body = {
    ok: true,
    offer: target.offer,
    label: target.label,
    fulfillment: target.fulfillment,
    bookingMinutes: target.bookingMinutes,
    firstName: firstNameOf(s.customer_details && s.customer_details.name),
    amountFormatted: money(s.amount_total, s.currency),
    calendarUrl: target.bookingMinutes ? calendarFor(target.bookingMinutes) : '',
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store' },
  });
}
