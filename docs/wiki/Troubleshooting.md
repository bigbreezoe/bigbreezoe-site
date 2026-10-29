---
title: Troubleshooting
tags: [wiki, troubleshooting, deploy]
---

# Troubleshooting

## Deploy and check failures

| What you see | What to do |
|---|---|
| `Invalid access token [code: 9109]` | The Cloudflare token is wrong or revoked. Make a new one and update the GitHub secret (steps in [docs/DEPLOY.md](https://github.com/bigbreezoe/bigbreezoe-site/blob/main/docs/DEPLOY.md)). |
| `Authentication error [code: 10000]` | The token lacks Cloudflare Pages Edit on this account. Recreate it with that permission. |
| `Could not find project bigbreezoe1` | The `CLOUDFLARE_ACCOUNT_ID` secret is wrong. Fix it in GitHub. |
| The `check` job failed | Open the log and read the ERROR line, or run `/site-check fix` in Claude Code. |
| GitHub email: "credential was revoked" | A token was pasted somewhere public. Replace it and find the paste. |
| Redirects file out of date | Run `npm run redirects` and commit the result. CI fails if it differs. |

## Pages look wrong after a merge

- Hard-refresh (Ctrl+Shift+R). The CSS and JavaScript are versioned, but a cached page can lag.
- Run `npm run build` locally; it restamps asset versions across pages.

## A failing "Workers Builds" check on a pull request

That check comes from a Worker connected to the repository in the Cloudflare dashboard, not from the repository's own `site` workflow. Read its build log in Cloudflare (Workers & Pages, the Worker, Builds). The site check and preview jobs are the ones that gate the site.

## Secrets

Never paste a key, token or password into a file, a pull request or a chat. If one leaks, rotate it first.

Related: [[Ship-a-change]], [[Site-rules]], [[Home]]
