# Stripe checkout: how it is wired and what is left

Status as of Oct 18, 2026: **the site is ready to take Stripe links. No Stripe link is set yet.** Every button still says Request or Notify me. Stripe account connection, Products, Prices and Payment Links are UNVERIFIED and uncreated (Notion: Product Checkout register, Weekly Goals Oct 18).

## How it works

- `public/store/store-config.js` holds one `stripe` slot per product (`links.stripe`) and per Automation & Business Service (`stripe:`).
- Paste a Stripe **Payment Link** (`https://buy.stripe.com/...`). The button changes by itself:
  - product: "Notify me when it opens" becomes "Buy now - $price"
  - service: "Request" becomes "Pay and schedule"
- Anything that is not a `buy.stripe.com` or `checkout.stripe.com` URL is ignored by the page and fails `npm run check`.
- No secret key ever goes in this repo. Payment Links are public. Stripe hosts card entry.

## Never get a Stripe link here

Getting Started, The Basics and The Full Playbook are intake-first: Apply goes to `/start/`, review happens, then a branded payment link is sent by email for the exact offer and price. The checker fails if one of them gets a `stripe` field.

## Readiness matrix (one row per existing offer)

Statuses: Needs scope/pricing / Needs Stripe setup / Needs website connection / Needs test / Ready for approval / Live.

| Offer | Price in site | Path | Intake first | Appointment | Stripe Product + Price + Payment Link | Status |
|---|---|---|---|---|---|---|
| Getting Started | $97 | Apply, review, emailed link | Yes | 60 min | not created (sent by email after review) | Needs Stripe setup |
| The Basics | $997 ($499 founding, first 5) | Apply, review, agreement, emailed link | Yes | kickoff 60 min | not created | Needs Stripe setup. Scope, agreement and fulfillment still draft |
| The Full Playbook | $2,500 (later) | Notify only | Yes | none yet | not created | Needs scope/pricing. Do not activate |
| Working session | $97 | Pay, then schedule | No | 60 min | not created | Needs Stripe setup |
| Quick fix | $49 | Pay, then schedule | No | 30 min | not created | Needs Stripe setup |
| Intake form + auto-reply | $147 | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| Booking page | $97 | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| Email list + welcome emails | $147 | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| Follow-up automation | $197 | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| One-page website | $297 | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| Video or podcast edit | $89 per episode | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| Shorts pack | $49 | Pay, then schedule | No | to confirm | not created | Needs Stripe setup |
| Phone-First Creator Audio Kit | $17 | Buy now, automatic delivery | No | none | not created | Needs Stripe setup. The only active owned product |
| Other five product cards ($12, $19, $27, $47, $59) | listed | Notify only | n/a | none | not created | **Not current inventory** (Oct 16 correction). Decide whether to hide them |

Notion lists the nine service prices as decided Oct 10 and the Oct 16 register asks you to confirm each is still approved. Nothing on the site changed price.

## Steps to turn one on (do it in test mode first)

1. In Stripe (test mode), create a Product with the exact offer name and a one-time Price in USD. Put what is included in the description.
2. Create a Payment Link for that Price. Set the confirmation page to the next step (scheduling link or delivery instructions).
3. Test it: displayed name and price, successful payment, cancel, receipt, and the booking or delivery handoff. Record the evidence in the Notion register.
4. Put the **test** link in `store-config.js` on a branch for a preview only. `npm run check` warns that it is a test link.
5. When Cris approves the tested path, create the same link in live mode, swap it in, run `npm run check`, and merge.

## Still needed from Cris

- Stripe account and payout readiness verified in the real account.
- Scheduling tool that enforces weekdays after 7 PM ET and weekends 10 AM to 4 PM ET, and a confirmed appointment length for each fixed-scope service.
- Terms and refund wording for pay-first services (Terms changes need Cris's explicit yes, RULES 12).
