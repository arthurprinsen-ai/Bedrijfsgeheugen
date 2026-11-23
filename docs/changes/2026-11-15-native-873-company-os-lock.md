# Native provider migration 873 — original Company Intelligence source lock

## Independent product release
Existing protected PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5892 merged at `995353f3fef886314339ef98e102fc4a6b69f1c4`; Required, native Supabase preview and both CodeQL passed. Actual EU production Supabase `adhjwmvyoixzjtmiroln` applied the one SQL migration `20261115235900_company_intelligence_existing_daily_source_receipt_v1` as native history **873**, verified at `2026-11-15T17:38:12.470160Z`. Original immutable Git migration lock remained at 872, latest version `20261115235500_sales_action_reexecution_immutable_attempt_lineage_v1`.

The production Company Intelligence record `company-intelligence-os:2026-11-15` independently read back original commercial event `f846c546-d358-46cb-a9e7-078b70934469`, source dedupe `trigger-based-mkb-acquisition:2026111517`, and the same original daily self-improvement consumer ACK. Existing job #107 active. This is *source receipt*, not independent customer value: native financial forecasts and realized value remain zero and original ONE BRAIN financial obligation stays OPEN.

## Lock ACK only, no repeat database mutation
Append only the actual version/name to existing `supabase/migration-history.lock.json` and advance captured_at to native observation time. Preserve all 872 earlier source identities. No new SQL, migration, scheduler, queue, agent, sender or release-bypass. The original existing test `tests/brain-original-native-873-company-os-source-lock-20261115.test.mjs` compares the full exact source identities to the provider history. Protected CI/CodeQL and main merge, followed by independent native 873/873 readback, are required.
