# 2026-10-22 — BRAIN bounded orchestrator source-oracle repair

- Obligation: `ci-brain-orchestrator-pending-oracle-20261022-v1`
- Fingerprint: `ci|brain|orchestrator-pending-selection-bounded-oracle-drift|20261022-v1`
- Immutable baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071/job/119869500824 (not ok 1996; not ok 1998)
- Previous related production incident: PR #2455 is RELEASED; do not reopen or overwrite the old owner
- Root cause: inherited literal test expectations diverged from current bounded cooldown-aware selection and primary/fallback timeout authority
- Scope: `tests/brain-powerhouse-content-orchestrator-pending-selection.test.mjs`, this Brain learning, change document, append-only ledger
- Positive source-readback before write: limit(12), selectNextContentChannel, cooldown no-work reason, primary 90_000, fallback 45_000 — all present
- Effect: source-oracle correction only; original other tests, runtime, providers, scheduler, SQL and tenant access unchanged
- Prevention: read current authoritative source and historical released fixes before changing a source-sensitive oracle; preserve actual bounded/negative safety semantics
- Terminal state: CANDIDATE, full 355 failures NOT RESOLVED; Required/CodeQL and integrated complete BRAIN pending; no production release
