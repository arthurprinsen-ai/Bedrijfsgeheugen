# Original personal publisher content truth false-green — 20 Nov 2026

- Obligation-ID: `powerhouse|linkedin-personal|verified-founder-user-fact-extrapolation-false-green|20261120-v1`
- Parent source incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5913
- Source: 41521982-5e5c-4f6d-9540-6a32912862b6, original 20 Nov user-authored design direction only, with no claim of personally experienced team/client work or achieved customer outcomes.
- Protected original v2 source-repair PR #6068 merged and migrated; original content writer produced text with fabricated direct-team experience and achieved outcome as though first-person; original 200/PASS reviewer lacked semantic source-claim guard.
- Original 20-Nov provider-write receipt URN: urn:li:share:7529541605742018561, URL https://www.linkedin.com/feed/update/urn:li:share:7529541605742018561/
- Original GET exact provider readback: 403 Forbidden; obligation PUBLISHED verification_pending=true, NOT LIVE_PROVEN exact public content parity. No fake independent green.
- Root cause: accepting first-person source metadata as a blanket authorization to narrate arbitrary first-person events and outcome claims not in source text.
- Fix: new source-scoped mandatory veto in existing shared personal gate for specific user-directive-only founder event; original writer prompt and historical+shadow+canary replay. Retain strict original review, final SHA, provider token/URN and dedupe. No new sender/publisher.
- Already public post has no independent edit/delete confirmation. User-facing publication link and content caution mandatory. Never repost to correct without explicit safe original same-URN mechanism.
- Status at PR creation: PROTECTED_CANDIDATE, not production; current post remediation OPEN.

- Protected preflight failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44748661697 (six original migration-history tests failed). Original provider 888 applied migration records; immutable source lock 886. Restored exact provider-applied security migration 20261120134537 SQL from original provider statements and appended exactly original 20261120134537 + personal 20261120143500 identity records to existing lock, preserving old 886 rows. No SQL replay, no RLS change, no CI gate bypass. Re-test required.


## Original migration lock preflight reconciliation (20 Nov, current source candidate)

The existing Required preflight rejected two premature attempts to change `supabase/migration-history.lock.json` together with the missing executable SQL under `supabase/migrations/20261120134537_security_pw_mo14_private_player_data_20261120.sql`: `UNEXPECTED_PROTECTED_BASE`. The immutable lock remains **exactly as protected main** in this source-only PR. The new security SQL source is byte-for-byte reconstructed from the original provider's `supabase_migrations.schema_migrations.statements` for the already applied native migration, not a newly invented or rerun migration. The other provider-applied personal source migration `20261120143500` is already committed to main in #6068.

The original provider attested 888 applied versions with two new identities after the protected 886-entry source lock. **After** a protected PR merges the exact missing executable SQL source, the source-lock 888-entry append must be handled as a separate canonical reconciliation PR with the unchanged 886-prefix and independent native provider check. Do not waive the protected migration gate or predeclare a new migration as applied. Until both steps are proven, the migration-history reconciliation remains OPEN. This does not undo or re-send the existing LinkedIn post.


## 20 November — corrected native 888 exact-source reconciliation supersedes provisional two-stage plan

The original two-stage source-then-lock plan above was **not viable**: production/main had applied/executable founder migration `20261120143500`, while the source-lock still stopped at `20261119090500`. Source-only candidate left one unaccounted executable migration, so 28 existing protected migration tests correctly failed. A lock-only candidate with missing earlier executable security SQL could not prove full original parity. Neither original control was disabled.

The repair therefore uses a one-time `verifyAlreadyAppliedProvider888SourceLockRecovery` in the **same** original `tools/ci/protected-supabase-pr-migration-tests.mjs`. It is pinned to original protected main SHA `a5684e6b376271b37eb27853a826f147c7425d6a`, one added SQL file `20261120134537_security_pw_mo14_private_player_data_20261120.sql`, all existing 886 migration identities unchanged, exact new 887/888 provider-applied identities and immutable source-lock prefix, and the independently observed native SQL MD5 `87410f524c200d30bfaf64a4e72d02ee` for the security change. It verifies that security RLS remains enabled and the earlier founder RPC remains service-role-only, with independent negative tests for alternate base, tampered source, history edits or changed rights. Native hosted Preview, Required, CodeQL, protected merge, production source readback and final provider post readback remain separate mandatory acceptance. This is a bounded historical reconciliation, **never a generic migration waiver** and never permission to replay either applied SQL.
