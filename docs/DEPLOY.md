# Deploying bigbreezoe.com (GitHub + Cloudflare), step by step

How it works: GitHub Actions runs `npm run check` on every pull request and posts a preview link.
Merging into `main` deploys production to Cloudflare Pages (project `bigbreezoe1`).
GitHub needs two secrets to talk to Cloudflare. Their VALUES live only in GitHub's secret boxes, never in a file.

## Part A. Make a new Cloudflare token (5 min)
1. Go to https://dash.cloudflare.com/profile/api-tokens and log in.
2. Click **Create Token**.
3. Scroll to the bottom, to **Create Custom Token**, and click **Get started**.
4. **Token name:** `bigbreezoe-site-deploy`
5. **Permissions:** set the three boxes to **Account** → **Cloudflare Pages** → **Edit**.
6. **Account Resources:** **Include** → your account.
7. Leave Client IP Address Filtering and TTL empty.
8. Click **Continue to summary**, then **Create Token**.
9. Click **Copy**. Cloudflare shows it only once. Don't paste it anywhere except Part B.
10. Back on the API Tokens list, delete any old token that was used for this site (… → Delete).

## Part B. Put it in GitHub (3 min)
1. Open https://github.com/bigbreezoe/bigbreezoe-site/settings/secrets/actions
   (or: repo page → **Settings** tab → left side **Secrets and variables** → **Actions**).
2. Under **Repository secrets**:
   - If `CLOUDFLARE_API_TOKEN` is listed: click the pencil → paste → **Update secret**.
   - If not: **New repository secret** → Name `CLOUDFLARE_API_TOKEN` (exactly) → Secret: paste → **Add secret**.
3. Make sure `CLOUDFLARE_ACCOUNT_ID` is listed. If not: **New repository secret** → Name `CLOUDFLARE_ACCOUNT_ID` →
   Secret `edfdd5340807bfd0b6eb0cb6b1ff25ec` → **Add secret**.
4. If you see a secret whose NAME looks like a long code (starts with `cfat_` or `edfdd`), delete it (trash icon).
   Secret names are the labels; the code goes in the value box.
5. Never edit `.github/workflows/site.yml` to add a token. The file should only say `secrets.CLOUDFLARE_API_TOKEN`
   and `secrets.CLOUDFLARE_ACCOUNT_ID`.

## Part C. Ship a branch (each change)
1. Open `https://github.com/bigbreezoe/bigbreezoe-site/compare/main...<branch>` and click **Create pull request**.
   Paste the title and description, then click **Create pull request**.
2. Wait 1–2 minutes. In the PR's **Checks** area, `check` must be green.
   The `preview` job then comments a link like `https://pr-3.bigbreezoe1.pages.dev`. Open it on your phone and computer.
3. Happy with it? Click **Merge pull request** → **Confirm merge**. (Delete branch is fine afterwards.)
4. Open the **Actions** tab. The newest `site` run on `main` has a `production` job.
   - If it says **Waiting**, click **Review deployments** → tick `production` → **Approve and deploy**.
   - Green check = live. Hard-refresh https://bigbreezoe.com (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).

## If something fails
| Error in the Actions log | Fix |
|---|---|
| `Invalid access token [code: 9109]` | Token is wrong or revoked. Redo Part A and B. |
| `Authentication error [code: 10000]` | Token doesn't have Cloudflare Pages Edit on this account. Redo Part A steps 5–6. |
| `Could not find project bigbreezoe1` | `CLOUDFLARE_ACCOUNT_ID` is wrong. Fix it in Part B step 3. |
| `check` failed | Open the log, read the ERROR line, or ask Claude Code to run `/site-check fix`. |
| GitHub email: "credential was revoked" | A token got pasted somewhere public. Redo Part A and B, and find and remove the paste. |

## Swapping in an affiliate link later
All outbound tool links go through `/go/<slug>`. When a program approves you, change only that slug's `to`
in `data/links.json` to the tracked link, run `npm run redirects`, and ship a branch. Or ask Claude Code:
`/add-link <slug> <tracked url> <program> approved`.
