# Stripe checkout: how it fits together

Status: built and tested in test mode only. Nothing here is live. No site link points at Stripe yet.

## The customer path

| Offer type | Path |
|---|---|
| Getting Started, The Basics, Full Playbook | Apply (`/start/`, never charges) -> Cris reviews -> Cris sends the offer-specific payment link -> pay -> `/booked/` |
| A la carte services with a call (booking page, intake form, email list, follow-up, one-page site, quick fix, working session) | Buy now -> pay -> `/booked/` (shows the right 30 or 60 minute booking link) |
| A la carte services with files (video edit, Shorts pack) | Buy now -> pay -> `/upload/` (no booking) |
| Phone-First Creator Audio Kit ($17) | Buy now -> pay -> `/store/audio-kit/download/` |

Stripe hosted payment links do the checkout. Stripe sends each customer back to `?s={CHECKOUT_SESSION_ID}` on the right page.

## Why a Worker

A success redirect can be faked by typing the address. So the thank-you pages never trust it. They ask the `bb-stripe` Worker "was this session paid?", and the Worker only says yes after a signed Stripe webhook arrived.

`workers/bb-stripe/worker.js`, routes under `/api/stripe/`:

- `POST /webhook`: checks the Stripe signature (HMAC SHA-256, 5 minute tolerance), ignores repeat events by event id, records paid sessions, flags refunds and disputes for a human, logs every event. Returns an error code on a server problem so Stripe retries.
- `GET /verify?s=cs_...`: returns whether the session was paid, the offer, and the booking length. No customer data.
- `GET /download?s=cs_...`: serves the audio kit file, only for a paid audio kit session.
- `offers.js`: which payment link ID is which offer. Link IDs are not secrets. Live link IDs must be added here when live links are made.

State lives in one KV namespace (`STRIPE_STATE`): handled event ids, paid sessions, the kit file under `asset:audio-kit`.

## What the site config controls (`public/store/store-config.js`)

- `CHECKOUT`: one live payment link per a la carte service. Blank keeps the "Request" button. Filled with a live `https://buy.stripe.com/...` link turns it into "Buy now". Test links (`/test_`) are ignored by the page and rejected by `npm run check`.
- `PRODUCTS["audio-kit"].links.site`: the audio kit buy link. Blank keeps "Notify me".
- `BOOKING.m30`, `BOOKING.m60`, `UPLOAD_URL`: where the thank-you pages send customers. Blank shows an honest email fallback.

## Safety rules enforced by `npm run check`

- No `buy.stripe.com/test_` link anywhere in `public/`.
- Nothing shaped like a Stripe secret key or webhook secret in `public/` or `workers/`.

`npm test` runs the Worker tests (signature good and bad, stale, repeat events, unpaid sessions, wrong offer, kit not uploaded, refund alert).

## What Cris sets up (Claude cannot and must not)

1. Confirm the Stripe account type, payout destination and live mode. Claude only sees test mode.
2. Deploy the Worker from `workers/bb-stripe`. The KV namespace `STRIPE_STATE` is created on the first deploy (no id in the file on purpose). If wrangler asks for an id, create it with `npx wrangler kv namespace create STRIPE_STATE` and add the id to `wrangler.toml`.
3. In Stripe, add a webhook endpoint `https://bigbreezoe.com/api/stripe/webhook` for: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`. Do it once in test mode and once in live mode (each has its own secret).
4. `npx wrangler secret put STRIPE_WEBHOOK_SECRET` with that endpoint's `whsec_` value. Optional: `N8N_WEBHOOK_URL` for a no-personal-data purchase notice.
5. Upload the finished kit file to KV key `asset:audio-kit`.
6. Pick a booking tool that enforces weekdays 7-10 PM ET and weekends 10 AM-4 PM ET with 30 and 60 minute lengths, and an upload destination. Paste them into `BOOKING` and `UPLOAD_URL`.
7. Check Stripe receipts and checkout branding (logo, colors) in the dashboard.

## Test plan (test mode, preview deploy only)

Cris enters the Stripe test card. Claude never types card details.

1. Pay each test link once. Confirm the amount, the receipt, and that the redirect lands on the right page in the confirmed state.
2. Open the thank-you page with a made-up session id and with no id. Both must refuse.
3. Send the same webhook twice (Stripe dashboard "resend"). The second must be ignored.
4. Pay the audio kit link. Confirm the download works only after the kit file is uploaded, and shows the preparing message before.
5. Cancel a checkout and let one expire. Nothing should be recorded as paid.
6. Refund a test payment. A human alert record must appear.
7. Record each result in the Notion Product Checkout, Delivery & Affiliate Verification Register. An offer is READY only with evidence and Cris's explicit approval.

## Go live (only when Cris says so)

Create live products, prices and links from `docs/stripe-live-link-spec.json` (the test ones do not carry over), add their link IDs to `offers.js`, fill `CHECKOUT` and the audio kit link in `store-config.js`, run `npm run check` and `npm test`, preview deploy, Cris approves, then Cris says "deploy".

## Legal wording (applied on this branch Oct 19, 2026, needs Cris's review before merge)

Cris said "make appropriate changes" on Oct 19, which is the explicit yes rule 12 needs. Terms now say payment is by card through Stripe, menu services are paid before the work, The Basics is paid in full before kickoff unless a plan is agreed in writing, and downloads are paid before delivery. Privacy now names Stripe. Both pages show the new date.

One new policy is in the Terms and needs Cris's eyes: menu services follow the same refund rule as sessions, and digital downloads can be refunded within 14 days if the file does not open or is not what the page described. Change the number or the rule in `public/terms.html` if Cris wants something different.

## Live links (created Oct 19, 2026)

All 14 payment links exist in live mode on acct_1UFwi4R9ZB06h9S6. IDs and URLs are in `docs/stripe-live-link-spec.json` (`live_mode_payment_link_id`, `live_mode_url`). `workers/bb-stripe/offers.js` maps the live IDs, and the test IDs are kept so test runs still resolve.

Managed Payments is on by default for the account. Every link was created with `managed_payments.enabled=false`, because Managed Payments makes Stripe the seller of record, does not cover services, and blocks `custom_text` and `invoice_creation`. That setting cannot be changed on an existing link. If the account default is changed later, existing links are not affected.

The live URLs are not on the site yet. `store-config.js` CHECKOUT stays blank until the Worker, the signed webhook and booking are live and Cris approves. Invite-only links (Getting Started, The Basics, The Full Playbook) never go on a public page.
