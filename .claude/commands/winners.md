---
description: Weekly link clicks and winners report (replaces n8n Link Clicks & Winners / Product Winner Detector). Read-only.
---

Build the weekly winners report for /go/ links.

1. Data source: Cloudflare Analytics Engine dataset `bb_go_clicks` (written by the `bb-go` Worker). Query it with the SQL API:
   `POST https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql`
   using the token in the environment variable `CLOUDFLARE_ANALYTICS_TOKEN` (Account Analytics: Read only).
   - If that variable is not set, stop and say: "Add a read-only Cloudflare token named CLOUDFLARE_ANALYTICS_TOKEN to this environment's secrets." Never ask for a token in chat and never write one to a file.
2. Pull the last 7 days and the 7 days before, grouped by slug (blob1). blob2 = redirect status, blob3 = visitor class (human/other), blob4 = referring host. Count only blob3 = human.
3. For each slug: clicks this week, last week, change, top referring host, program status from `data/links.json`.
4. Winner rule: a slug is a WINNER if it has 10+ clicks this week AND is up week over week. A slug with clicks but status not `approved` is a MISSED PROGRAM (apply or swap). A slug with 0 clicks for 2 weeks is a CUT CANDIDATE.
5. Output: one table, then three lines: Winner to feature in next video, Program to chase, Link to cut. No revenue guesses.
6. Save the report as `reports/winners-YYYY-MM-DD.md` only if the argument says "save"; otherwise just show it.

$ARGUMENTS
