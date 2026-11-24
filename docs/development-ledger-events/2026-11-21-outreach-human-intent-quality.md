# Development ledger — cold email human-intent source fix

- Date: 2026-11-21 (Europe/Amsterdam)
- Canonical owner: `powerhouse-commercial-message-composer` and original commercial Powerhouse/Heartbeat lane
- Obligation-ID: `powerhouse|commercial|human-outreach-intent-regression|20261121-v1`
- Incident fingerprint: `powerhouse-commercial-email-human-intent-leak-20261121-v1`
- Production observation: original Gmail provider sent the redacted malformed draft; original `powerhouse_message_quality_v1` gave quality score 1.0
- Root-cause path: `supabase/functions/_shared/editorial-council-context.mjs`
- Quality-repair paths: `supabase/functions/_shared/outreach-human-copy-guard.mjs`, `supabase/functions/powerhouse-commercial-message-composer/index.ts`
- Regression: `tests/brain-outreach-human-intent-quality-20261121.test.mjs`
- Production release state: `NOT_DEPLOYED` until exact protected checks, merge, real function readback and subsequent customer quality proof
- Existing consent/permission boundary: preserved, not reinterpreted or automatically granted by this event
- Recovery: original prepared/waiting action continues through existing researcher/composer once genuine evidence is available; no duplicate action, scheduler, Gmail provider call or backfill resend
- Learn: a quality-score rubric that rewards the presence of analytical parts is not proof of human relevance; require both substantive observed trigger and natural customer language
