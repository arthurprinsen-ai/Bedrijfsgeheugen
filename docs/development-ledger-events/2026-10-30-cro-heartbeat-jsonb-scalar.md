# 2026-10-30 · Original natural CRO JSONB readback incident
- Exactly one production natural Netlify background POST at 08:22Z invoked original Supabase Edge Heartbeat after PR #5178 release. Existing canonical Brain daily record inserted.
- Source observed: `public.brain_records` tenant canonical, key `cro-commercial-evidence:2026-10-30`, `payload` type STRING; `payload->>'contract'` absent. Original post-commit reader correctly marked readback unverified.
- Root cause: postgres.js JSON-string bind with inferred jsonb type serialized string scalar. Not fake customer data.
- Candidate: explicit text-to-JSONB parse and `jsonb_typeof(payload)='object'` post-commit check, no scheduler or queue replay.
- Regression: existing `tests/brain-cro-commercial-runtime-portal-20261030.test.mjs`; ensure protected exact-head and natural next run.
- Read-only Portal status and real order/payment/learning are separate obligations and not green until proven. Incident registered in existing ONE BRAIN failure registry, OBSERVED.
