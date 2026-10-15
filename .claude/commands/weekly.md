---
description: The Sunday report. One pass over every number that actually exists, written from primary sources. Replaces n8n Sunday Scoreboard, Fleet Watchdog, Weekly Digest, Monday Brief and Sunday State Refresh. Read-only except the Scoreboard row.
---

Build the weekly report for the week just ended (Monday to Sunday). **Every number comes from the system that owns it, read in this session. A number you could not read is "Unknown", never a number from a Notion page.**

## 1. Audience

- `vidiq_user_channels` for subscribers, views, video count. **If it returns an empty channel list, say so plainly: the channel is not authorized in vidIQ and audience numbers cannot be read.** Do not substitute an older figure from Notion.
- Per-video stats for anything published in the window.

## 2. Traffic and clicks

Run `/winners` and fold in its table. If `CLOUDFLARE_ANALYTICS_TOKEN` is missing, report that instead of guessing.

## 3. Customers and money

- Tally submissions this week. **Exclude Cris's own test submissions** — anything from his personal address or with a name like "test". Report real submissions separately from tests, and say zero when it is zero.
- n8n data tables: `intake_raw_log`, `payments_processed`, `agreements_raw_log`. New real rows this week.
- The bookkeeping workbook: income and expenses recorded this week. If income is zero, say zero.

## 4. The fleet

- Workflows: total, active, archived. Executions this week and month to date against the 2,500 cap. Any failed execution, with its workflow and error.
- **If zero executions, say how many days dark and whether the cap or a stop caused it.**

## 5. The promise

- Did an episode publish this week? The channel's weekly cadence was promised on camera. Count consecutive weeks kept or missed.
- Any open loop in the Series Bible Part 5 that is now overdue.

## 6. Write it

One page, in this order: **what shipped · what slipped · the numbers · what the audience said · what the money did · the one change for next week.**

Rules:
- Separate **measured** from **reported** from **unknown**, every line.
- Never compare an incomplete window with a complete one.
- Call a sample too small to conclude from, when it is. At this stage most of them are.
- No revenue guesses, no projected earnings, ever.

Then write one row into the Notion Weekly Scoreboard. **That row is the only thing this command writes.** Leave a blank where a source failed and mark the row partial.

## 7. Close

End with: the single most important number this week, and whether it moved. If nothing moved, say that — it is the most useful sentence in the report.

$ARGUMENTS
