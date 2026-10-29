---
title: Links and affiliates
tags: [wiki, links, affiliate]
---

# Links and affiliates

Every outbound tool link on the site goes through `/go/<slug>`. A small Cloudflare Worker (`workers/bb-go`) counts the click, then redirects to the real address.

## Add or change a link

1. Edit the slug in `data/links.json` (or run the Claude Code command in [[Claude-Code-commands]]).
2. Run `npm run redirects` to rebuild `public/_redirects`.
3. Run `npm run check`. It confirms the slug exists and the page carries a disclosure.
4. Ship it as in [[Ship-a-change]].

## Swapping in a tracked link later

When an affiliate program approves the account, change only that slug's destination in `data/links.json` to the tracked link, rebuild redirects, and ship. The page itself does not change.

## Rules

- A page with an affiliate link needs an affiliate disclosure on the same page.
- No Amazon affiliate links in email or in downloadable files.
- A commission never decides what is recommended; the labels on the gear page say whether a tool is owned, used, or only researched.
- The Worker has a small set of overrides that must agree with `data/links.json`. Check both when a link seems wrong.

Related: [[Site-rules]], [[Where-things-live]]
