# P0 #4215 — same-session recovery of stalled Portal V2 Brain handoffs

Date: 2026-11-10. Existing authoritative issues: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 and https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547.

## Root cause observed in existing source
Original createPortalDomainState retained section BusinessInput and causal impacts on a secondary Brain ACK failure, even after the authenticated state snapshot was saved. Original focus/visibility/15-minute revalidation refused all pending handoffs, requiring an extra customer save.

## Scoped fix in the existing one loop
- Existing portalDomainState.refresh is already triggered by app.js on focus, page visibility and at a 15-minute interval. It now replays an already attempted section handoff only while the authenticated principal matches and the state is not dirty/saving.
- Explicitly guard tenant/principal before any write, after the source-state write and after every Brain authority receipt. Never replay an old customer's pending data under another account.
- Preserve every causal generation until its original canonical Brain ACK. Pending is visible in the authenticated entrepreneur home and every registered page's existing decision guide.
- No extra scheduler, storage, external sender, model, independent Powerhouse or BRAIN. All provider receipts and actual downstream actions must remain separately verified.

## Nonclaims / EVIDENCE_DUE
This patch is **same active browser-session retry only**, not a server-durable outbox. Browser restarts, earlier provider errors and independent authenticated two-tenant production readback are still the original #4215 acceptance. Original 2026-11-10 read-only Supabase inspection found zero canonical-brain rows in portal_state_layers; the original Brain authority may store elsewhere, so that is not proof every other canonical source is empty. The user gets no claim of daily best advice before real customer write, source/Brain ACK, Heartbeat, every impacted page and outcome/learning readbacks.

## Required independent gates
Original preflight, Root BRAIN test tests/brain-portal-handoff-replay-20261110.test.mjs, Required, hygiene/admission, CodeQL, original BRAIN, Netlify source-exact deployment, authenticated two-tenant browser canary, mobile/accessibility and measured entrepreneur decision outcome. No green from source build or cron success alone.
