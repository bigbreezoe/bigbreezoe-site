---
description: Run the Compliance Ledger pre-publish gate on one asset — a script, description, page, email, Short or speech. Outputs PASS / UNCERTAIN / BLOCK per check. A BLOCK is a block.
---

Run the pre-publish gate on the asset named or pasted in the argument. **Read-only. Never edit the asset; report what must change.**

Fetch the Compliance Ledger (`3d6ea658e073812cb603fdb2bf614e93`) first and use its current checks. The list below is the standing core — if the Ledger has more, run those too.

## The checks

1. **Disclosure, spoken.** If a paid link appears, is the disclosure said out loud, in the same moment the link is mentioned? Playbook §2C also wants it inside the first 30 seconds. *A script with an affiliate link and no spoken disclosure line is an automatic BLOCK.*
2. **Disclosure, written.** On-screen text, the description, and the paid-promotion box in Studio.
3. **Income and results.** Any earnings figure, "make money", "passive income", "financial freedom", "replace your job", or a result implied for the viewer. Pairing money pain with an income promise is the FTC earnings-claim zone the Ledger logs (A1, Amway, individual-promoter liability).
4. **Honesty labels.** Every tool is I USE THIS / I'VE USED IT / RESEARCHED, matching the Series Bible. Researched items say "the strong option I'd consider". Never an upgraded label.
5. **Personal-use and test claims.** Every "I use", "I tested", "it took me" traces to something Cris actually did. Any timing or performance number is his own, labelled as his, with the caveat that it is not a promise.
6. **Links.** Each `/go/` slug is `approved` in `data/links.json`, tracked, and click-tested. **The free lane is never linked.** Amazon links never go in email or a downloadable file.
7. **The destination.** The page the asset sends people to is live right now, returns 200, and says what the asset promises. Check it, do not assume.
8. **AI disclosure.** Any generated footage, voice or music means the AI toggle. Real stock does not.
9. **Likeness and audio rights.** Anyone identifiable has consented; music is cleared.
10. **Continuity.** Nothing spends a beat the Series Bible reserves for another episode, and nothing re-tells what an earlier episode already spent.
11. **Customer material.** No customer name, quote, story or result without written consent. No invented customer, testimonial or review.
12. **Vendor facts.** Every price, tier or trial claim re-read on the vendor's own page **today**, quoted with the date.

## Output

A table: **check · PASS / UNCERTAIN / BLOCK · the exact fix.**

Then:
- **Every BLOCK restated at the top**, in plain words, with what it would cost if published.
- Everything that needs Cris's confirmation rather than a fix, listed separately.
- The date this gate was run, and the note that it expires if the asset, its links, its claims or its destination change.

**Never return an overall PASS if any single check is a BLOCK.** Never soften a BLOCK into UNCERTAIN because the publish date is close.

$ARGUMENTS
