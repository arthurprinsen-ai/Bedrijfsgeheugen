# Terminal migration lineage: exact identity before name fallback

## Reproduced failure

The corrected production closure of merged [PR #4118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4118) [run 37756633885](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37756633885) stopped at `SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS:powerhouse_identity_graph_replay_baseline_v1`. Current protected main legitimately contains both production-relevant original SQL `20261008080905_powerhouse_identity_graph_replay_baseline_v1.sql` and its earlier idempotent replay baseline `20261007063438_powerhouse_identity_graph_replay_baseline_v1.sql`.

The old name-only reconciliation threw on more than one match, although the PR's exact migrated version existed in the current repository and Supabase production ledger. This was a **false terminal rejection**, not a license to remove historical SQL or manipulate migration records.

## Single fail-closed correction

One pure helper `tools/delivery/terminal-migration-identity.mjs` implements the correct order: exact `(version,name)` match wins; when exact is absent, a single same-name successor is allowed; multiple same-name alternatives are rejected as ambiguous; malformed identities and missing production proof remain failures. The original canonical terminal workflow imports that helper and retains all Required/CodeQL, Brain Foundation, production readback, skill projection, and writer authority gates. No duplicate scheduler, migration, production mutation, relaxed permission, status spoofing, or additional workflow was added.

Regression cases replay two distinct version/name pairs sharing a name, one unique historical alias, a truly ambiguous missing exact version, malformed data, and the workflow contract.

## Closure

Protected Required and CodeQL must pass, protected merge must land, then the canonical terminal closure for #4118 must run again on updated main and verify all exact migration identities against the authentic Supabase production provider and current merge ancestry. The natural Heartbeat after original merge was proven at 2026-10-08 09:22:08 UTC, `actioned/VERIFIED` with one public blog proof; this correction only addresses the terminal gate's false ambiguity.

## Terminal retry: cross-heredoc import regression (8 October)
The automatically triggered terminal workflow for protected merged PR #4123, [run 37757775283](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37757775283), failed with `ReferenceError: resolveTerminalMigrationIdentities is not defined`. The prior fix inserted its import in an earlier independent Node heredoc, whereas the migration-scope heredoc actually calls the resolver. This recovery removes the stray import, puts exactly one import next to the invocation, and extends the regression to extract the migration step's own executable Node heredoc before asserting both import and call. Exact migration identity semantics, strict safety, all post-merge provider readbacks and canonical scheduler remain unchanged. This is the same lineage, not permission to mark historical obligations green without terminal evidence.

## Historical checkout / pinned helper authority (8 October)

The latest terminal retry of original [PR #4118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4118), [run 37758314809](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37758314809), failed with `ERR_MODULE_NOT_FOUND: .../tools/delivery/terminal-migration-identity.mjs`. The canonical terminal job intentionally checks out **the original merged SHA 99013007...**, predating the helper introduced by PR #4123. The import had been placed in the correct executable step by #4129, but its target file did not exist in the historical tree.

The terminal step now enforces `git cat-file -e GITHUB_SHA` and `git merge-base --is-ancestor MERGE_SHA GITHUB_SHA`, then reads only the versioned helper blob using `git show GITHUB_SHA:tools/delivery/terminal-migration-identity.mjs`. The static import uses the extracted temporary `.mjs` file. `GITHUB_SHA` is the workflow's immutable dispatch/close-event commit, sourced from protected main; it is not an unpinned remote branch. Original historical evidence checkout, source-of-truth production migration versions, Brain, CodeQL and SQL readback remain unchanged. A regression asserts the pin, ancestor fence, extraction, matching import and historical checkout.
