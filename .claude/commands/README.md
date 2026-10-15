# Claude Code commands for bigbreezoe.com

Type these in a Claude Code session opened on this repo. They replace the paused n8n jobs.

## The rule these follow

> **n8n runs only what must fire while Cris is asleep and touches money. Everything read-only, periodic, or needing judgment is a command here.**

n8n executions are capped and cost money — the cap was spent on Oct 9 by pollers checking for work that did not exist. Commands cost nothing, run when Cris runs them, live in git with version history, and can reason about what they find. The seven active n8n workflows (intake, the three Booked & Paid, session-to-plan, error alert, the intake watchdog) are the money loop and belong there. Almost nothing else does.

## Site

| Command | What it does | Replaces (n8n) |
|---|---|---|
| `/site-check` | Full health check: links, disclosures, labels, claims, footer, sitemap. Add `fix` to repair safe issues on a branch. | Link & Disclosure Checker, Site Claims Scanner, Page and Program Check |
| `/add-link <slug> <url> <program> <status> [page] [label]` | Adds or updates a /go/ link and its card with the right label and disclosure. | manual edits |
| `/new-page <path> <purpose>` | Builds a new page from an existing layout, adds it to the sitemap, checks it. | manual edits |
| `/winners` | Weekly /go/ click report and winner/cut list from Cloudflare Analytics. Needs a read-only `CLOUDFLARE_ANALYTICS_TOKEN` secret. | Link Clicks & Winners, Product Winner Detector |

## Business

| Command | What it does | Replaces (n8n) |
|---|---|---|
| `/publish-pack <episode>` | Titles, description with chapters, tags, pinned comment, both Shorts, thumbnail brief, and the pre-publish gate — from the final script. Drafts only. | Publish Pack — Draft |
| `/notion-check [fix]` | Sweeps the ten authority pages for contradictions, stale state and unreconciled decisions. Quotes both sides, never picks silently. | nothing — needs judgment |
| `/weekly` | The Sunday report from primary sources, and the one Scoreboard row. | Sunday Scoreboard, Fleet Watchdog, Weekly Digest, Monday Brief, Sunday State Refresh |
| `/compliance <asset>` | The Compliance Ledger pre-publish gate. PASS / UNCERTAIN / BLOCK per check. | manual |
| `/costs` | Run cost, margin where it can be computed, and the effective hourly rate per offer. | manual |

## Standing rules for every command

- Follow `CLAUDE.md` and `docs/RULES.md`. If a request conflicts with them, say so and stop.
- **None of these deploy to production.** None of them send an email, post anything, or contact a customer.
- A number read from a Notion page is **reported**, not measured. Read the system that owns the number, or write Unknown.
- Never fabricate tool access, a test result, or a completed check.
- Secrets live in the environment or in Cloudflare and GitHub. Never in a file, never in chat.
