# 2026-11-11 — Fake CRO conversion due to real provider smoke in scan pipeline

- Fingerprint `powerhouse|scan|production-smoke-entered-real-cro-outcomes|20261111-v1`.
- Original owner `powerhouse-scan-ingest` via Supabase GitHub Integration and original #4198/#4215.
- Evidence: 2 recent real production proof scans (Frisse Blik + Bedrijfslek) created exact durable scan, runtime and growth IDs but `growth_events.is_robot=false`, despite `doel=__PRODUCTION_SMOKE__` and `omvang=verification-only`. Not a paid order or organic customer scan.
- Historical correction: targeted 2-row update on existing `public.growth_events` only, flagged as synthetic; independently 2/2 true, 0 countable.
- Root cause: original scan ingest did not distinguish technical smoke from honest customer observations for downstream CRO/Heartbeat measurement.
- Prevention: exact two-field source classification, still persist true technical provider receipts; synthetic runtime context/quality and conversion robot flag; no new provider writer/executor.
- Regression: `tests/brain-scan-smoke-cro-proof-20261111.test.mjs`; original protected CI and postmerge Edge source readback and proof workflow.
- Outcome: corrected specific historical records; no full multi-tenant connector/Heartbeat business closure.
