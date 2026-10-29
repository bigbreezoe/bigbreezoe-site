---
title: Ship a change
tags: [wiki, workflow, deploy]
---

# Ship a change

Every change goes through a branch and a pull request. Production only changes when a pull request is merged into `main`.

## The steps

1. **Branch.** Name it `site/<short-topic>`, for example `site/episode-5`.
2. **Make the smallest change that does the job.** Edit existing pages; do not rewrite pages wholesale.
3. **Preview locally.** `npm run preview` serves the site at http://localhost:8788. Look at the page before saying it works.
4. **Check.** `npm run check` must pass. `npm run build` rebuilds redirects and shared layout first, then checks.
5. **Open a pull request.** GitHub Actions runs the check and posts a preview link on the pull request.
6. **Look at the preview** on your phone and your computer, then approve.
7. **Merge.** The merge into `main` runs the production job and deploys to Cloudflare Pages.
8. **Hard-refresh** bigbreezoe.com (Ctrl+Shift+R) and look at the live page.

## Commands

```
npm install      # first time only
npm run preview  # local site on http://localhost:8788
npm run check    # links, disclosures, income-claim words, LLC naming, sitemap
npm run redirects # rebuild public/_redirects from data/links.json
npm run build    # redirects + shared layout + check
npm test         # unit tests
```

## Rules of thumb

- Adding a page? Add it to `public/sitemap.xml` too. The checker warns if you forget.
- Never hand-edit `public/_redirects`; it is generated from `data/links.json`.
- Store buttons, prices and tool lists live only in `public/store/store-config.js`.
- Contact email is a plain `mailto:hello@bigbreezoe.com`.
- Never deploy to production by hand unless the owner said to.

## Setting up GitHub and Cloudflare (one time)

The token and secret steps are in [docs/DEPLOY.md](https://github.com/bigbreezoe/bigbreezoe-site/blob/main/docs/DEPLOY.md). Secret values are never written in a file or pasted in chat.

Related: [[Site-rules]], [[Troubleshooting]], [[Where-things-live]]
