# 2026-11-12 — originele bronhandshake voor SKIPPED/met externe ID

- Incident: #4198; originele eigenaar: source `content_publication_obligations`, consumer `powerhouse_content_handoff_receipts_v1` onder #171.
- Bronreadback: 16 contradictory SKIPPED/external-ID-or-timestamp rows; provider readback 400/403 restricted, not deletion evidence; all 16 existing source rows have original no-resend fence and precise provider reconciliation evidence after 12-Nov scoped updates.
- Actual defect: existing handoff `IF NOT v_pub THEN` classifies these as `OVERDUE_PUBLICATION`, misdirecting recipient to new publication. This is a consumer routing defect, not proof that any of 16 is currently live.
- Prevention code: original helper's new stage `OVERDUE_PROVIDER_READBACK`, original publisher owner, immutable original external reference, `provider_readback_verified=false`; keep all publication and metric gates identical, no second executor.
- Regression: `tests/brain-original-skipped-provider-reference-readback-handoff-20261112.test.mjs`; machine learning: `brain/learning/2026-11-12-original-skipped-provider-reference-handoff-v1.json`; protected SQL: `supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql`.
- Proof due: exact-head Required/CodeQL/BRAIN, native migration apply and service-role grant, original #171 consumer readback of a historical item, independent source provider owner readback. Not green until those have happened. Original provider migration-history lock may only record actually applied versions.
