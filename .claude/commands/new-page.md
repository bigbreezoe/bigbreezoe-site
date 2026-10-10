---
description: Create a new page on bigbreezoe.com from an existing page's layout (guide, setup page, product page, client offer page).
argument-hint: <url path, e.g. /setup/editing-settings/> <what the page is for> [source notes or Notion page]
---

Create a new page. Request: $ARGUMENTS

1. Branch `site/<short-topic>`. Run `npm run check` first; it must pass.
2. Pick the closest existing page as the template (`public/setup/editing/index.html` for how-to and settings pages, `public/start/index.html` for offer pages, `public/gear/index.html` for tool lists). Copy its head, nav, footer and styles exactly. Change only the title, meta description, og tags and main content.
3. Write the copy in Cris's voice: short sentences, plain words, first person, no hype, no "unlock", "game-changer", "seamless", "elevate". Read it out loud in your head; if it sounds like an ad, rewrite it.
4. Content rules:
   - Tools: label I USE THIS / I'VE USED IT / RESEARCHED exactly as the Notion Series Bible marks them. If unsure, use RESEARCHED and ask Cris.
   - Any `/go/` link needs the affiliate disclosure on the same page.
   - Buttons to buy only if the real checkout link exists in `public/store/store-config.js`; otherwise "Notify me".
   - No income claims, no guarantees, no tax statements, no customer names or stories without consent.
5. Add the page to `public/sitemap.xml` and link to it from at least one existing page (nav or a relevant section).
6. `npm run check`, then `npm run preview` and look at the page at http://localhost:8788<path> on desktop and phone width.
7. Commit, push, and give Cris: the compare URL, the preview URL once GitHub Actions posts it, and a list of anything you marked "ASK CRIS".

Never deploy to production unless Cris said "deploy" in this session.
