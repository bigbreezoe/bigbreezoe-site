---
description: Run the humanizer pass on a finished script, then verify it against the pre-pass version. Prose only — no fact, label, disclosure or cut point may change. This runs after the script is final and before it becomes the shooting source.
---

Strip AI-writing tells from the script named in the argument, then **prove** nothing load-bearing moved.

The humanizer is `humanizer-main` (blader/humanizer) in Cris's Claude work folder. It removes
26 patterns drawn from Wikipedia's "Signs of AI writing". Its own README says getting past AI
detectors is **not** a goal — this is a prose-quality pass, not a detector-evasion pass. Never
describe it as one, on camera or anywhere else.

## 1. Pass

Apply the pass to the prose only. The five tells that matter most in spoken script:

1. **"Not X but Y"** tails.
2. **One-line closers** that sum up the paragraph above them.
3. **Deep-sounding sayings** that assert instead of showing.
4. **Staged run-ups** — "Here's the thing.", "Quick thing before…", "Nobody warned me about this part, though."
5. **Arguing with no one** — rebutting an objection nobody made.

Also flag fragment rows ("Five jobs. Three questions. One editor.") — they read as punchy on
the page and as a list being recited out loud.

**Never touched, whatever the tell count:**

- The spoken affiliate disclosure, word for word. Playbook §2C, Series Bible Part 7, Ledger gate 1.
- Honesty labels: "I've used it", "the one I use every week", "the strong option I'd consider".
- Any hedged vendor claim, trial term, watermark note or "check the terms" line.
- The caveat on every personal timing or result number.
- The channel open and the sign-off. Playbook §8.
- The origin beat, where the Series Bible requires one.
- Anything the Series Bible marks WILL SPEND or HOLD BACK for a later episode.

## 2. Verify — do not trust the pass's own summary

On Oct 15 the humanized Episode 3 draft stated in its header that the Short cut points were
untouched. One of them was gone: Short 3's named entry phrase had been merged away. **The pass
reports what it meant to do, not what it did.** So check, every time:

- **Word count** before and after. A drop larger than the edit log explains means content left.
- **Diff the locked blocks** against the pre-pass version and confirm they are byte-identical:
  disclosure, origin beat, channel open, sign-off, every label line.
- **Every Short's entry and exit line.** Open the production sheet, take each Short's named
  start and end phrase, and grep for it in the new text. A Short whose anchor phrase no longer
  exists is a broken Short — repoint the sheet or restore the line, and say which you did.
- **Run the objective checker** on both versions and compare: forbidden phrases, prompter
  symbols and digits, labels, sign-off, channel open, long sentences. Same result on every
  metric, or explain the difference.
- **Re-read the full thing out loud.** A merged line can be correct and unsayable.

## 3. Output

- The rebuilt prompter files, generated from the block source, not hand-edited.
- An edit log: every change as **was → now → which tell**. No change without a named tell.
- The verification result, line by line, including anything the pass claimed but did not do.
- The new word count and runtime against the 8–12 minute standard.

Keep the pre-pass version. It is the baseline the next pass gets verified against.

**Never run this on a script that has already been shot.** The prompter text and the footage
have to match for the caption and Short passes downstream.

$ARGUMENTS
