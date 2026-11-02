# Append-only ONE BRAIN incident — 2 November 2026
Fingerprint: `powerhouse|commercial|verified-claim-conversion-gap-signed-quote-not-paid|20261102-v1`. Parent P0 #4198. Original Growth & Revenue, original PostgreSQL trigger authority, original ONE BRAIN/Heartbeat.

Read-only provider observation: `public.scan_inzendingen` 56 unverified, 2 demo, 0 verified (58 total). `public.offerte_inzendingen` 4 demo signed with €51.200 nominal value, 5 unverified unsigned; zero verified. `intern.trg_scan_uitkomst` was AFTER INSERT only, despite intended identity-verification after intake. `intern.trg_offerte_uitkomst` could write `won_order` with total on verified signature, but no provider payment proof. Distinguish latent customer misclassification from actual incident: no verified signed offer, verified scan or falsely claimed positive production revenue observed.

Root: different lifecycle events insert vs identity claim; old outcome trigger tests treated signed order values as revenue without independent payment verification. Fix original triggers only (no new tables, schedulers, writer, public privilege, recipient or hidden payment): add verified identity update handling through original `intern.bg_uitkomst_eenmalig`, preserve source dedupe; keep quote signed state as `proposal` with `revenue_eur=0`, no signed-to-paid inference. Do not manufacture past leads or change existing demo rows.

Source: `supabase/migrations/20261102074013_verified_tenant_intake_and_quoted_value_payment_truth.sql`.
Regressions: `tests/brain-verified-tenant-intake-quoted-value-payment-truth-20261102.test.mjs`.
Skill: `.agents/skills/trigger-based-mkb-acquisition/SKILL.md`.
Public portal/source semantics: identity verified, proposal recorded and payment confirmed must be separate independent stages; measured ROI only after tenant baseline, explicit result and applicable causal evidence.
Status: SOURCE_CANDIDATE_NOT_LIVE. Required/CodeQL, original source merge, Supabase migration application and original provider trigger/readback mandatory. Learning application/next normal run and actual paid-customer outcome not yet proven.
