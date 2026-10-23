// POST /api/stripe-webhook   (called by Stripe, never by a browser)
//
// Checks Stripe's signature, drops events we do not use, and forwards a slim purchase / refund / dispute record to
// one n8n webhook. n8n then updates Customers & Leads and drafts the thank-you email (nothing is sent automatically).
// The checking and slimming is in lib/stripe-webhook.js.
//
// Responses (Stripe only looks at the status):
//   200  handled, ignored, or already handled (duplicate event id)
//   400  bad or missing signature, wrong mode for this host, unreadable body
//   503  configuration or n8n trouble: Stripe retries with backoff for up to three days, which is our retry queue
//
// Secrets (Cloudflare Pages, Preview and Production separately; never in this repo, never logged):
//   STRIPE_WEBHOOK_SECRET   whsec_... from the Stripe webhook endpoint
//   N8N_PURCHASE_WEBHOOK_URL  the n8n Webhook node's production URL
//   N8N_WEBHOOK_SECRET      shared value n8n checks in the x-bb-webhook-secret header
// Optional binding: WEBHOOK_EVENTS (KV). With it, an event id already forwarded is not sent to n8n twice.
// Without it, n8n's own dedupe on eventId is the only guard.

import { modeForHost } from '../../lib/offers.js';
import { verifySignature, slimEvent } from '../../lib/stripe-webhook.js';

const MAX_BODY_BYTES = 256 * 1024;
const DEDUPE_TTL_SECONDS = 7 * 86400;

function reply(status, body = '') {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' } });
}

async function forward(env, payload) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(env.N8N_PURCHASE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-bb-webhook-secret': env.N8N_WEBHOOK_SECRET },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
      console.error(`stripe-webhook: n8n returned ${res.status}`);
      if (res.status < 500 && res.status !== 429) return false; // a 4xx will not get better by retrying now
    } catch {
      console.error('stripe-webhook: could not reach n8n');
    }
  }
  return false;
}

export async function onRequest({ request, env, waitUntil }) {
  if (request.method !== 'POST') return reply(404, 'Not Found');

  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) return reply(400);
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) return reply(400);

  if (!env || !env.STRIPE_WEBHOOK_SECRET) {
    console.error('stripe-webhook: STRIPE_WEBHOOK_SECRET is not configured');
    return reply(503);
  }
  const ok = await verifySignature({ header: request.headers.get('stripe-signature'), rawBody, secret: env.STRIPE_WEBHOOK_SECRET });
  if (!ok) return reply(400);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return reply(400);
  }

  // Same rule as checkout: test events only on preview hosts, live events only on production.
  const hostMode = modeForHost(new URL(request.url).hostname);
  if ((event.livemode === true ? 'live' : 'test') !== hostMode) return reply(400);

  const payload = slimEvent(event);
  if (!payload) return reply(200, 'ignored');

  const kv = env.WEBHOOK_EVENTS;
  const dedupeKey = `stripe:${payload.eventId}`;
  if (kv && (await kv.get(dedupeKey))) return reply(200, 'duplicate');

  if (!env.N8N_PURCHASE_WEBHOOK_URL || !env.N8N_WEBHOOK_SECRET) {
    console.error('stripe-webhook: n8n forwarding is not configured');
    return reply(503);
  }
  if (!(await forward(env, payload))) return reply(503);

  if (kv) {
    const put = kv.put(dedupeKey, '1', { expirationTtl: DEDUPE_TTL_SECONDS });
    if (typeof waitUntil === 'function') waitUntil(put);
    else await put;
  }
  console.log(`stripe-webhook: forwarded ${payload.kind} ${payload.eventId}`); // ids only, no email or name
  return reply(200, 'ok');
}
