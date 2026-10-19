// bb-stripe: receives Stripe webhooks, remembers which checkout sessions were really paid,
// and lets the thank-you pages ask "was this session paid?" without trusting the browser.
//
// Routes (all under /api/stripe/):
//   POST /webhook   Stripe calls this. Signature checked. Repeat events ignored.
//   GET  /verify    ?s=cs_...  -> { paid, offer, kind, minutes } . No customer data.
//   GET  /download  ?s=cs_...  -> the audio kit file, only for a paid audio_kit_17 session.
//
// Secrets (Cloudflare only): STRIPE_WEBHOOK_SECRET. Optional: N8N_WEBHOOK_URL.
// Fulfillment never trusts the success redirect alone. A session counts as paid only after a signed webhook.
import { OFFERS } from './offers.js';

const TOLERANCE_SECONDS = 300;
const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
const PAID_TTL = 60 * 60 * 24 * 400; // keep paid records about 13 months
const EVENT_TTL = 60 * 60 * 24 * 30;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d ^= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function verifySignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || !/^\d+$/.test(t)) return false;
  if (Math.abs(nowSeconds - Number(t)) > TOLERANCE_SECONDS) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`)));
  return sigs.some((s) => safeEqual(s, mac));
}

const log = (level, msg, extra = {}) => console.log(JSON.stringify({ level, msg, ...extra }));

async function recordPaid(env, session) {
  const info = OFFERS[session.payment_link];
  if (!info) {
    log('warn', 'unknown_payment_link', { session: session.id, payment_link: session.payment_link });
    return { recorded: false };
  }
  const value = { offer: info.offer, kind: info.kind, minutes: info.minutes, amount: session.amount_total, livemode: !!session.livemode, at: new Date().toISOString() };
  await env.STRIPE_STATE.put(`paid:${session.id}`, JSON.stringify(value), { expirationTtl: PAID_TTL });
  return { recorded: true, value };
}

async function notifyN8n(env, payload) {
  if (!env.N8N_WEBHOOK_URL) return;
  try {
    await fetch(env.N8N_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    log('warn', 'n8n_notify_failed', { error: String(e) });
  }
}

export async function handleWebhook(request, env) {
  const raw = await request.text();
  const ok = await verifySignature(raw, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) {
    log('warn', 'bad_signature');
    return json({ error: 'bad signature' }, 400);
  }
  let event;
  try { event = JSON.parse(raw); } catch { return json({ error: 'bad json' }, 400); }
  if (!event?.id || !event?.type) return json({ error: 'bad event' }, 400);

  const seen = await env.STRIPE_STATE.get(`evt:${event.id}`);
  if (seen) {
    log('info', 'duplicate_event', { id: event.id, type: event.type });
    return json({ received: true, duplicate: true });
  }

  const obj = event.data?.object || {};
  let outcome = 'ignored';
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (obj.payment_status === 'paid') {
      const r = await recordPaid(env, obj);
      outcome = r.recorded ? 'paid_recorded' : 'paid_unknown_offer';
      if (r.recorded) await notifyN8n(env, { event: 'purchase_paid', offer: r.value.offer, kind: r.value.kind, session: obj.id, amount: obj.amount_total, livemode: !!obj.livemode });
    } else {
      outcome = 'completed_not_paid';
    }
  } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
    outcome = 'not_paid';
  } else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    outcome = 'needs_human';
    await env.STRIPE_STATE.put(`alert:${Date.now()}:${event.id}`, JSON.stringify({ type: event.type, charge: obj.id || obj.charge || null }), { expirationTtl: PAID_TTL });
    await notifyN8n(env, { event: 'needs_human', type: event.type, id: event.id });
  }

  await env.STRIPE_STATE.put(`evt:${event.id}`, '1', { expirationTtl: EVENT_TTL });
  log('info', 'event_handled', { id: event.id, type: event.type, outcome });
  return json({ received: true, outcome });
}

async function getPaid(env, s) {
  if (!s || !SESSION_RE.test(s)) return null;
  const v = await env.STRIPE_STATE.get(`paid:${s}`);
  return v ? JSON.parse(v) : null;
}

export async function handleVerify(url, env) {
  const paid = await getPaid(env, url.searchParams.get('s'));
  if (!paid) return json({ paid: false });
  const out = { paid: true, offer: paid.offer, kind: paid.kind, minutes: paid.minutes };
  if (paid.kind === 'download') out.ready = !!(await env.STRIPE_STATE.get('asset:audio-kit', 'arrayBuffer'));
  return json(out);
}

export async function handleDownload(url, env) {
  const paid = await getPaid(env, url.searchParams.get('s'));
  if (!paid || paid.offer !== 'audio_kit_17') return json({ error: 'not found' }, 404);
  const { value, metadata } = await env.STRIPE_STATE.getWithMetadata('asset:audio-kit', 'arrayBuffer');
  if (!value) return json({ error: 'The kit file is not uploaded yet. Email hello@bigbreezoe.com and it will be sent to you.' }, 503);
  return new Response(value, {
    headers: {
      'content-type': metadata?.type || 'application/pdf',
      'content-disposition': `attachment; filename="${metadata?.filename || 'Phone-First-Creator-Audio-Kit.pdf'}"`,
      'cache-control': 'private, no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    try {
      if (path === '/api/stripe/webhook' && request.method === 'POST') return await handleWebhook(request, env);
      if (path === '/api/stripe/verify' && request.method === 'GET') return await handleVerify(url, env);
      if (path === '/api/stripe/download' && request.method === 'GET') return await handleDownload(url, env);
      return json({ error: 'not found' }, 404);
    } catch (e) {
      log('error', 'unhandled', { error: String(e) });
      return json({ error: 'server error' }, 500); // non-2xx makes Stripe retry the webhook
    }
  }
};
