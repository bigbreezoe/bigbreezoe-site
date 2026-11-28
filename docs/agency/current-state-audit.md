# Agency Division: current-state audit (Nov 4, 2026)

Stage 0 of the Notion handoff "CLAUDE CODE HANDOFF — Agency Division Implementation (2026-11-04)", Sprint 0 of issue #9, and the readiness report asked for in "GEORGE AI BRIEF — Agency Division Operations". **Read-only.** Nothing was changed on the live site, in Stripe, n8n, Make or Notion. No customer was contacted.

How each line was checked: `curl` against bigbreezoe.com on Nov 4, 2026; this repo at `main` 45dc2e4 (`npm run check`: 30 pages, 119 files, passed, 0 warnings); the Stripe API, read-only, live mode; the n8n and Make APIs, read-only; the Notion pages named in the handoff. Anything not checked says **Unknown**.

## Decisions since the audit (Cris, Nov 4, 2026)

| Open point | Cris's answer | Done |
| --- | --- | --- |
| Which item is the pilot | "we can add another bundle service" | Content Week bundle, $197 proposed, on the menu as Request (PR #14); Notion Service Catalog row |
| Make scenario | "No we use n8n" | Make is not part of the stack |
| Standing rule 3 | "Do it anyway, forget the standing rule 3" | Waived for the agency and agent build |
| PayPal | "switch everything to Stripe" | n8n "Booked & Paid 2" (PayPal) off; agreement and intake drafts use live Stripe links |
| Stripe webhook | "Yes, fix the webhook" | PR #13 |
| Agency records | "Agency pieces to be in place" | Six Notion databases under Agency Architecture V1 |

## Status by area

| Area | Status | Evidence | Blocker or note |
| --- | --- | --- | --- |
| Website routes | Working | 18 routes on `main`. Live: `/`, `/start/`, `/store/`, `/blueprint/`, `/blueprint/guide/`, `/setup/audio/`, `/setup/editing/`, `/gear/`, `/checkout/`, `/booked/` all 200. `/terms/` and `/privacy/` 308 to the slash-less URL | None |
| `/setup/repurposing/` | Not configured | Live 404. No page in `public/`. Nothing links to it (the checker finds 0 broken links) | Handoff task T4 was never built. It is a missing page, not a broken link |
| Featured offer: Getting Started $97 | Working | Home page shows "Getting Started session is 60 minutes, one on one." `store-config.js` line 55: apply at `/start/`, intake `tally.so/r/ODvRPa` (live 200) | Stays the only featured offer until the Nov 15 review |
| Intake (Tally to n8n) | Partly working | n8n "Intake — Getting Started" is **active**: Tally, then raw log, consent check, Notion lead, **an automatic confirmation to the applicant**, and an alert to Cris. A second workflow, "BB_INTAKE Acknowledgment", is inactive | Recent run history Unknown (n8n hit its monthly cap in October). One automatic reply to customers already exists today |
| Email capture (Kit) | Partly working | Kit form 9923204 is embedded in 18 places | What Kit sends after sign-up is Unknown. The Kit connector needs a paid plan |
| Stripe checkout | Working, no sales | 15 `buy.stripe.com` links on public pages, including 9 service menu items. Stripe `GET /v1/charges`: **0 charges** (Nov 4) | Revenue $0, which matches the Nov 3 Command Center |
| Stripe webhook | **Broken** | Live endpoint `we_1USNBl…` is enabled for 6 events (checkout completed, async paid and failed, expired, refunded, dispute) at `https://bigbreezoe.com/api/stripe/webhook`. That URL returns **404** to GET and POST. The handler only exists on the unmerged branch `site/stripe-webhook`, at a different path (`functions/api/stripe-webhook.js`, so `/api/stripe-webhook`) | No harm yet with 0 charges. The first real sale's events will fail, Stripe will retry and may later disable the endpoint. Kit delivery does not depend on it (`functions/api/verify-session.js` checks the paid session directly) |
| PayPal | Mostly removed | Site: one mention left, a code comment in `public/store/store-config.js` line 7 | n8n "Booked & Paid 2: Payment Received" (PayPal events) is **still active**, although Cris dropped PayPal on Nov 3 |
| Booking | Partly working | n8n "Booked & Paid 3: Session Booked" is active (calendar guest matched to a lead) | Which booking tool customers use was not checked: Unknown |
| n8n | Partly working | 31 workflows, 7 active: Intake — Getting Started, Booked & Paid 1, 2 and 3, Session to Plan to Upgrade, BB Sale Logger, BB Error Alert. "Booked & Paid 4: Stripe Purchase" is inactive and waits for the webhook above | Execution health and the reset date were not checked |
| Make | Not used by Big Breezoe flows | Free plan (2 active scenarios max, 1,000 operations a month). 3 scenarios. The one active scenario is "Swift Supply Co order tracking bot" (Telegram and OpenAI), last edited Nov 3 | It holds one of the two free slots. Cris to say whether it is his test or should be off |
| Instagram, TikTok, Meta DM automation | Unknown | No connector was used. Notion says inbound uses Meta Business Suite free auto-replies | Cris checks in Meta Business Suite and TikTok what is switched on. No claim that DM keyword automation works until it is tested |
| Notion data | Working | Existing stores that the agency can reuse: Customers & Leads (n8n's lead target), Outreach Leads (`collection://e6d0ea56-…`), Sales Log, Affiliate Status, Pin Queue, Publish Packs | Reuse them before creating agency tables |
| George | Partly working | George is a Claude Code agent with skills in `bigbreezoe/claude-work-folder`. His governance is in PR #8 there (open, not merged). His scheduled runs are written but not scheduled | George has no endpoint that receives Notion briefs. The "actual George endpoint" is still a founder decision |
| Deploy flow | Working | Cloudflare Pages project `bigbreezoe1`. `npm run deploy:preview` and `deploy:production` | Production only after Cris types "deploy" |

## Services that already exist (overlap with the pilot)

The pilot in the handoff (1 owned or licensed video up to 30 minutes, 3 vertical clips of about 20 to 60 seconds, captions, framing, basic audio cleanup, 1 revision, about 5 business days, no posting) overlaps two services that are **already live with Stripe links**:

| Live item | Price | What the site says |
| --- | --- | --- |
| `shorts-pack` | $49 | "5 vertical Shorts with captions, cut from one of your long videos." |
| `video-edit` | $89 | "One episode up to 20 minutes, edited with my own workflow, plus 3 Shorts cut from it." |

The handoff says not to create a new Stripe product or overwrite the catalog. So the pilot is either one of these two items with its scope written down, or a new item that waits for a measured price. That is Cris's call.

## Conflicts with existing rules

1. **Standing rule 3:** "Never automate a process that hasn't been done manually and understood." Stage 1 of the handoff (entities, dashboards, a state machine) would build software before one agency job has been done by hand. Suggested order: measure a demo first, build second. That matches Growth OS baby steps 3 and 4.
2. **The pilot and the live $49 and $89 items** (above).
3. **Automatic replies.** The Nov 4 Notion page "George AI — Founder Authorization for Routine Auto-Responses" authorizes them in principle, after testing. The active intake workflow already sends a confirmation today. The new rule should cover that workflow too, not sit beside it.
4. **The featured offer.** Nothing agency-facing goes public before the Nov 15 review.

## Readiness: confirmed, proposed, missing, blocked

| Confirmed | Proposed (not approved) | Missing | Blocked on Cris |
| --- | --- | --- | --- |
| Site, checkout, intake form, Stripe account, 0 sales, featured offer, Notion lead stores, n8n intake and booking flows | Agency entities and states, six agents, intake V1 questions, pilot scope, 70/30 split (illustrative) | Stripe webhook handler, `/setup/repurposing/`, agency records, builder application, agreements, an endpoint for George, any measured delivery cost | Pilot item and price, worker classification and legal review, contract and IP terms, refund and payout policy, builder eligibility, George's endpoint |

## Next seven baby steps

| # | Step | Owner | Tier | Done when |
| --- | --- | --- | --- | --- |
| 1 | Pick the pilot: the $49 Shorts pack, the $89 Video edit, or a new item | Cris | Decision | One line in Notion |
| 2 | Fix the Stripe webhook: route `/api/stripe/webhook` to the handler on `site/stripe-webhook`, add the signing secret in Cloudflare, test with a Stripe test event | Claude (PR); Cris (secret, merge, "deploy") | Ask first | A test event logs 200 in Stripe |
| 3 | Switch off n8n "Booked & Paid 2" (PayPal) | Cris, or George on his yes | Ask first | Workflow inactive |
| 4 | Measure the pilot on Big Breezoe's own footage: log minutes, software cost, revisions and QA time while the Episode 6 Shorts get built | Claude | Act | Time and cost log for 3 clips |
| 5 | Price floor from step 4: variable cost ÷ (1 − target margin), plus a builder share and contribution per founder hour | Claude drafts; Cris approves | Act, then a decision | One table, with every input sourced |
| 6 | Intake V1 as a draft (questions, routing, fail-closed rules), tested with records marked DEMO | Claude | Act | Routing table and test results |
| 7 | Six agent contracts and the George daily digest format into George's skills and briefing template | Claude | Act (vault PR) | George's briefing shows the digest sections |

Related: [architecture.md](architecture.md) · Notion: Agency Architecture V1, Claude Code handoff, George brief, Growth OS, Intake Intelligence (all Nov 4, 2026).
