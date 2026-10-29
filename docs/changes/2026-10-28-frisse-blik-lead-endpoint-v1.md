# Frisse blik: leads reach commercial_leads

**Date:** 28 October 2026. **Status:** merge pending hygiene gate; not production-proven until a real submission creates a row.

The lead form on /frisse-blik had an empty `WEBHOOK_URL`. The form then sent nothing while still showing the booking step, so `commercial_leads` stayed at zero rows and leads were lost silently.

## Change
One line in `frisse-blik.html`: `WEBHOOK_URL` points to the Supabase Edge Function `lead-intake`. The function validates name, company and email, checks the origin against the site, and stores the lead with an idempotency key. It does not store consent evidence; the form enforces the consent checkbox client-side, which the function cannot verify.

## Evidence
- Valid POST returned ok and stored a row; invalid email returned 422; wrong origin returned 403; the test row was deleted.

## Open
- Real submission from the live page is not yet verified.
- Consent evidence is not stored server-side (legal decision for Arthur).
