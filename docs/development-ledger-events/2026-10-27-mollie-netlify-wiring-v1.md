# 2026-10-27 — Mollie wiring in Netlify

Obligation: mollie-netlify-wiring-20261027.

/api/checkout/create and /api/checkout/readiness now go through the bg-mollie-checkout edge function. Stripe is no longer in the checkout path; the Mollie key stays in Supabase Vault. Test mode until Arthur approves go-live.
