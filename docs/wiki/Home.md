---
title: Welcome to the bigbreezoe-site wiki
tags: [wiki, index]
---

# Welcome to the bigbreezoe-site wiki

This is the plain-English guide to **bigbreezoe.com**, the site for Big Breezoe LLC. The site is a static set of pages in `public/`, hosted on Cloudflare Pages (project `bigbreezoe1`). The code and the rules live in the repository; this wiki explains how to work with them.

## Start here

| If you want to... | Read |
|---|---|
| Change a page and put it live | [[Ship-a-change]] |
| Know what the site is not allowed to say or do | [[Site-rules]] |
| Know where each thing lives in the repo | [[Where-things-live]] |
| Add or change an affiliate or outbound link | [[Links-and-affiliates]] |
| Use the slash commands in Claude Code | [[Claude-Code-commands]] |
| Fix a failed deploy or check | [[Troubleshooting]] |

## The short version

1. Work on a branch named `site/<topic>`. Never commit to `main` directly.
2. Run `npm run check`. It must pass before and after your change.
3. Open a pull request. GitHub runs the check and posts a preview link.
4. Look at the preview, then approve. Merging into `main` deploys production.

## What this wiki is not

- It holds no passwords, API keys, customer data or financial details. Those live only in Cloudflare and GitHub secrets.
- It makes no income claims. Nothing on the site promises earnings or results.
- It does not replace the rules file. If this wiki and `docs/RULES.md` ever disagree, the rules file wins.

Related: [[Site-rules]], [[Ship-a-change]], [[Where-things-live]]
