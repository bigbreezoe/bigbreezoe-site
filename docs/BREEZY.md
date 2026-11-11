# Breezy, the on-page helper

Breezy is the "Ask Breezy" button on every English public page. It is off on the hidden post-payment pages and on the translated pages.

## How it answers today (scripted mode)

- The replies are pre-written in `public/assets/breezy.js`, which loads the first time someone clicks the button. Each one restates something a page already says and links to that page.
- Prices and descriptions are read from `public/store/store-config.js` when the visitor asks, so a price changed there changes in Breezy too.
- Nothing the visitor types leaves their browser. The panel says so.
- It says it is an automated helper, not a person, in its header and whenever it is asked.
- It gives no turnaround time, no refund wording (it links to Terms) and no income claims.

## AI mode (built, switched off)

`functions/api/chat.js` and `lib/breezy.js` let a Claude model write the replies from the same facts. It stays off until all three of these are done:

1. **Privacy page.** Add a line saying chat messages are sent to Anthropic to write the reply. Rule 12: Terms and Privacy edits need Cris's explicit yes.
2. **Secrets** in Cloudflare Pages (Preview and Production): `ANTHROPIC_API_KEY`, and `BREEZY_AI` set to `on`. Never put the key in this repo.
3. **A spending limit** set on the Anthropic account. The function allows 20 questions per visitor per 10 minutes and short replies, which slows abuse but does not cap the bill.

When it is on, the panel changes its label to "AI assistant" and tells the visitor their messages go to the model before they send one. If the model call fails, the page falls back to the scripted reply.

To turn it off again, delete `BREEZY_AI` or set it to anything but `on`.

## Changing what Breezy says

Edit the `answer` function in `public/assets/breezy.js`, then run `npm run layout` so pages pick up the new script version. Keep every reply to something the site already states. Tests for the server side: `tests/breezy.test.mjs`.
