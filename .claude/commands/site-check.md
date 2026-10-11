---
description: Full site health check (replaces n8n Link & Disclosure Checker, Site Claims Scanner, Page and Program Check). Read-only unless told to fix.
---

Run a full health check of bigbreezoe.com from this repo. Do not change files unless the argument says "fix".

1. `git status`, `git log --oneline -5`, then `npm run check`. Report every error and warning.
2. For every slug in `data/links.json`, request its `to` URL (HEAD, follow redirects). Flag anything that is not 2xx/3xx, or that lands on a "page not found", sign-up or login page instead of a product page.
3. Program status: any page that links `/go/<slug>` where the slug's `status` is not `approved` must use neutral wording (no "affiliate link" claim). List violations.
4. Honesty labels: on `public/gear/`, `public/setup/` and `public/store/store-config.js`, every tool is one of I USE THIS / I'VE USED IT / RESEARCHED. "I use" only for owned/tested items. Researched items say "the strong option I'd consider".
5. Claims: search all HTML for income figures, "guarantee", "passive income", "make $", "per month" near a dollar sign, fake urgency ("only X left", countdowns), review gating. Quote each hit with file and line.
6. Footer and legal: Terms, Privacy and home footer name Big Breezoe LLC; refund wording present; contact is plain `mailto:hello@bigbreezoe.com`.
7. Sitemap: every `index.html` under `public/` is in `public/sitemap.xml`.

Output a short table: check, result (OK / FIX / ASK CRIS), file:line, one-line reason. End with the 3 most important fixes.

If the argument is "fix": make only the fixes that do not need Cris (broken internal links, missing sitemap entries, missing disclosure on a page that already links /go/). Work on a `site/<topic>` branch, run `npm run check`, commit, push. Never touch Terms/Privacy/refund wording, prices, or production deploys.

$ARGUMENTS
