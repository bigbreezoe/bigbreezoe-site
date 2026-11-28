# Agency Division: proposed architecture (draft, Nov 4, 2026)

**Proposed, not approved, not built.** This maps the Notion "Agency Division & Digital Builder Network (Architecture V1)" onto what already exists (see [current-state-audit.md](current-state-audit.md)). No site code changes until the pilot has been done by hand and measured (standing rule 3). When code does come, it ships behind a feature flag that is off by default, with no public offer and no new Stripe product.

## Records: reuse first

| Proposed entity | Where it lives | Why |
| --- | --- | --- |
| AgencyClient | Existing Notion **Customers & Leads**, with an `Agency` tag | n8n intake already writes leads there. One customer, one record |
| AgencyProject | New Notion database, related to Customers & Leads | Nothing holds project state today |
| DigitalBuilder, BuilderAssessment | New Notion database, separate from customers, private to Cris | Builders are not customers. Keep their data apart |
| BuilderAssignment | Relation between Project and Builder, with status and payout fields | Default deny: a builder sees only their own assignments |
| AgencyFinanceEntry | Existing **Sales Log** for money in; new rows for builder pay and costs | Stripe stays the source of what was paid. Notion never stores card or bank details |
| ToolAffiliateRecord | Existing **Affiliate Status** database plus `store-config.js` tool labels | Labels (own, used, research) already live there |
| AuditEvent | George action log (vault) plus the n8n execution log | Every action is logged once, with its source |

## States (from the handoff, unchanged)

- Client: Lead, Scoping, ProposalDraft, AwaitingFounderApproval, AgreementPending, PaymentPending, ReadyForAssignment, InProgress, QA, ClientAcceptance, Completed, Disputed, Cancelled.
- Builder: Applied, Review, SkillsAssessment, Eligible, NeedsTraining, Declined, Available, Assigned, Inactive.

Founder gates: AwaitingFounderApproval to AgreementPending (scope and price), ReadyForAssignment to InProgress (assignment), ClientAcceptance to Completed (payout). No automation moves a record through a founder gate.

## Six agent contracts (draft)

Each agent starts as a deterministic workflow where possible, and is coordinated by George under his Governance tiers (act, act-then-report, ask-first, never).

| Agent | Reads | Produces | May not | Reuses |
| --- | --- | --- | --- | --- |
| Scout | Public business info, Outreach Leads | Ranked leads and outreach drafts | Send, or contact anyone first | The 5:47 AM leads and drafts task |
| Concierge | Approved FAQ and catalog | Approved acknowledgments, routing to intake or booking | Quote unapproved prices, promise availability, run outbound campaigns | "Intake — Getting Started" confirmation |
| Blueprint | Intake answers | Free blueprint draft and the smallest fitting paid recommendation | Send without approval until the auto-reply tests pass | `/blueprint/` and the Tally form |
| Producer | Scripts, footage, sources | Shorts, captions, proof captures, QA notes | Publish outside the Buffer rule | The Episode build kit and bb-shorts-package |
| Agency Coordinator | Projects, Builders | Scope drafts, assignment suggestions, due dates, QA status | Assign, sign, commit or pay | New Projects and Builders databases |
| Revenue Analyst | Stripe (read-only), Sales Log | Reconciliation, margin per project and per founder hour | Charge, refund, transfer or pay out | Ledger, BB Sale Logger |

## George daily digest (format)

Verified leads and intake forms (source and time) · paid projects and Stripe status (Unknown if not checked) · pending founder decisions and blockers · builder availability (real applicants only) · QA exceptions and deadlines · revenue, builder pay, fees and margin (no invented figures) · content and outreach priorities (one schedule) · the one decision that matters most today.

## Unit economics: how the pilot gets measured

1. Do 3 clips from one Big Breezoe episode with the real workflow. Log minutes per stage (selection, cut, captions, framing, audio, QA, revision), software cost per clip, and rework.
2. Variable cost = labor value + software + payment fees + expected rework.
3. Price floor = variable cost ÷ (1 − target contribution margin). The Notion example ($75 cost at 40% gives $125) is a formula check, not a price.
4. Builder share comes out of contribution, not out of the agency's margin by default. The 70/30 split stays illustrative until it is measured.
5. Profit, taxes and owner pay are tracked separately.

## Tests a build must pass (later)

Permission isolation, every state transition, founder gates, duplicate assignment, webhook replay, privacy, payout arithmetic, cancellations, affiliate disclosure, prompt injection in free-text "Other", and no sends that were not approved. Synthetic data is marked DEMO.

## Open founder decisions

Pilot item and price · service margin and builder pay · worker classification and jurisdiction · contract and IP terms · dispute, refund and payout policy · builder eligibility · George's endpoint · repo and staging access.
