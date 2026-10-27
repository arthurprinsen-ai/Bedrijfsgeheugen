# Powerhouse development ledger — 2026-10-20 Source Universe stage regression

Obligation-ID: `source-universe-existing-mux-recovery-20261020`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Current stage: **CANDIDATE**, not LIVE_PROVEN

Observed: 2026-10-20 production active job 171, healthy minute-by-minute mux receipts, missing SQL branch to refresh Source Universe; snapshot remained on 2026-10-19 while `bg_externe_signalen` was updated on 2026-10-20. Its refresh function independently proved successful through the authorized Supabase RPC/SQL readback. Existing v3 overwritten stage originally authored in migration 20261007212000.

Fix: reinstate missing stage through existing scheduler mux, bounded read/process, task receipt and aggregate health; no new clock, token, tenant action or external publisher. Regressions in `tests/brain-source-universe-operational-truth-v1.test.mjs`; canonical learning fingerprint and System Map co-updated.

Acceptance evidence: 1) protected CI and CodeQL exact head; 2) source migration deployed to Supabase; 3) live `pg_get_functiondef` contains minute 54 stage; 4) actual cron job 171 at the next :54 includes source task receipt; 5) canonical snapshot refresh verified; 6) network/site readback if applicable. Keep other P0 customer/finance/outcome gaps explicitly open.
