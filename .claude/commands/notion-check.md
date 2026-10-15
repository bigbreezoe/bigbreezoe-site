---
description: Sweep the Notion authority pages for contradictions, stale state and unreconciled decisions. Read-only unless told to fix. This is the check that catches the failure that keeps coming back.
---

Find where Big Breezoe's own pages disagree with each other, and where a page claims something that is no longer true. **Read-only unless the argument says "fix".**

The recurring failure is not missing documentation. It is that a fix gets written as a *new section* instead of an edit to the old one, so both survive and disagree. On Oct 14 the Series Bible contradicted itself inside one hour.

## 1. Fetch the ten authority pages

From the Command Center's "One authority per domain" table:

| Domain | Page ID |
|---|---|
| Strategy | `3f4ea658e0738176919cef5435e1a587` |
| Sequence | `3ebea658e0738185b1e1d97d22520b12` |
| Rules | `3e4ea658e07381889915dcbaa4e3cecb` |
| Continuity | `3e6ea658e07381d2a635d6703a4c0387` |
| Compliance | `3d6ea658e073812cb603fdb2bf614e93` |
| Money | `3f5ea658e0738104b4c2f98d37701bb4` |
| Offers | `3d5ea658e07381a481ebc372122a2aa1` |
| Live state | `3d6ea658e0738100ab15eb3c141fab48` |
| Review questions | `3f8ea658e07381ec8530d0146c8072da` |
| Execution | `3faea658e0738164b054ed3cd2e07083` |
| **Production and editing** | `3eeea658e07381a7b43ddd3ebfb278cd` |

The Editing Bible is the eleventh. It is **not** in the Command Center's own
authority table, which is why four competing retention pages coexisted until
Oct 15 without tripping anything. Sweep it as an authority regardless.

The Master Playbook is large; save it to a file and read it in chunks rather than truncating it.

## 2. Check these first, because they have all happened

1. **Does any page disagree with itself?** A new banner at the top saying one thing while a table further down says another.
2. **Which script version is current for the next episode?** Series Bible, Production Package and Command Center must agree.
3. **Episode length:** 8–12 minutes is the standard (Cris, Oct 14). Flag any page still saying 6–8.
4. **Offer names and prices.** The same offer must have one name and one price everywhere, including inside the live Tally intake form's answer options.
5. **Anything called "live", "approved" or "ready"** that has not been checked in the same session. Never repeat a live claim from a page; check it.
6. **Open contradictions carried from the last review** — read the most recent review page and the gap analysis, and say for each whether it is now closed, still open, or newly broken.

## 3. Check the pages against reality, not against each other

- Site claims: run `/site-check` and fold its findings in.
- n8n claims: list workflows and their active state, and the most recent execution. Compare with what the pages say.
- Any count, date or status: name the primary source you read it from, and when.

## 4. Output

A table: **contradiction · page A quote · page B quote · which is right, or "founder decides" · the one edit that closes it.**

Then three lines: the contradiction a customer could see today, the oldest unresolved one with its age in days, and the single edit with the most downstream effect.

**Never silently pick a winner between two pages.** Quote both. If the answer is a founder decision, say so and leave it.

## 5. The supersession rule — Cris, Oct 15 2026

> "Any time something gets superseded, we need it to update the previous existing information."

Superseding is **three steps in one edit**, never one:

1. **Banner** the old page at the top, naming its replacement and the date.
2. **Move** it to Archive — Superseded Plans.
3. **Fix every index row and every link that points at it.**

Every broken chain found on Oct 15 broke at **step 3** — compliance was three
pages deep with the index still routing to the middle one; the retention page
was correctly archived but unbannered and absent from the Archive table. Writing
the new page was never the problem.

**Check this every run:** for each authority page, does anything it replaced
still exist without a banner, outside Archive, or still linked from an index?

If the argument is **"fix"**: make only the edits where one page is factually stale and the correct value is already settled elsewhere — targeted `update_content` edits, never a page rewrite, never the Command Center wholesale. Leave every price, name, strategy and public-claim decision to Cris. List every edit made.

$ARGUMENTS
