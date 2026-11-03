# 2026-10-30 · CRO commercial Heartbeat runtime → ONE BRAIN → Andere data
- Fingerprint: `powerhouse|cro|heartbeat-readonly-adapter-not-wired-to-runtime-and-portal|20261030-v1`.
- Source: original Supabase `powerhouse-commercial-heartbeat-runner/index.ts` plus existing `public.powerhouse_cro_conversion_evidence_v1`, `public.powerhouse_cro_experiment_evidence_v1`, `public.brain_records`.
- Actual P0: PR #5177 source helper landed but original natural runner and portal did not consume its seven-gate contract. The 30 October source had 0 independent paid CRO orders and 0 matured control subjects.
- Repair candidate: original runner writes only internally observed, unverified CRO state to one canonical Brain daily key; exact independent readback; protected owner-only Portal Andere data displays separated technical and business closure. No provider messages, scheduler, new database, BG211 restart or synthetic orders.
- Safety: no RLS bypass or browser service token; Edge retains existing service-token verifier and existing verify_jwt setting; portal retains original admin Identity and tenant canonical.
- Regression: `tests/brain-cro-commercial-runtime-portal-20261030.test.mjs` plus existing portal CRO tests.
- Terminal: Required/BRAIN/CodeQL, protected main, exact deployed Netlify and Edge readback, natural Heartbeat sample, two authenticated portal tenants and verified business results **not inferred**. Attach provider version IDs and actual independent outcomes before marking LIVE/GREEN.
