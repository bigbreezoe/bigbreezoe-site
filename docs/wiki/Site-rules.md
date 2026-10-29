---
title: Site rules
tags: [wiki, rules, compliance]
---

# Site rules

This is a plain-language summary. The source of truth is [docs/RULES.md](https://github.com/bigbreezoe/bigbreezoe-site/blob/main/docs/RULES.md), and `npm run check` enforces the rules marked there as automatic.

## What every page must do

- **Disclose affiliate links.** A page that links through `/go/` carries an affiliate disclosure on that same page.
- **Name the company.** Terms, Privacy and the home page footer name **Big Breezoe LLC**.
- **Keep links working.** No broken internal links or missing files. Every `/go/<slug>` must exist in `data/links.json`.
- **Keep the refund, terms and privacy wording.** Changes to it need the owner's explicit yes.

## What the site never says or does

- No income guarantees and no dollar-figure earnings claims.
- No review gating, fake urgency, fake scarcity or AI-voice cold-calling language.
- No paid-ads language until the business has had a $1,000 month.
- No tax advice on digital goods; that is a question for a CPA.
- No "I use" or "I tested" for anything not marked as owned or tested. A researched product is "the strong option I'd consider".
- A "Buy now" button with no real checkout is a bug; products stay "Notify me" until the store link is filled in.

## The wording ladder for tools

| Label in `store-config.js` | What the page may say |
|---|---|
| `own` | "I use it" |
| `used` | "I've used it" |
| `research` | "the strong option I'd consider" |

## Unlisted pages

A few pages are meant to be reached only from a private link. They stay out of navigation, the sitemap and search engines. The details are in `docs/RULES.md` (the last rule); do not copy them elsewhere.

Related: [[Home]], [[Ship-a-change]], [[Links-and-affiliates]]
