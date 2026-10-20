// GET /api/download-kit?s=<Stripe Checkout Session id>
//
// Streams the file a paid download offer unlocks (the audio kit PDF, or a product ZIP) to a buyer whose Checkout
// Session is paid. The files are not in public/ and not in git (the repo is public). They live in a private Cloudflare
// KV namespace bound to this project as PRIVATE_FILES (keys in lib/downloads.js), read only here, after the session
// has been checked with Stripe. Each session unlocks only the file for its own offer.
//
// Not a paid download session of ours: 404 "Not Found", the same as a missing page.
// Stripe, binding or file trouble: 503, so a real buyer is told to try again rather than being shown a 404.
//
// Every request is checked again, so a link opened from an email next week works exactly like one opened now.
// Nothing is one-shot, and nothing here creates a URL that outlives the check.

import { blocked, checkSession } from '../../lib/session.js';
import { DOWNLOADS, downloadFor } from '../../lib/downloads.js';

// Kept for the audio kit tests and for anything that still names the kit directly.
export const FILE_KEY = DOWNLOADS.audio_kit_17.key;
export const FILE_NAME = DOWNLOADS.audio_kit_17.name;

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
  // Only download offers unlock a file, and only their own.
  const file = r.data.fulfillment === 'download_instant' ? downloadFor(r.data.offer) : null;
  if (!file) return notFound();

  if (!env || !env.PRIVATE_FILES || typeof env.PRIVATE_FILES.get !== 'function') {
    console.error('download-kit: the PRIVATE_FILES binding is not configured');
    return tryAgain();
  }

  let body;
  try {
    body = await env.PRIVATE_FILES.get(file.key, 'stream');
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
      'content-type': file.type,
      'content-disposition': `attachment; filename="${file.name}"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow, noarchive',
      'x-content-type-options': 'nosniff',
    },
  });
}
