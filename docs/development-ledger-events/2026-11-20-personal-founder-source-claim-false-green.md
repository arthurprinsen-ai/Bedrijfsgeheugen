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
