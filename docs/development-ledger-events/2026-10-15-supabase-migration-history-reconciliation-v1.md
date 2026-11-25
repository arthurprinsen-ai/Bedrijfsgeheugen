# Development ledger — Supabase migration-history reconciliation, batch 1/2

- Date: 2026-10-15
- Obligation-ID: supabase-migration-history-reconcile-20261015
- Production project: adhjwmvyoixzjtmiroln
- Source of truth: supabase_migrations.schema_migrations(version,name,statements), read-only; no production SQL executed during reconstruction.
- Original drift: 702 applied migrations in Supabase, 680 Git SQL files at base f603b1d4e596f37416f68817ac8ece103a320f79; 43 remote-only and 21 Git-only timestamps.
- This reviewable batch: restore 33 of the 43 remote-only historical SQL files byte-for-byte except trailing newline; remove ten proven exact-content duplicate alias paths from Git.
- Follow-up batch: 10 later applied migrations (20261014130614 through 20261014195237) deliberately not part of this PR due repository HARD_SCOPE_LIMIT_EXCEEDED maximum of 40 changed files.
- Eleven nonidentical Git-only SQL files remain subject to independent semantic and live-state review; no fake applied status.
- No deployment, history table mutation, bypass or outbound sends.
- Regression: tests/brain-supabase-migration-history-reconciliation.test.mjs (33 restored versions and 10 removed aliases).
- Acceptance: exact-head Required/CodeQL green; protected merge; follow-up batch merged with its own admission; remaining eleven appropriately reconciled; native Supabase provider migration success, then Edge version/source parity and provider social receipts.

## Historische SECURITY DEFINER-ACL readback, 2026-10-15

The original stored migration SQL for versions 20261010070959 and 20261011083139 was compared to the exact Git files (both content-identical excluding the final newline). Live pg_proc/proacl readback for both affected public functions confirmed SECURITY DEFINER=true, anon EXECUTE=false, authenticated EXECUTE=false, service_role EXECUTE=true and explicit deterministic search_path. The existing security gate's historical-production-mirror SHA allowlist is extended only for those two byte-exact Git blobs. Any modification changes the SHA and restores fail-closed security validation; no PUBLIC_INTENTIONAL escape and no loosening of production ACLs.

## Follow-up: Supabase preview replay root cause

- Failed external preview on PR #4383: SQLSTATE P0001 `CANONICAL_CONTENT_EXECUTOR_IDENTITY_MISMATCH` while applying `20261011083139`.
- Read-only production cron truth: job 140 is canonical and active, 59 total cron jobs; SQL function EXECUTE permissions anon=false, authenticated=false, service_role=true.
- Preview branch cron truth: 52 other `cron.job` rows, no copied canonical job 140 or matching `powerhouse-content-orchestrator%` job.
- Original provider-applied SQL preserved as immutable Git blob `043b74b1b87e2f0d45b332ad9f579878e6e60bce` and provider `schema_migrations.statements`.
- Source intentionally adapted only for safe deterministic replay when *no conflicting content-owner cron job exists*; the unrelated preview crons remain untouched. Any partial populated cron environment still fails closed. No scheduler created, no provider sends, no history record altered.
- Explicit function EXECUTE revocation and grant added. Normal SECURITY DEFINER scanner now applies (legacy source SHA exception removed).
- CI and Supabase provider Preview must independently pass on this revised exact SHA before merge; this note is not release approval.


## Follow-up: identity-graph migration replay

- Subsequent native Supabase Preview passed the original content owner guard, recorded `20261011110000`, then failed with `job_id can not be NULL` while replaying the original `20261011111234` identity-graph `cron.alter_job`.
- Original production state: job 138 `powerhouse-identity-graph-v1` is active. Native preview: no job with that name.
- Both historical sources `20261011111234` and `20261011111903` now perform bounded `cron.alter_job` only if the existing canonical job matches exactly. Absence in preview is no-op; naming collisions are fatal; no job created and no runtime dispatched.
- Original immutable Git blobs: `1cd548f57e39706ed25203391594f7db8c51e797` and `a514b402c3d53905d3cfc42de907dc5623a2a338`.
- SQL additions are **replay adaptations** rather than byte-identical provider-source mirrors; they do not rewrite the applied production migration ledger and do not satisfy release acceptance without exact-head independent CI/provider proof.


## Source replay preflight: other original identity-graph assumptions

- Historical versions `20261011112359` and `20261011112921` also used a missing or hardcoded identity-graph job number. Their source-only replay guards now select the canonical name and no-op solely when no conflicting identity owner exists.
- Version `20261013145630` originally threw on absent owner during contact-authority attachment. The preview case now no-ops if there is no matching/conflicting identity owner, while preserving the fail-closed name-conflict and original owner-command checks.
- Original stored SQL blob identifiers: `b9659bdff8c21d2e86ea9d6b90ef98776a3cc4d8`, `35f1e0c81113ad58b7dbbd8a4ad4b0c1ad03f5fc`, `2f540d7260cf9e6c060232a5b997a8d5af0fc82f`.
- All five adapted identity-graph migration sources leave `cron.schedule` absent; they cannot create a new scheduler. No applied production migration-history row is updated.
