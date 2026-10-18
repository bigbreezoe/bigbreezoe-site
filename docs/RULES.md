# Site rules (enforced by `npm run check` where marked [auto])

1. [auto] Every page that links through `/go/` carries an affiliate disclosure on the same page (FTC endorsement rules).
2. [auto] No income guarantees or dollar-figure earnings claims. "Guaranteed income" may appear only when negated ("not for anyone looking for...").
3. [auto] Every `/go/<slug>` used on a page must exist in `data/links.json`.
4. [auto] No broken internal links or missing assets.
5. [auto] Terms, Privacy and the home page footer name **Big Breezoe LLC**.
6. [auto] Tools in `store-config.js` are marked `kind: "own"` (I use it), `kind: "used"` (I've used it) or `kind: "research"` (researched, not used). Nothing else.
7. Wording ladder: OWNED/TESTED -> "I use". RESEARCHED -> "the strong option I'd consider". Never the reverse.
8. No review gating, no fake urgency, no fake scarcity, no AI-voice cold calling language.
9. Paid-ads language is out until the business has a $1,000 month.
10. Product pages stay "Notify me" until the store link is filled in `store-config.js`. A "Buy now" button with no real checkout is a bug.
11. Georgia sales tax on digital goods is a CPA question; do not state tax treatment on the site.
12. Any change to Terms, Privacy or refund wording needs Cris's explicit yes.
13. [auto] Stripe checkout links live only in `store-config.js` and must be `buy.stripe.com` or `checkout.stripe.com` URLs. Getting Started, The Basics and The Full Playbook are intake-first: Apply goes to `/start/` and never charges, so they get no Stripe link. A Stripe test-mode link is for a preview only and never ships to `main`. A live link goes in only after Cris approves the tested path (Oct 16 handoff).
