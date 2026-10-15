---
description: What Big Breezoe costs to run, what it earned, and what that means per hour. Reads the bookkeeping workbook and the live tool state. Read-only, and never writes financial data into this repo.
---

Work out the real economics. **Read-only. Never commit the bookkeeping workbook, an invoice, an account number or a balance into this repo** — CLAUDE.md forbids it. Read the file where it lives and leave it there.

## 1. Get the book

The workbook is `BigBreezoe_Bookkeeping.xlsx` in the claude.ai Project files. If it is not reachable, say so and stop — do not estimate from Notion.

Read three tabs: **Ledger** (every real row, ignoring the example row), **Monthly Summary**, **Monthly Costs**.

## 2. Say what is actually there

- Income by line and month. **If it is zero, say zero** — do not soften it.
- Expenses by category.
- **Every paid tool whose monthly cost cell is blank.** As of Oct 14 that was all of them: Claude, ChatGPT, n8n, Descript, vidIQ, Notion, Google, Cloudflare. List the blanks by name, because the blanks are the finding.

## 3. Compute only what the data supports

- Monthly run cost, and what is still unknown.
- **If any paid tool is blank, say clearly that gross margin cannot be computed**, and that every price decision currently rests on an unknown cost base. Do not fill a blank with a guess, a list price or a memory.
- Where there is revenue: gross profit by offer, after fees and direct costs.

## 4. The hourly check

For each service offer, compare its price against the delivery time it actually implies:

- **Getting Started, \$97:** one 60-minute session plus prep and the written plan.
- **The Basics, \$997 / \$499 founding:** kickoff 60, build review 30, handoff 30, the build itself, 14 days of support.

Give the effective hourly rate at a realistic hour count and at an optimistic one. State plainly whether that is a good trade for evening hours around a full-time job. **Twice over the hour target means the price goes up** — that is already the rule on the à la carte menu; apply it to the packages.

## 5. n8n, because it is the live cost risk

- Workflows total and active, executions this month against the 2,500 cap, days since the last execution.
- Cost per execution at the current plan, and what the cap actually buys.
- **The reset date.** It is not exposed through the API — if it is not recorded in the workbook, say it is still Unknown and that it blocks the upgrade-or-wait decision.

## 6. Output

A short table of **tool · plan · monthly cost · what it removes · keep / consolidate / cut**, one line of reasoning each.

Then:
- The bottleneck, in one sentence, with the evidence it actually happened.
- Anything paid for that produced nothing measurable this month.
- **No new tool recommended unless a named bottleneck demands it.**

End with the two or three numbers Cris must fetch himself, and exactly where to find each one.

$ARGUMENTS
