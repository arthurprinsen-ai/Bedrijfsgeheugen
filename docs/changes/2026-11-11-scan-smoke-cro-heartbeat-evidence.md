# 2026-11-11 — Production smoke scans are not real CRO or Heartbeat outcomes

Parent #4198; related #4215. Fingerprint: `powerhouse|scan|production-smoke-entered-real-cro-outcomes|20261111-v1`.

## Verified independent production observation

After protected release #5628, the existing original `Powerhouse Scan Production Proof` workflow exercised both public scans against the actual canonical Edge and created two new `scan_inzendingen` rows (one Frisse Blik, one Bedrijfslek), both with `doel='__PRODUCTION_SMOKE__'`, `omvang='verification-only'`. Real source / Powerhouse / growth consumer IDs existed and all were stored correctly. However the corresponding original `growth_events` rows had `is_robot=false`, incorrectly categorizing system validation as customer interest. The original `powerhouse_runtime_events` records likewise carried the general `OBSERVED / aggregate_only` status. This could bias scan→conversion reporting and Heartbeat learning. These provider smoketests are useful technical E2E, not genuine customer leads, clients, qualified commercial opportunities, or paid orders.

## Scoped historical repair (already executed)

Two exact original smoke growth rows with the same `scan:<submission_key>` and matching original scan IDs were updated `is_robot=true` plus `payload.synthetic_production_smoke=true,measurement_scope=NOT_CUSTOMER_CONVERSION`. Original direct Supabase readback: 2/2 marked, 0 still `is_robot=false`. No scan, lead, email, tenant claim, or revenue produced.

## Original source prevention

Inside existing protected Supabase `powerhouse-scan-ingest` only, classify smoke when BOTH canonical fixture fields match. Original Powerhouse runtime events carry `data_quality=SYNTHETIC` and `context.learning_scope=testing_only`. Original `growth_events` keep the same independent readback, original event ID and scan ID, but set `is_robot=true`, `synthetic_production_smoke`, and `measurement_scope=NOT_CUSTOMER_CONVERSION`. Real anonymous scans remain `OBSERVED` and `ANONYMOUS_SCAN`. Do not suppress the provider E2E, sever its original technical evidence or invent customer identity.

## Gate

The original protected Required, BRAIN, CodeQL, System Map, Netlify current-main and **Supabase GitHub Integration original Edge deployment plus byte-for-byte provider readback** are mandatory. Replay `tests/brain-scan-smoke-cro-proof-20261111.test.mjs` in historical/shadow/canary and actual existing Powerhouse Scan Production Proof after release; expected provider smoke rows must retain technical source→consumer proof while being excluded from real conversion learning. This is a technical-data-truth repair only; no genuine authorized source→provider→outcome→next-cycle Heartbeat loop is implied. No parallel scanner, cron, new store or client identity.
