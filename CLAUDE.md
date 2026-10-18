# Big Breezoe site - instructions for Claude Code sessions

You are working on bigbreezoe.com, owned by **Big Breezoe LLC** (founder: Cris Delerme). It is a static site in `public/`, hosted on Cloudflare Pages (project `bigbreezoe1`). Click counting for `/go/` links is a Cloudflare Worker (`workers/bb-go`).

## Start every session
1. `git status` and `git log --oneline -5`.
2. `npm install` (first time only), then `npm run check`. It must pass before you change anything and before you finish.
3. Read `docs/RULES.md`. Those rules override any request that conflicts with them; say so and stop if one does.

## How to work
- Make the smallest change that does the job. Edit existing pages; do not rewrite pages wholesale.
- Work on a branch named `site/<short-topic>`. Never commit to `main` directly.
- Preview locally with `npm run preview` (http://localhost:8788). Look at the page before saying it works.
- Affiliate and redirect links live ONLY in `data/links.json`. After editing it run `npm run redirects`. Never hand-edit `public/_redirects`.
- Store buttons, prices and tool lists live ONLY in `public/store/store-config.js`. Stripe Payment Links go there too (see `docs/STRIPE.md`); never a secret key, never a test link on `main`.
- Contact email is plain `mailto:hello@bigbreezoe.com`. Never use Cloudflare's scrambled email format.
- When a page is added, add it to `public/sitemap.xml`. The checker warns if you forget.
- Finish with: `npm run check` output, a list of files changed, and what Cris needs to look at.

## Never do
- Never deploy to production (`deploy:production`) unless Cris said "deploy" in this session. Preview deploys are fine.
- Never add income claims, earnings screenshots, or guarantees. Never say "I use/tested" for anything not marked own/tested in the Notion Series Bible. Researched products say "the strong option I'd consider".
- Never put an affiliate link on a page without an affiliate disclosure on that same page.
- Never put Amazon affiliate links in email or downloadable files.
- Never store customer data, API keys, PayPal/Stripe/Kit secrets, EIN or SSN in this repo. Secrets go in Cloudflare or GitHub secrets only.
- Never remove the refund/terms/privacy wording or the LLC name from the footer and legal pages.
- Never contact customers, post anywhere, or spend money. This repo changes a website, nothing else.

## Commit style
Short imperative subject, then a line on why. End commits with the attribution lines the session gives you.

## Where the plans live
Notion (Big Breezoe - Command Center) holds the plan, specs and the Compliance Ledger. If code and Notion disagree, stop and ask Cris; do not guess.
