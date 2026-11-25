# Commercial contact authority: bounded supplemental Heartbeat — P0 #4198 / #4215

Date: 2026-10-20
Obligation-ID: commercial|contact-review-quarterhour-deduplication|20261020
Base main: 1282c3a1a04f2d0c5703b66419c6214620cdb2d7
Status: CODE_CANDIDATE; production not yet admitted

Live source review from deployed Supabase Edge `powerhouse-commercial-heartbeat-runner` version 224 verified every-tick call with p_limit=500, 16s statement timeout. Postgres/Supavisor and function logs show repeated failed calls. Existing canonical identity cron job 138 is ACTIVE. Fix operates only on existing runner and existing runtime event dedupe; no new scheduler or service.

Known production blockers: the prepared SQL-index migration #4537 fails with 57014 and queue migration #4536 fails with 55P03. Both must be treated absent/unproven, not repeatedly applied without load controls and readback. Protected SQL source is already merged; this scoped PR reduces the unbounded supplemental caller first.

Gates: Required/CodeQL/preview, protected merge, exact source deploy and readback, provider receipts, timeout trend and verified final tenant-data plane. No false-green.
