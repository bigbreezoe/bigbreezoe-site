# Stripe purchase webhook

Stripe → `POST /api/stripe/webhook` (this repo, `functions/api/stripe/webhook.js`) → n8n "Booked & Paid 4: Stripe Purchase" → Customers & Leads, Gmail thank-you **draft**, alert to hello@bigbreezoe.com.

The Function checks Stripe's signature and forwards only: event id/type, mode, offer, fulfillment, email, first name, amount, currency, session or charge id, and whether the buyer ticked Stripe's own promotional-email box. No address, card, last name or raw Stripe object leaves the Function. Nobody is added to marketing because they bought something.

Events used: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`. Anything else gets 200 "ignored".

**Forwarding off.** Until both n8n values are set, a correctly signed event gets 200 "received; forwarding off". Stripe stops retrying, the event stays in the Stripe dashboard, and nothing is forwarded. This is the state on Nov 4, 2026, because "Booked & Paid 4" is inactive. Only `STRIPE_WEBHOOK_SECRET` is needed for it.

Retries: if n8n is configured and down, the Function answers 503 and Stripe retries with backoff for up to 3 days. Duplicates are stopped twice: by the optional `WEBHOOK_EVENTS` KV binding here, and by the `stripe:<event id>` row n8n writes to its payments data table.

## Setup (test mode first, on a preview host)

1. **n8n:** open "Booked & Paid 4: Stripe Purchase". On the Webhook node, create the Header Auth credential "BB Stripe Forward Secret": Name `x-bb-webhook-secret`, Value a long random string. In Settings set Error workflow to "BB Error Alert". Copy the node's **Production URL**. Activate only after the test below passes.
2. **Stripe (test mode):** Developers → Webhooks → Add endpoint. URL `https://<preview host>/api/stripe/webhook`. Select the four events above. Copy the signing secret (`whsec_...`).
3. **Cloudflare Pages → Settings → Variables and Secrets, Preview environment:**
   `STRIPE_WEBHOOK_SECRET` = whsec_..., `N8N_PURCHASE_WEBHOOK_URL` = the n8n Production URL, `N8N_WEBHOOK_SECRET` = the same random string as step 1.
   Optional: create a KV namespace and bind it as `WEBHOOK_EVENTS`.
4. Buy with a Stripe test card on a test Payment Link. Expect: an alert email marked [TEST], a Gmail draft, and the lead updated if the email matches a row.
5. Live: the live endpoint already exists (`we_1USNBl...`, `https://bigbreezoe.com/api/stripe/webhook`, 6 events). Reveal its signing secret in Stripe and set `STRIPE_WEBHOOK_SECRET` in the Production environment; add the two n8n values only when n8n is ready. A test event sent to production is refused (400), and so is a live event sent to a preview.

## Troubleshooting
- Stripe shows 400: wrong signing secret for this endpoint, or the mode doesn't match the host.
- Stripe shows 503: `STRIPE_WEBHOOK_SECRET` is missing in Cloudflare, only one of the two n8n values is set, or n8n rejected the header (check the credential value) or is down. Stripe will retry.
- No email: the n8n workflow is inactive, or the event id was already handled (see the payments data table).
