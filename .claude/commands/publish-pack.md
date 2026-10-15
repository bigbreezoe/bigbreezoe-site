---
description: Build the full publish pack for a finished episode from its final script, and run the pre-publish gate before anything reaches YouTube Studio. Replaces n8n Publish Pack — Draft. Drafts only, never publishes.
---

Build the publish pack for the episode named in the argument (for example `3`, or `ep3`). Draft only. **Never upload, schedule, publish or post anything.**

## 1. Find the source of truth, and stop if it is ambiguous

1. Fetch the Notion Series Bible (`3e6ea658e07381d2a635d6703a4c0387`) and read the episode's entry plus the arc row.
2. Fetch the episode's Production Package and find the page it names as **the current shooting source**.
3. If the Series Bible, the package and the Command Center disagree about which script version is current, **stop and report the disagreement with both quotes.** Do not pick one. This has happened before.
4. Read the final prompter files (`EP3_FULL_READ.txt` or the per-block files). **Write from the words that were actually recorded**, not from an earlier draft.

## 2. Check the facts before writing the copy

- Every tool named gets its honesty label from the Series Bible: **I USE THIS / I'VE USED IT / RESEARCHED**. Never upgrade a label.
- Re-read each vendor's own page today for any price, tier or trial claim the description repeats. Quote the page, with the date.
- Look up each `/go/` slug in `data/links.json`. **A slug whose `status` is not `approved` must not be presented as an affiliate link**, and the free lane is never linked at all.

## 3. Write the pack

**Three title options.** Each carries the search phrase a beginner would type, and one real curiosity turn. No numbers that the episode does not say on camera. Score each for honesty against what the episode actually shows.

**The description.** First two lines above the fold: the one promise, and the free blueprint link. Then the affiliate disclosure in plain words if any paid link appears, then chapters with timestamps taken from the block order, then the links with their labels, then the standing no-income-claims line.

**The pinned comment.** First line is the blueprint link. One short sentence on what the episode gives them.

**Both Shorts.** For each: the exact opening line, the payoff inside the Short, the on-screen end text, and which block it is clipped from. Both must work cold. Never clip the long-form's emotional payoff in its own publish week.

**Captions** for each platform, in that platform's tone.

**The thumbnail brief:** the text on it (four words at most) and what is in frame. Only tools the episode actually covers.

## 4. Run the pre-publish gate

Run `/compliance` against the pack you just wrote and paste its table in. **A BLOCK is a block** — say so plainly at the top of your output rather than burying it.

## 5. Output

A single markdown file saved to `reports/publish-pack-ep<N>-YYYY-MM-DD.md`, plus a short summary in chat: the recommended title, any BLOCK or UNCERTAIN from the gate, and the exact list of what Cris still has to do by hand in Studio.

**Never:** tick the paid-promotion box, set visibility, schedule, or touch Buffer. Those are Cris's, in Studio, with the pack open beside him.

$ARGUMENTS
