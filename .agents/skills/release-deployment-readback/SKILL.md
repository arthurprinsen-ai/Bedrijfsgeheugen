# Release, Deployment and Production Readback

## Objective
Never conflate a successful GitHub CI/release with an actual Netlify deployment, or a deployment with verified production health.

## Required three dimensions
1. GitHub release: merged AND required checks passed (otherwise pending/failed).
2. Netlify deployment: required? If explicitly false, show NOT_REQUIRED (neutral, not an incident) with a reason. If true, report provider-verified success, pending or failure. If unknown, report UNKNOWN.
3. Production readback: if deployment not required, NOT_REQUIRED. Otherwise PASS only when a recent independent production fetch matches the expected release identifier; a successful CI run or Netlify API response is insufficient.

## Source of truth and UI contract
Use `tools/netlify/release-status.mjs` as the common status classifier; UI should render three individually labeled indicators plus overall. Status values: passed, pending, failed, not_required, unknown.
Display timestamp, GitHub SHA, Netlify deploy ID, production release ID when available; never invent them. Document no-deploy reason. Treat unknown as neutral/pending, not green. Never bypass required checks or fabricate readback.

## CI/CD agent behavior
- Determine whether changes affect deployable output using the existing repository-specific deployment policy and diff/build evidence. Do not guess from commit title.
- When no production deployment is needed, set `deployment.required=false` and a concrete reason. Do not trigger Netlify; do not page on this skip.
- When required, deploy through authorized protected process and independently validate production before green.
- Run `node --test tests/netlify/release-status.test.mjs`.
- Integrate this classifier into the existing dashboard adapter and replace any legacy boolean 'deployment failed when skipped' logic; use the same contract in the agent reporting layer.

## Acceptance criteria
A merged green docs-only CI run has three clear statuses PASS / NOT_REQUIRED / NOT_REQUIRED and green overall, while required-but-missing deploy or readback cannot be green. Failed provider deployment or fresh production mismatch is red. Stale readback stays pending.

## P0 #4215 — original Supabase migration history to ONE BRAIN acceptance

Every original protected SQL release keeps ONE provider authority, ONE canonical GitHub `supabase/migration-history.lock.json`, and the original ONE BRAIN consumer. On each postmerge run, independent read-only Supabase `supabase_migrations.schema_migrations` readback is required before the existing owner appends exactly that applied version/name to the lock. Preserve the entire immutable applied prefix and validate every executable `supabase/migrations/*.sql` file against that version/name; a SQL source file or Required/CodeQL success is not evidence that its migration was applied. A provider-applied SQL migration absent from the current source lock is a typed `SOURCE_LOCK_DRIFT` incident; repair by the SAME protected owner and one source-only PR, never by re-applying SQL or bypassing BRAIN.

The original `agent-data-quality` performs `reconcile-native-applied-supabase-migration-lock-before-postmerge-brain-green` and verifies exact source-prefix/CI parity on the merged main SHA. Run existing full BRAIN delivery after the protected source-only merge and preserve exact root-cause, regression, source and consumer receipts in ONE BRAIN plus the existing human change/ledger. The real canonical `powerhouse_content_handoff_receipts_v1` source-revision tenant/correlation consumer ACK is independent proof; provider migration parity alone never implies Instagram publish, LinkedIn performance measurement, Heartbeat processing, Portal customer effects or CRO learning. Never create a second scheduler, table, agent, worker, migration or publisher. Reference: `tests/brain-native-841-source-lock-original-consumer-ack-20261113.test.mjs`; original P0 #4215 / #4198.

## 13 November 2026 — permanent original ONE BRAIN terminal migration readback

The original production terminal workflow `.github/workflows/obligation-terminal-closure.yml` already invokes `tools/delivery/supabase-migration-production-readback.mjs`; do **not** introduce another watcher, cron, scheduler, sender or writer. This original verifier must now accept a Supabase migration only after independent provider `supabase_migrations.schema_migrations` matches both the exact `version` **and** exact `name` from the protected merge diff; versions alone are never sufficient. From migration `20261113083000` onward, every migration-only terminal readback must additionally verify on the real production provider that `brain_content_handoff_terminal_proof_guard_v1` is installed and **enabled** on `public.brain_obligations`, calls `public.brain_guard_content_terminal_proof_v1` as an invoker function, denies `anon/authenticated` invocation, and still contains the exact consumer ACK, veto and outcome rejection classes. If anything is absent, respond `SUPABASE_ONE_CHAIN_TERMINAL_GUARD_NOT_ACTIVE` and preserve P0 #4198 as EVIDENCE_DUE, never merge an invented provider success or close the original obligation.

The native migration/source-lock writer remains the **only** owner for applying missing migrations or restoring true provider/source parity. Reconcile original production readback, provider-applied identity, protected migration source lock, then repeat the original postmerge terminal/Brain receipt without blind provider replay or a new scheduler. A successful trigger-proof readback still does not prove all Instagram/LinkedIn/blog publications, tenant Portal consumer effects, CRO outcomes, learning or revenue. Source regression: `tests/brain-supabase-migration-production-readback-v1.test.mjs`. This rule is a fail-closed release gate, not a promise of zero future incidents.
