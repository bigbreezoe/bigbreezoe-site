---
title: Claude Code commands
tags: [wiki, claude-code, commands]
---

# Claude Code commands

Type these in a Claude Code session opened on this repository. They are defined in `.claude/commands/`.

> **Rule:** automations that must run while nobody is awake and touch money run elsewhere. Everything read-only, periodic or needing judgment is a command here. Commands cost nothing, run when the owner runs them, and live in git with history.

## Site

| Command | What it does |
|---|---|
| `/site-check` | Full health check: links, disclosures, labels, claims, footer, sitemap. Add `fix` to repair safe issues on a branch. |
| `/add-link <slug> <url> <program> <status>` | Adds or updates a `/go/` link and its card with the right label and disclosure. |
| `/new-page <path> <purpose>` | Builds a new page from an existing layout, adds it to the sitemap, and checks it. |
| `/winners` | Weekly `/go/` click report with a winners and cuts list. |

## Business

| Command | What it does |
|---|---|
| `/humanize <script>` | Strips AI-writing tells from a finished script, then verifies nothing important changed. |
| `/publish-pack <episode>` | Titles, description, tags, pinned comment, Shorts and thumbnail brief for an episode. Drafts only. |
| `/notion-check` | Sweeps the Notion authority pages for contradictions and stale state. |
| `/weekly` | The Sunday report, written from primary sources. |
| `/compliance <asset>` | The pre-publish gate. PASS, UNCERTAIN or BLOCK per check. |
| `/costs` | Run cost and the effective hourly rate per offer. |

## Standing rules

- Every command follows `CLAUDE.md` and `docs/RULES.md`. If a request conflicts, it says so and stops.
- None of them deploy to production, send email, post anything or contact a customer.
- A number read from a document is reported, not measured. The system that owns the number is the source.
- Secrets live in the environment, Cloudflare or GitHub. Never in a file or in chat.

Related: [[Site-rules]], [[Ship-a-change]], [[Home]]
