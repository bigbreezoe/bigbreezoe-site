---
description: Add or update an affiliate / product link and place it on a page with the right label and disclosure.
argument-hint: <slug> <url> <program> <status: approved|applied|none> [page path] [label: use|used|research]
---

Add or update a `/go/` link. Arguments: $ARGUMENTS

1. Branch: `git checkout -b site/link-<slug>` (or stay on the current `site/` branch if one is open).
2. Edit ONLY `data/links.json`: set `to`, `program`, `status`, and a dated `note`. Never hand-edit `public/_redirects`.
   - The URL must be a tracking or product link. If it is an affiliate dashboard, sign-up or login URL, stop and tell Cris where to copy the real tracking link.
3. `npm run redirects`.
4. If a page path was given, add or update the tool card on that page by copying an existing card on the same page (same classes, same markup). Link it as `/go/<slug>`.
   - Label from the argument: use = "I USE THIS", used = "I'VE USED IT", research = "RESEARCHED" with the line "the strong option I'd consider".
   - Show an "Affiliate link" badge only if status is `approved`.
   - The page must already carry the affiliate disclosure. If it does not, add the same disclosure block used on `public/gear/index.html`.
5. If the slug is also hard-coded in `workers/bb-go/worker.js` OVERRIDES, update it there too and say the Worker needs a redeploy.
6. `npm run check` must pass. `npm run preview` and look at the page.
7. Commit ("Add <program> link" + why), push, and give Cris the compare URL:
   https://github.com/bigbreezoe/bigbreezoe-site/compare/main...<branch>

Never add income claims. Never put Amazon links in email or downloads. Never deploy to production unless Cris said "deploy" in this session.
