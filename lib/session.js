// Verifying a Stripe Checkout Session, shared by /api/verify-session and /api/download-kit.
//
// Server only. Asks Stripe (with the secret key) whether a session id is a paid session of ours, then returns what the
// pages need. Three outcomes, so a caller can tell "not ours" from "could not tell":
//   { kind: 'ok', data }      a paid, complete session of ours for the right mode
//   { kind: 'notfound' }      anything that is not that (the caller answers with the same 404 as a missing page)
//   { kind: 'retry' }         Stripe or configuration trouble; say nothing about the session either way
//
// The per-IP failure counter lives here so both Functions share it. It is per-isolate memory: a speed bump against
// guessing, not a wall. The real protection is that session ids are unguessable and Stripe is asked every time.

import { modeForHost } from './offers.js';
import { paymentLinkEntry, calendarFor, slotsFor } from './fulfillment.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 10;
const MAX_TRACKED_IPS = 5000;

const failures = new Map(); // ip -> [timestamp, ...]

export const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{20,200}$/;

export function blocked(ip, now = Date.now()) {
  const list = (failures.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(ip, list);
  else failures.delete(ip);
  return list.length >= MAX_FAILS;
}

export function recordFailure(ip, now = Date.now()) {
  const list = (failures.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  failures.set(ip, list);
  if (failures.size > MAX_TRACKED_IPS) failures.delete(failures.keys().next().value);
}

export function money(amountCents, currency) {
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

// First word of the buyer's name, trimmed and capped. Rendered as text only; the pages never treat it as HTML.
function firstNameOf(name) {
  if (typeof name !== 'string') return '';
  return (name.trim().split(/\s+/)[0] || '').slice(0, 40);
}

// Total quantity bought, from the expanded line items. null if Stripe did not give a sensible number.
function quantityOf(session) {
  const items = session && session.line_items && Array.isArray(session.line_items.data) ? session.line_items.data : [];
  let total = 0;
  for (const it of items) {
    if (!it || !Number.isInteger(it.quantity) || it.quantity < 1) return null;
    total += it.quantity;
  }
  return total >= 1 && total <= 999 ? total : null;
}

// Look up one session. Records a failure against `ip` for anything that is "not ours"; the caller does not have to.
export async function checkSession({ id, host, env, ip, now = Date.now(), tag = 'verify-session' }) {
  const m = typeof id === 'string' ? SESSION_ID.exec(id) : null;
  if (!m) {
    recordFailure(ip, now);
    return { kind: 'notfound' };
  }

  // A test session is only honoured on a non-production host, and a live session only on production.
  const mode = modeForHost(host);
  if ((m[1] === 'live') !== (mode === 'live')) {
    recordFailure(ip, now);
    return { kind: 'notfound' };
  }

  if (!env || typeof env.STRIPE_SECRET_KEY !== 'string' || !env.STRIPE_SECRET_KEY) {
    console.error(`${tag}: Stripe key is not configured`); // says nothing about the key itself
    return { kind: 'retry' };
  }

  let res;
  try {
    res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}?expand%5B%5D=line_items`, {
      headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
  } catch {
    console.error(`${tag}: could not reach Stripe`);
    return { kind: 'retry' };
  }

  if (res.status === 404) {
    recordFailure(ip, now);
    return { kind: 'notfound' };
  }
  if (!res.ok) {
    // 401/403 mean a bad key, 429/5xx mean Stripe trouble: none of them says the session is bad.
    console.error(`${tag}: Stripe returned ${res.status}`);
    return { kind: 'retry' };
  }

  let s;
  try {
    s = await res.json();
  } catch {
    return { kind: 'retry' };
  }

  const paid = s && s.object === 'checkout.session' && s.id === id && s.status === 'complete' && s.payment_status === 'paid';
  const sessionMode = s && s.livemode === true ? 'live' : 'test';
  const target = paid && sessionMode === mode ? paymentLinkEntry(mode, s.payment_link) : null;
  // If Stripe did copy the link metadata onto the session, it has to agree with our table.
  const metaOffer = s && s.metadata && typeof s.metadata.offer === 'string' ? s.metadata.offer : null;
  if (!target || (metaOffer && metaOffer !== target.offer)) {
    recordFailure(ip, now);
    return { kind: 'notfound' };
  }

  return {
    kind: 'ok',
    data: {
      ok: true,
      offer: target.offer,
      label: target.label,
      fulfillment: target.fulfillment,
      bookingMinutes: target.bookingMinutes,
      quantity: quantityOf(s),
      unit: target.unit,
      firstName: firstNameOf(s.customer_details && s.customer_details.name),
      amountFormatted: money(s.amount_total, s.currency),
      calendarUrl: target.bookingMinutes ? calendarFor(target.bookingMinutes) : '',
      calendarSlots: target.bookingMinutes ? slotsFor(target.bookingMinutes) : 0,
    },
  };
}
