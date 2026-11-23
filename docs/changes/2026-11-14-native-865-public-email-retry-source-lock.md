# Native Supabase 865 source-history reconciliation — original work-email retry repair

Original parent P0: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Released original dispatcher: [PR #5817](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5817) on immutable protected main `359329c9340296e755285836c1980216d7bdc7b6`.

## Verified provider/source facts
Read-only production SQL at 2026-11-14 21:34 UTC confirms applied native migration count **865**, with sole new original version/name:
`20261115001500 original_public_email_overdue_source_replay_dispatch_v1`.
Original protected source lock held 864 rows, with **zero** prefix conflicts against all 864 native first pairs; only this exact 865th native-applied pair is missing in Git source lock. Native `pg_get_functiondef` independently contains the original `v_due_original_retry` dispatcher gate. No producer/consumer/business outcome is implied.

## Original GitOps-only repair
Append the exact real 865th version/name to the original `supabase/migration-history.lock.json`, preserving all first 864 exact identities. Set `captured_at` to native observed UTC. Commit original ONE BRAIN machine learning, human change report and append-only ledger. **No SQL apply, additional cron, writer, worker, message send, CRM, entitlement or paid provider.**

## Acceptance
Protected exact-head Required migration replay + CodeQL + applicable checks; protected merge; independently compare original current Git main source lock to native production provider (865 of 865 pairs exact, 0 conflicts). Never mark source lock green from a PR alone or claim the commercial source research closed. The 8 source retry actions, absence of new contact candidates, original #138 `PROCESSED`, Heartbeat effects, and P0 remain separately tracked until real natural-run readback.
