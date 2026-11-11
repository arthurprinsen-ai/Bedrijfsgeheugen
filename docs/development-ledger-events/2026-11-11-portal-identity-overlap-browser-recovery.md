# 2026-11-11 — original Portal V2 identity-hydration and nested BusinessInput handoff

Parent obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: portal|v2|deep-link-hydration-and-overlapping-source-snapshots|20261111-v1
Delivery-Lane: portal
Candidate-Type: recovery
Writer: original Portal V2 / ONE BRAIN BusinessInput
Base-SHA: 8220286effffce70d436b58d4ce5f3dbec2907c1

## Observed original production evidence
PR #5596 successfully passed protected Required/CodeQL and exactly deployed to Netlify at commit 8220286 / provider deployment 6af404a98712ccea070b9e08. Its independent production browser suite (run 42969509727) returned 12 pass, 4 fail, 1 skipped; BRAIN delivery terminal acceptance remained red. This is a real quality failure, not a reason to skip protected E2E.

First failure: initial route became hidden at `#portalView`, `aria-hidden=true`. Another: the `ai-scan` native workspace was absent. Third: mobile DOM context was destroyed by navigation. Fourth: demo multi-capability state write threw PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT at domain-state.js:375. The initial anonymous/signed-in boundary and overlapping original section bindings are specific source-level repair targets.

## Cause / implementation / prevention
False initial anonymous identity change could clear a valid deep-link. Use a stable initial anonymous sentinel and an authorized original post-hydration re-open, while always revoking prior tenant DOM when a genuine identity boundary occurs.
Multiple related customer edits created stale ancestor snapshots before original Brain submission. Resynchronize in-memory overlapping pending section snapshots at the existing state revision; keep real stale-replay refusal unchanged.
Prevent recurrence with new nested-write and deep-link source regression tests and the unchanged production browser acceptance gate.

## Observability
Status: CODE_CANDIDATE until protected CI, exact main and production E2E prove repairs.
No claim of comprehensive tenant-specific Brain/Heartbeat consumer completion, persistent provider-generated results or all fields green.
Original issue #4215 remains OPEN; do not create parallel system, manual cron or fabricated receipt.
