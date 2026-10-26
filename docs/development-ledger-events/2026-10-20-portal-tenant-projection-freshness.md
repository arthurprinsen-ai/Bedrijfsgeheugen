# Development ledger — 20 October 2026 · Portal ONE BRAIN nested source authority

Obligation-ID: `portal|tenant-projection|freshest-nested-merge|20261020`  
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215  
Owner: canonical Portal/ONE BRAIN frontend delivery lane  
Fingerprint: `portal|tenant-projection|nested-freshest-source-readback|v1`  
Evidence: GitHub current-main `portal-v2/portal-state.js`, `platform/read-models/portal-projection-layers.mjs`; Supabase live schema and 2026-10-20 observation; direct previous/next state static replay.

Symptoms: user-edited nested properties could disappear or revert when composed canonical layers are loaded on another portal page. Customer changes, BI, AI governance/CSRD and dashboards then disagreed despite successful previous ACK.

Root cause: unversioned shallow merge of nested customer `portal` keys with last fixed precedence to canonical projection. Confirmation timestamps existed but were not considered.

Change: reuse existing deep BusinessInput merge function and sourceUpdatedAt order to choose matching field precedence; preserve unshared fields and explicit values; cross-tenant fail-closed check. No additional database, cron, provider connector, unverified data or duplicated authority.

Regression: existing `tests/brain-portal-source-truth-20261019.test.mjs`; detailed audit lives in parent #4215.

Release status: **CANDIDATE**. Required CI, CodeQL, production readback, two tenant-authenticated browser/projection readbacks and learning outcome pending. Avoid terminal DONE until the latest real provider and browser receipts are attached.
