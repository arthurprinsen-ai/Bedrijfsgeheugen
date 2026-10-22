# P0 #4681 — Brain failure observation evidence continuity

## Context / root cause
Production `public.brain_observe_failure` used `evidence=coalesce(p_evidence,evidence)`, overwriting older promoted JSON every time another agent logged a recurrence. The same physical cron run was reported as `cron-46:121040` and `supabase:cron:job46:run:121040`. Audit showed 20 raw records for 11 unique normalized runids. Raw occurrences remain historic evidence, not 20 distinct outages.

## Smallest corrective delta
- Versioned migration `supabase/migrations/20261022172200_brain_failure_observe_preserve_evidence_v1.sql` changes only the canonical `brain_observe_failure` RPC. New observations are kept in append-only `brain_failure_occurrences` while existing `brain_failure_registry.evidence` is preserved. Maturity/CAS `brain_promote_failure` is unchanged.
- Known Supabase cron alias formats map to one job/run identity with `pg_advisory_xact_lock` to prevent two writers from counting the same physical event twice. Exact same ID/different SHA and contradictory provider status remain fail-closed. Unknown ID formats keep existing exact identity behavior.
- Existing `SECURITY DEFINER` function preserves a pinned search path and `service_role`-only execute authority. No new scheduler, table, preview, registry, or paid resource.
- Existing legacy duplicate raw rows remain intact. Reporting must show raw 20 versus distinct semantic 11 separately; this migration prevents **future** duplicates through the canonical RPC but does not rewrite historical counts.
- Backend regressions: `tests/brain-failure-observe-preserve-evidence-v1.test.mjs` and the transaction-only SQL replay `tests/sql/brain-failure-observe-preserve-evidence-v1.sql`. The replay uses isolated synthetic IDs, validates evidence preservation, alias dedupe, status/hash conflicts and ACL, then rolls back.

## Write incident caught during construction
One GitHub migration-file update was corrupted by JavaScript `String.replace` treating a literal `$'` inside SQL as the replacement special token (suffix of original string). The malformed candidate was replaced immediately using the immutable pre-edit file and a callback replacement. No production side effect, and the prevention is embedded in the canonical Brain learning file. Verification of the corrected migration (single `BEGIN`, function, `COMMIT`, event lock) remains part of source CI.

## Release: fail closed
**Code candidate, not production/live.** Do not apply this migration directly through production SQL editor. Follow existing current-main migration reconciler, protected Required CI+CodeQL, a provider-backed isolated preview test, protected merge and production RPC/security/evidence readback. Live commercial cron P0 #4215, PR #4558 and PR #4630 are independent and remain open. This fix must not fake their performance or two-tenant acceptance.
