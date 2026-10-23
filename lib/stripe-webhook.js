// Checking and slimming Stripe webhook events, used by functions/api/stripe-webhook.js.
//
// Server only. Stripe signs every event with the endpoint's signing secret (STRIPE_WEBHOOK_SECRET, a Cloudflare
// Pages secret). We check that signature on the raw body before reading anything, then pass n8n only the few fields
// it needs. Card details, addresses and the raw Stripe object never leave this file.
//
// Marketing: a purchase never opts anyone into email marketing. `promotionsConsent` is true only when the buyer ticked
// Stripe's own promotional-email checkbox at checkout (consent_collection), and n8n must not tag anyone without it.

import { paymentLinkEntry } from './fulfillment.js';

export const TOLERANCE_SECONDS = 300; // Stripe's default replay window

const enc = new TextEncoder();

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Same-length strings compared without stopping at the first difference.
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Parses "t=123,v1=abc,v1=def,v0=..." into { t, v1: [...] }. null if it is not that shape.
export function parseSignatureHeader(header) {
  if (typeof header !== 'string' || header.length > 2048) return null;
  let t = null;
  const v1 = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === 't' && /^\d{1,12}$/.test(v)) t = Number(v);
    else if (k === 'v1' && /^[0-9a-f]{64}$/.test(v)) v1.push(v);
  }
  return t !== null && v1.length ? { t, v1 } : null;
}

export async function sign(secret, timestamp, rawBody) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`)));
}

// true only for a correctly signed body inside the replay window.
export async function verifySignature({ header, rawBody, secret, nowSeconds = Math.floor(Date.now() / 1000) }) {
  if (typeof secret !== 'string' || !secret) return false;
  const parsed = parseSignatureHeader(header);
  if (!parsed || Math.abs(nowSeconds - parsed.t) > TOLERANCE_SECONDS) return false;
  const expected = await sign(secret, parsed.t, rawBody);
  return parsed.v1.some((v) => safeEqual(v, expected));
}

function firstNameOf(name) {
  if (typeof name !== 'string') return '';
  return (name.trim().split(/\s+/)[0] || '').slice(0, 40);
}

function cleanEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.trim().toLowerCase() : '';
}

// The events n8n hears about. Everything else is acknowledged and dropped.
//   purchase  checkout.session.completed (paid) or checkout.session.async_payment_succeeded
//   refund    charge.refunded
//   dispute   charge.dispute.created
// Returns the slim payload, or null for an event we ignore.
export function slimEvent(event) {
  if (!event || typeof event !== 'object' || typeof event.id !== 'string' || !event.data || !event.data.object) return null;
  const o = event.data.object;
  const mode = event.livemode === true ? 'live' : 'test';
  const base = { eventId: event.id, eventType: event.type, mode, created: Number.isInteger(event.created) ? event.created : null };

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (o.object !== 'checkout.session' || o.payment_status !== 'paid') return null; // async ones arrive again when paid
    const target = paymentLinkEntry(mode, o.payment_link);
    const details = o.customer_details || {};
    return {
      ...base,
      kind: 'purchase',
      sessionId: typeof o.id === 'string' ? o.id : '',
      offer: target ? target.offer : 'unknown', // unknown = not one of our Payment Links; n8n alerts Cris
      label: target && target.label ? target.label : '',
      fulfillment: target ? target.fulfillment : '',
      email: cleanEmail(details.email),
      firstName: firstNameOf(details.name),
      amountCents: Number.isInteger(o.amount_total) ? o.amount_total : null,
      currency: typeof o.currency === 'string' ? o.currency : '',
      promotionsConsent: !!(o.consent && o.consent.promotions === 'opt_in'),
    };
  }

  if (event.type === 'charge.refunded' && o.object === 'charge') {
    return {
      ...base,
      kind: 'refund',
      chargeId: typeof o.id === 'string' ? o.id : '',
      email: cleanEmail(o.billing_details && o.billing_details.email),
      amountCents: Number.isInteger(o.amount_refunded) ? o.amount_refunded : null,
      currency: typeof o.currency === 'string' ? o.currency : '',
    };
  }

  if (event.type === 'charge.dispute.created' && o.object === 'dispute') {
    return {
      ...base,
      kind: 'dispute',
      chargeId: typeof o.charge === 'string' ? o.charge : '',
      amountCents: Number.isInteger(o.amount) ? o.amount : null,
      currency: typeof o.currency === 'string' ? o.currency : '',
      reason: typeof o.reason === 'string' ? o.reason.slice(0, 60) : '',
    };
  }

  return null;
}
