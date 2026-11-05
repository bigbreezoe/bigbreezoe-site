// POST /api/stripe-webhook: the same handler as /api/stripe/webhook.
//
// Why two URLs: on bigbreezoe.com a Cloudflare route (the bb-stripe Worker) catches /api/stripe/* before Pages sees it,
// so the live Stripe endpoint points here instead (Nov 5, 2026). Remove this file only after that route is gone and the
// Stripe endpoint URL is moved back.
export { onRequest } from './stripe/webhook.js';
