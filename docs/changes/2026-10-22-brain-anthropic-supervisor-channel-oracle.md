# BRAIN inherited Anthropic supervisor source-oracle repair — 2026-10-22

Fingerprint: `ci|brain|anthropic-supervisor-bounded-channel-oracle|20261022-v1`  
Parent: [P0 #3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742); related [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Evidence and root cause

Independent [Unified BRAIN verification-only #39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071/job/119869500824) reports 355 failures / 3,526 tests on its own candidate head. Case 114 in `tests/brain-anthropic-subcall-deadline-p0-4198.test.mjs` expects two retired implementation symbols (`MAX_CHANNEL_GENERATIONS = 1`, `bootstrapAttempted`). Direct current-main source readback instead finds one 90s provider call bounded by the 110s supervisor child, a 240s loop lease, a single bootstrap whose indeterminate result forbids a second generation, and up to four deduplicated independent channel invocations.

## Correction and prevention

Preserve the original two tests and the positive final-copy/identity requirements. Replace only the two stale textual assertions with positive executable source assertions for the actual lease, no-repeat bootstrap, deduplication, maximum four channels, and channel-scoped fan-out. Do not modify runtime, senders, approval, auth, secrets, SQL, scheduler, provider configuration or production.

Every new test-source contract must first inspect the canonical current implementation, preserve fail-closed negative conditions, and remain bound to immutable exact-head CI. The machine-readable BRAIN learning item enrolls the original test path in historical, shadow and canary evaluation. Shared skill writeback remains pending coordinated owner evaluation, not falsely completed.

## Exit gates

Required CI, backend and CodeQL on exact candidate SHA; independent *full aggregate* Unified BRAIN **0 failures**; supported #3742 Supabase clean-room replay/provider parity and genuine two-tenant #4215 readback. This candidate is DRAFT and is not production green based on a single repaired source oracle.
