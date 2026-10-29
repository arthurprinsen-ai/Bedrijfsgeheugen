# Powerhouse release ledger — bounded CRO PostgreSQL constraint validation

- Date: 2026-10-29. Parent incident #5141; protected predecessor PR #5153 and production migration `20261029182000`.
- Actual PostgreSQL proof after #5153 merge: `bg_interacties_gebeurtenis_check` allows exactly 17 Edge-compatible types, `convalidated=false`. No independent human opt-in conversion or paid order is implied by this state.
- Cause of outstanding status: predecessor deliberately used `NOT VALID` to avoid scanning a ~750k-row production table while acquiring a short exclusive lock. Existing 7-type rows were previously validated, but catalog validation remains outstanding.
- Narrow candidate: new migration `20261029185000_bg_cro_validate_event_types_v1.sql` runs `VALIDATE CONSTRAINT` with 2-second lock wait and 30-second statement budget. Does not disable check, remove rows, replay events, weaken RLS or touch site scheduling.
- Tests: existing wired `tests/cro-measurement-contract.test.mjs` checks bounded validation migration; BRAIN canonical replay/shadow/canary uses `tests/brain-cro-other-data.test.mjs`.
- Release gates: exact-head Required/BRAIN/CodeQL, protected merge, genuine Supabase migration history, `convalidated=true` and 17-event catalog source parity; stop and log timeout/lock problems rather than retrying unsafely.
- Afterward close only the **schema validation** obligation. Human consented UID→HTTP200→DB/upsert→duplicate ACK→owner portal evidence, qualified leads, paid orders and CRO causality remain separate `UNVERIFIED` stages.
- Agents remain ONE BRAIN / Powerhouse / Heartbeat with existing SEO Order Engine and Growth & Revenue OS; log the actual writer, SHA, provider, root cause, test, action and effect, no extra scheduler or fake outcome.
