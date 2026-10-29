# bigbreezoe.com

Static site for **Big Breezoe LLC**, hosted on Cloudflare Pages. No framework: plain HTML/CSS/JS in `public/`, plus a small Node toolchain for checks and redirects.

```
public/            the site (what gets deployed)
data/links.json    every /go/<slug> affiliate or outbound link (single source)
scripts/           check, redirect builder, local preview
workers/bb-go/     Cloudflare Worker that counts /go/ clicks, then redirects
docs/RULES.md      the compliance rules the checker enforces
docs/INDEX.md      start of the docs (open the folder in Obsidian)
CLAUDE.md          instructions for Claude Code sessions
```

## Everyday commands
```
npm install            # first time
npm run preview        # http://localhost:8788
npm run check          # links, disclosures, income-claim words, LLC naming, sitemap
npm run redirects      # rebuild public/_redirects from data/links.json
npm run deploy:preview # needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID; branch "preview"
```

## How a change ships
1. Branch `site/<topic>` -> change -> `npm run check` passes.
2. Open a pull request. GitHub Actions runs the check and posts a preview deploy.
3. Cris looks at the preview link and approves the pull request.
4. Merge to `main` -> Actions deploys production (Cloudflare Pages project `bigbreezoe1`).

## One-time setup (Cris)
- Create the private GitHub repo and push this folder (see the Notion page "Building with Claude Code").
- Add two repository secrets: `CLOUDFLARE_API_TOKEN` (Pages:Edit only) and `CLOUDFLARE_ACCOUNT_ID`.
- Turn on branch protection for `main` (require the "check" job; require one approval).

## Live infrastructure notes
- Pages project: `bigbreezoe1` (domains bigbreezoe.com, www). Older projects `bigbreezoe` and `bigbreezoe1site` are unused and can be deleted later.
- Worker `bb-go` is already live on `bigbreezoe.com/go/*` and `www.bigbreezoe.com/go/*`. Deploy it separately: `cd workers/bb-go && npx wrangler deploy`.
- `data/links.json` and the Worker's `OVERRIDES` must agree (today only `dji-mic-3` is overridden in the Worker).

Related: [Docs index](docs/INDEX.md), [Site rules](docs/RULES.md), [Deploying](docs/DEPLOY.md), [Claude Code instructions](CLAUDE.md)
