# ONE BRAIN / Powerhouse — eigenaaractie direct zichtbaar, zonder spam

**Datum:** 2026-11-03. **Oorspronkelijk incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232. **Status:** SOURCE_CANDIDATE; not proof of a sent email or deployed Edge producer.

## Observed native source
The original Supabase LinkedIn org OAuth setup record `linkedin-composio-setup-current-state-v1` had `ACTIVE` and `company_oauth_fresh_verified=true` at 10:54 UTC after the owner reauthorized. This resolved the historical org-admin consent boundary; the later LinkedIn company failure was **pre-provider duplicate refusal**, not missing owner consent. The old 403 occurrences remain useful historical facts but cannot trigger repetitive reauthorization requests. Daily blog and Mira have original safety/quality gaps; these must be repaired by their existing agents without asking the owner for avoidable technical work.

## Implementation
- Existing `powerhouse-content-loop` imports `supabase/functions/_shared/owner-action-escalation.mjs` and projects `ownerActionEscalation` in its original `brain_records.content-closed-loop:YYYY-MM-DD` result. The classifier consumes the exact original `assessDailyPublicationRecovery` plus current source-backed LinkedIn auth preflight; it is pure, creates **no** emails/sends/schedulers, and never asserts alert delivery.
- Two already-enabled original ChatGPT Powerhouse automations ("Powerhouse Metingen & Verzending", "Powerhouse SEO Order Engine") were updated in place to produce **ACTIE VAN JOU NODIG** only for real human permissions, with verified exact action, impact, deadline, event and real unexpired HTTPS link. Optional existing Gmail owner-only delivery requires actual native Gmail message ID; otherwise report undelivered and preserve the in-app alert.
- No more than one owner notification per **fingerprint per 24h**; retry on the next *original natural run* only while the same original source still proves the boundary. All agent-recoverable duplicate, quality, media and publication proof failures continue through the original publisher and stay OPEN until native provider ID and independent readback.
- OAuth links must never be manufactured or reused after expiry. Never log credentials or expose linked-account secrets. The independent run must confirm notification delivery, source approval, and no duplicates after resolution.

## Release checks and truth boundary
Run `node --test tests/brain-owner-action-escalation-original-loop-20261103.test.mjs`; then exact head Required/BRAIN/CodeQL, original exclusive writer/lease and protected merge; independently verify the original Supabase Edge source/version and next natural run. This record is NOT confirmation of runtime deployment, notification or all channels live.

Human-readable message contract:
`ACTIE VAN JOU NODIG — <kanaal> — <één concrete actie> — <geverifieerde geldige URL indien beschikbaar> — <impact> — <incident/fingerprint> — <deadline>`. Notification receipt must distinguish `chatgpt_task_message` from `gmail_provider_message_id`; no owner email sent is ever inferred merely from preparing this message.
