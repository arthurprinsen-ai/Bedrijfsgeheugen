# Chat writeback blocker preflight integration — implementation plan

Goal: make the already-merged canonical Make BG168→BG166 capacity blocker reachable from the existing ACTIVE Chat→Brain preflight without creating a second memory system or duplicate incident record.

## TDD sequence
1. RED: current-session regression requires `brain/learning/chat-make-writeback-blocker-2026-08-31.json` and fingerprint `brain-writeback-make-team-paused-limit-v1` in compiled Brain preflight.
2. GREEN: link the already-merged blocker from `chat-materialization-2026-08-31-v3.json`; enrich the same record with machine-readable blocker state/prevention and exact-once replay/readback obligations only if needed by the compiler contract.
3. Verify exact head through Brain foundation, Shared Agent Memory, BG168 materiality and Unified BRAIN delivery.
4. Respect moving-main conflict index; rebuild from current main rather than force when overlap exists.
5. Runtime BG168→BG166 writeback remains OPEN until Make capacity is directly executable and one replay plus downstream readback succeeds.

No paid capacity changes, credential changes, permission changes, retries against unchanged hard boundary, or raw chat dump are part of this delivery.
