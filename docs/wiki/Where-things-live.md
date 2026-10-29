---
title: Where things live
tags: [wiki, map]
---

# Where things live

```
public/              the site (what gets deployed)
public/assets/       shared CSS and JavaScript (bb.css, bb.js)
public/store/        the store pages and store-config.js
data/links.json      every /go/<slug> outbound or affiliate link (single source)
scripts/             check, redirect builder, layout, local preview
workers/bb-go/       Cloudflare Worker that counts /go/ clicks, then redirects
functions/           Cloudflare Pages Functions (server code for the site)
tests/               unit tests (npm test)
docs/RULES.md        the compliance rules the checker enforces
docs/DEPLOY.md       GitHub and Cloudflare setup, step by step
CLAUDE.md            instructions for Claude Code sessions
```

## Single sources of truth

| What | Where | Never |
|---|---|---|
| Outbound and affiliate links | `data/links.json` | hand-edit `public/_redirects` |
| Store buttons, prices, tool lists | `public/store/store-config.js` | repeat a price by hand on a page |
| Redirect file | built by `npm run redirects` | edit it directly |
| Secrets | Cloudflare and GitHub secrets | put them in the repo, a file or chat |

## Plans and specs

The business plan, specs and the compliance ledger are in Notion (the Big Breezoe Command Center). If code and Notion disagree, stop and ask the owner; do not guess.

Related: [[Home]], [[Links-and-affiliates]], [[Ship-a-change]]
