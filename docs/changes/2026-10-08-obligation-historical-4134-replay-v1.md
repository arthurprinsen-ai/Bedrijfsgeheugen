# Replay original Supabase-only terminal obligation #4134

## Evidence
- Original merge: `f8c7f313be234da58326a399d45b5866ff13ca59`.
- Original failing workflow: [#37760879023](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37760879023).
- Historical provider: `powerhouse-composio-linkedin-setup` is ACTIVE at version 29 with runtime SHA-256 `a2adfc1aa924d7289598bb57fce55e9001af51f5cbcc178aba549af898391e31`; provider source matches original merged bytes and main.
- Original PR now contains exact `Terminal-Supabase-Provider-Readback` metadata.
- Registered GitHub workflow reports ACTIVE but rejects `workflow_dispatch` with HTTP 422.

## Recovery
Reuse the existing canonical closure workflow via a narrowly scoped `workflow_call` invocation. The existing historical reconciler runs the replay only when a one-shot marker is newly added on protected `main` in a push, asserts PR #4134 is merged at the known immutable merge SHA and contained on that main commit, then calls the existing closure with `pr_number=4134`. No new terminal writer, deployment path, skipped gates, or direct database state changes.

The canonical called workflow still requires historical exact-head CI/CodeQL, active Supabase provider hash and version, main ancestry, projection where applicable, durable Brain readback and immutable artifact upload.

## Acceptance
Only declare original obligation `LIVE_BEWEZEN` after actual workflow success and database readback for the exact original `Obligation-ID: linkedin-cross-workspace-auth-proof-20261008-v1`. Keep the historic failed run unchanged as an audit trail.

Current state: `PENDING_PROTECTED_DELIVERY`.

The control-plane trigger budget is preserved: no new top-level workflow is introduced. The replay is activated from the existing historical reconciler only for an added marker file, then calls the canonical closure.
