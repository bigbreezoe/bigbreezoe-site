// GET /api/download-kit?s=<Stripe Checkout Session id>
//
// Streams the Phone-First Creator Audio Kit PDF to a buyer whose Checkout Session is paid. The PDF is not in public/
// and not in git (the repo is public). It lives in a private Cloudflare KV namespace bound to this project as
// PRIVATE_FILES, under the key below, and is read only here, after the session has been checked with Stripe.
//
// Not a paid audio-kit session of ours: 404 "Not Found", the same as a missing page.
// Stripe, binding or file trouble: 503, so a real buyer is told to try again rather than being shown a 404.
//
// Every request is checked again, so a link opened from an email next week works exactly like one opened now.
// Nothing is one-shot, and nothing here creates a URL that outlives the check.

import { blocked, checkSession } from '../../lib/session.js';

export const FILE_KEY = 'audio-kit/phone-first-creator-audio-kit.pdf';
export const FILE_NAME = 'Phone-First-Creator-Audio-Kit.pdf';
const OFFER = 'audio_kit_17';

function notFound() {
  return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' } });
}

function tryAgain() {
  return new Response('We could not fetch your download just now. Wait a minute and try again, or write to hello@bigbreezoe.com.', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store', 'retry-after': '30' },
  });
}

export async function onRequest({ request, env }) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (blocked(ip, now)) return notFound();
  if (request.method !== 'GET') return notFound();

  const url = new URL(request.url);
  const r = await checkSession({ id: url.searchParams.get('s'), host: url.hostname, env, ip, now, tag: 'download-kit' });
  if (r.kind === 'retry') return tryAgain();
  if (r.kind !== 'ok') return notFound();
  // A paid session for some other product must not unlock this file.
  if (r.data.offer !== OFFER || r.data.fulfillment !== 'download_instant') return notFound();

  if (!env || !env.PRIVATE_FILES || typeof env.PRIVATE_FILES.get !== 'function') {
    console.error('download-kit: the PRIVATE_FILES binding is not configured');
    return tryAgain();
  }

  let body;
  try {
    body = await env.PRIVATE_FILES.get(FILE_KEY, 'stream');
  } catch {
    console.error('download-kit: could not read the file from storage');
    return tryAgain();
  }
  if (!body) {
    console.error('download-kit: the file is not in storage');
    return tryAgain();
  }

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${FILE_NAME}"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow, noarchive',
      'x-content-type-options': 'nosniff',
    },
  });
}
