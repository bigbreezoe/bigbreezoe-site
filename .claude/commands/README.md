# Claude Code commands for bigbreezoe.com

Type these in a Claude Code session opened on this repo. They replace the paused n8n site jobs.

| Command | What it does | Replaces (n8n) |
|---|---|---|
| `/site-check` | Full health check: links, disclosures, labels, claims, footer, sitemap. Add `fix` to repair safe issues on a branch. | Link & Disclosure Checker, Site Claims Scanner, Page and Program Check |
| `/add-link <slug> <url> <program> <status> [page] [label]` | Adds or updates a /go/ link and its card with the right label and disclosure. | manual edits |
| `/new-page <path> <purpose>` | Builds a new page from an existing layout, adds it to the sitemap, checks it. | manual edits |
| `/winners` | Weekly /go/ click report and winner/cut list from Cloudflare Analytics. Needs a read-only `CLOUDFLARE_ANALYTICS_TOKEN` secret. | Link Clicks & Winners, Product Winner Detector |

All commands follow CLAUDE.md and docs/RULES.md. None of them deploy to production.
