// What the hidden checkout shows for each invite, and where its button goes.
//
// This file runs ONLY on the server (inside the verify-invite Function). It is not in public/, so the browser never
// receives it. The page gets the one card that matches a verified token, never the other three.
//
// Source of truth for the copy, the features and the prices is the Stripe product and price for each offer
// (read from the test-mode account on Oct 18, 2026). Change them there first, then here.
//
// LINKS are environment-keyed by hostname. Production hosts use the LIVE links, which are empty until Cris approves
// the tested path, so production shows nothing rather than a test link. Every other host (Pages previews, local dev)
// uses the TEST links. Payment Links are public URLs; none of this file's contents are secrets.

const WINDOWS = 'Appointments are in Eastern Time: weekdays after 7 PM, weekends 10 AM to 4 PM.';

const CARDS = {
  getting_started: {
    name: 'Getting Started',
    price: '$97',
    billing: 'One-time payment, in US dollars.',
    description:
      'One 60-minute working session, one on one. You bring what is stuck; we fix one of it together while you watch, and you keep what we build. Scoped from your intake answers before we meet, so none of the hour goes to discovery. Includes a written recap of what changed and the next step. This is one session with one working outcome - not a system build and not ongoing support. Accepted by application only.',
    includes: ['60 minutes, one on one', 'One thing working by the end', 'Scoped from your intake before we meet', 'Written recap and next step'],
    duration: '60 minutes, one on one.',
  },
  the_basics_standard: {
    name: 'The Basics',
    price: '$997',
    billing: 'One-time payment, in US dollars.',
    description:
      'A short series that leaves you with a working loop: capture ideas, make the thing, publish on a cadence you can actually hold. Three sessions - a 60-minute kickoff, a 30-minute build review, a 30-minute handoff - with the build done between them, plus 14 days of follow-up questions by email. You get a written guide to everything that was built and full ownership of all of it; nothing stays locked to me. Scoped to what you told me you are willing to do yourself. Accepted by application only.',
    includes: ['Three sessions plus the build between them', 'A capture to publish loop you can sustain', '14 days of follow-up by email', 'Written handoff guide, full ownership'],
    duration: 'Three sessions: a 60-minute kickoff, a 30-minute build review and a 30-minute handoff, with the build between them.',
  },
  the_basics_founding: {
    name: 'The Basics, founding-client rate',
    price: '$499',
    billing: 'One-time payment, in US dollars. Founding-client rate, first five clients.',
    description:
      'A short series that leaves you with a working loop: capture ideas, make the thing, publish on a cadence you can actually hold. Three sessions - a 60-minute kickoff, a 30-minute build review, a 30-minute handoff - with the build done between them, plus 14 days of follow-up questions by email. You get a written guide to everything that was built and full ownership of all of it; nothing stays locked to me. Scoped to what you told me you are willing to do yourself. Accepted by application only.',
    includes: ['Three sessions plus the build between them', 'A capture to publish loop you can sustain', '14 days of follow-up by email', 'Written handoff guide, full ownership'],
    duration: 'Three sessions: a 60-minute kickoff, a 30-minute build review and a 30-minute handoff, with the build between them.',
    note: 'Same scope and delivery as the standard rate. Founding clients agree to one honest feedback conversation after handoff; your rate never depends on what you say in it.',
  },
  full_playbook: {
    name: 'The Full Playbook',
    price: '$2,500',
    billing: 'One-time payment, in US dollars.',
    description:
      'The whole system, built with you: the content architecture, the automation underneath it, and the measurement that tells you what is actually working. Built to be maintained by you rather than by me - every moving part documented, and a handoff that transfers real ownership. Scope, session count and timeline are agreed in writing before any payment, because no two of these are alike. Accepted by application only.',
    includes: ['Content architecture, automation and measurement', 'Documented so you can maintain it', 'Scope agreed in writing before payment'],
    duration: 'Starts with a 60-minute kickoff. Session count and timeline are set out in your acceptance email.',
  },
};

// Stripe Payment Links, test mode. Read from the Stripe account on Oct 18, 2026.
const LINKS = {
  test: {
    getting_started: 'https://buy.stripe.com/test_9B628tcoD1ZMbMsczqefC00',
    the_basics_standard: 'https://buy.stripe.com/test_8x26oJ0FVgUG5o48jaefC01',
    the_basics_founding: 'https://buy.stripe.com/test_5kQ3cx3S7awiaIoeHyefC02',
    full_playbook: 'https://buy.stripe.com/test_7sY5kFbkzfQC8Ag0QIefC03',
  },
  // Live Stripe Payment Links, created Oct 19, 2026 (Managed Payments off). Invite-only: a card shows only after the server
  // verifies a signed invite token, so these are never in the public pages.
  live: {
    getting_started: 'https://buy.stripe.com/3cI9AV2O347U8AgfLCefC0b',
    the_basics_standard: 'https://buy.stripe.com/9B628tgETcEq7wc56YefC0c',
    the_basics_founding: 'https://buy.stripe.com/dRm4gB88n5bYcQwbvmefC0d',
    full_playbook: 'https://buy.stripe.com/aFa6oJcoD8oacQw7f6efC0a',
  },
};

const PRODUCTION_HOSTS = ['bigbreezoe.com', 'www.bigbreezoe.com'];

export function modeForHost(hostname) {
  return PRODUCTION_HOSTS.includes(String(hostname || '').toLowerCase()) ? 'live' : 'test';
}

// The one card for a verified offer, or null if it cannot be shown (unknown offer, or no link for this environment).
export function cardFor(offer, hostname) {
  const card = CARDS[offer];
  const link = LINKS[modeForHost(hostname)][offer];
  if (!card || !link || !/^https:\/\/buy\.stripe\.com\//.test(link)) return null;
  return { ...card, windows: WINDOWS, link };
}
