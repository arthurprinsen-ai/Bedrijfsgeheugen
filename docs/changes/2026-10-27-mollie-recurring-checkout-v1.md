# Mollie recurring checkout

Adds Supabase Edge Functions bg-mollie-checkout (create customer + first payment, readiness, status) and bg-mollie-webhook (re-read payment at Mollie, create 1-month or 12-month subscription, activate access). Key only from Vault MOLLIE_API_KEY. Not yet wired into Netlify.
