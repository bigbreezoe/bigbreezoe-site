#!/usr/bin/env node
// Mint an invite link for the hidden checkout.
//
//   INVITE_SIGNING_SECRET=... node scripts/mint-invite.mjs --offer the_basics_founding --email dana@example.com --days 14
//
// Offers: getting_started, the_basics_standard, the_basics_founding, full_playbook
// Options: --days (default 14, 1 to 90), --base (default https://bigbreezoe.com, or INVITE_BASE_URL; use a preview URL to test)
//
// Reads the secret from the environment only. Prints the invite URL and its expiry. Writes nothing to disk and
// never prints the secret. If anything is wrong it exits with an error and prints no URL.

import { OFFERS, newPayload, signInvite } from '../lib/invite.js';

function fail(msg) {
  console.error('mint-invite: ' + msg);
  process.exit(1);
}

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) fail(`unexpected argument "${a}"`);
  const key = a.slice(2);
  const val = argv[i + 1];
  if (val === undefined || val.startsWith('--')) fail(`--${key} needs a value`);
  args[key] = val;
  i++;
}

const secret = process.env.INVITE_SIGNING_SECRET;
if (!secret) fail('INVITE_SIGNING_SECRET is not set in the environment. No invite was created.');
if (secret.length < 32) fail('INVITE_SIGNING_SECRET is shorter than 32 characters. Use `openssl rand -hex 32`. No invite was created.');

if (!args.offer || !OFFERS.includes(args.offer)) fail(`--offer must be one of: ${OFFERS.join(', ')}`);
if (!args.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) fail('--email must be a valid email address');

const days = args.days === undefined ? 14 : Number(args.days);
if (!Number.isFinite(days) || days < 1 || days > 90) fail('--days must be a number from 1 to 90');

const base = (args.base || process.env.INVITE_BASE_URL || 'https://bigbreezoe.com').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) fail('--base must start with http:// or https://');

const payload = newPayload({ offer: args.offer, email: args.email, days });
const token = await signInvite(payload, secret);
const url = `${base}/checkout/?t=${token}`;

const expires = new Date(payload.x * 1000);
const human = expires.toLocaleString('en-US', {
  timeZone: 'America/New_York', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});

console.log(url);
console.log('');
console.log(`Offer:   ${payload.o}`);
console.log(`For:     ${payload.e}`);
console.log(`Expires: ${human} (${expires.toISOString()})`);
