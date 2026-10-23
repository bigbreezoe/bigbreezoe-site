// Signed invite tokens for the hidden checkout.
//
// token = base64url(payload) + "." + base64url(hmac_sha256(payload, INVITE_SIGNING_SECRET))
// payload = compact JSON { o: offer, e: email, x: expiry (unix seconds), n: 6 random hex chars }
//
// Pure Web Crypto, so the same file runs in a Cloudflare Pages Function, in Node 20+ (the mint script)
// and in the tests. No state is stored anywhere: the signature is the whole proof.
//
// Nothing in here reads the environment. The caller passes the secret in, and nothing here logs it.

export const OFFERS = ['getting_started', 'the_basics_standard', 'the_basics_founding', 'full_playbook'];

const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str) {
  if (typeof str !== 'string' || !/^[A-Za-z0-9_-]*$/.test(str)) throw new Error('bad base64url');
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hmacKey(secret, usage) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

// Build a payload. Key order is fixed (o, e, x, n) so a token is easy to read in a debugger.
export function newPayload({ offer, email, days = 14, now = Math.floor(Date.now() / 1000) }) {
  if (!OFFERS.includes(offer)) throw new Error('unknown offer');
  const n = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, '0')).join('');
  return { o: offer, e: String(email).trim().toLowerCase(), x: now + Math.round(days * 86400), n };
}

export async function signInvite(payload, secret) {
  const bytes = enc.encode(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), bytes));
  return b64urlEncode(bytes) + '.' + b64urlEncode(sig);
}

// Returns { offer, email, expires } for a valid, unexpired token, otherwise null.
// The reason for a failure is deliberately not reported: every failure looks the same to the caller.
export async function verifyInvite(token, secret, now = Math.floor(Date.now() / 1000)) {
  try {
    if (typeof token !== 'string' || token.length > 1024 || typeof secret !== 'string' || !secret) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadBytes = b64urlDecode(parts[0]);
    const sig = b64urlDecode(parts[1]);
    // crypto.subtle.verify compares the MACs in constant time. Never compare signatures with ===.
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), sig, payloadBytes);
    if (!ok) return null;
    const p = JSON.parse(dec.decode(payloadBytes));
    if (!p || typeof p !== 'object') return null;
    if (!OFFERS.includes(p.o)) return null;
    if (!Number.isInteger(p.x) || p.x <= now) return null;
    return { offer: p.o, email: typeof p.e === 'string' ? p.e : '', expires: p.x };
  } catch {
    return null;
  }
}
