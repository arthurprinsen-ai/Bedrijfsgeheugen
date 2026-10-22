# Correct terminal supersession migration false-red — 2026-10-22

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681  
Obligation: `delivery|terminalizer|unmerged-superseded-migration-false-red|20261022-v1`

The existing protected #4697 Brain migration was independently applied in Supabase production. A later canonical terminal replay run 39840439339 passed its migration provider readback but then rejected the retired, unmerged #4686 path `supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql` solely because #4686 also proposed SQL.

The terminal lineage now distinguishes **covered predecessor SQL** from **missing predecessor SQL**. An unmerged path is safely replaced only when its exact filename was collected from a real merged same-obligation successor AND is still on protected main. A missing path, unknown extra migration, wrong obligation, or any production provider discrepancy remains blocked.

Regression: `tests/brain-terminal-superseded-migration-proof-v1.test.mjs`, including the actual #4686 → #4697 case and four negative controls. The terminal migration provider verification, Required/CodeQL, evidence persistence and review contracts are unchanged. No new scheduler, registry, synthetic production data, bypass, or SQL DDL. This source change is **not live** until protected merge and fresh terminal PR #4697 readback. Original cron #46 timeout under #4215 remains separately red.
