# 2026-11-14 — original first-party business contact public HTML failure + same-domain redirect

Root fingerprint: `powerhouse|contacts|first-party-web-no-html-redirect-url-coverage|20261114-v1`. Parent P0 #4198. Original source: protected main PR #5787, production Edge `powerhouse-relationship-public-research` v28, original cron #116, consumer #138.

## Native production evidence (not inferred)
- 23,295 canonical contacts, 605 existing sender-visible addresses.
- 8 existing original first-party actions on 14 November. Each is exactly associated with its original action/person/company and has `public_email_source_status=NO_EXPLICIT_NAMED_OFFICIAL_MAILTO`; `public_email_source_checked=false`, exact next retry `2026-11-14T23:12:44.234Z`. No source disposition missing. Existing `bg_gezondheid` independent run shows `companies=8`, `sites=0`, `candidates=0`, `ingest_acks=0`, `new_provider_queries=0`.
- Actual original Edge `net._http_response` status 200 did not claim new candidates, source ACK or independent consumer success. #138 consumer contract directly read back `processed=0,held=0,external_messages_sent=0` as no candidate exists.
- Native parent ONE BRAIN obligation id `43c90754-3fd0-4c97-bb14-fbf815e12f47` version 9 remains OPEN with exact provider and 8 source dispositions; there is no terminal claim.
- `/team` and `/contact` URLs may redirect or not return static HTML; this failure mechanism is plausible but not confirmed for each domain.

## Narrow reversible original source repair
- Preserve the SAME single source writer, original contact/Brain/Heartbeat and paid-search caps.
- Allow a maximum of two redirect hops **only inside the original HTTPS domain**, permitting the `www.` alias. Reject HTTP downgrade, other hosts, private IP/localhost, embedded credentials, unusual ports and oversized URLs/bodies; never sign into websites or bypass login.
- Test `/team`, `/contact` and **homepage** at most once per bounded first-party action, with max 160kB HTML and 2.5s request timeout.
- Use local `Europe/Amsterdam` calendar date for the original research action day key; UTC-based day rollover could resubmit tomorrow's original action under yesterday's key.
- Continue to record per-original-action source disposition + retry time, without confusing 8 failed source reads with 8 enriched addresses. Preserve CAS, original provenance and duplicate-safe source event.
- No added cron, vendor search/payment, alternative publisher, sender permissions or second database.

## Acceptance / production constraints
- Regression file `tests/brain-public-work-email-same-domain-redirect-20261114.test.mjs`, exact-head protected Required, CodeQL, provider-owned Supabase Preview, protected merge, original Edge Production Authority and independent deployed source readback.
- After release: original bounded #116 retry only when original `public_email_next_attempt_at` allows it. Count new actual named work-mailto candidates and separately verify original #138 PROCESSED; until proven remain OPEN and report zero. Do not backfill sender-visible `bg_connecties.email` or send emails.
