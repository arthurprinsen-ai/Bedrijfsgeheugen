# Append-only development ledger event — BRAIN bounded Anthropic fanout oracle

- Date: 2026-10-22
- Obligation-ID: ci-brain-anthropic-bounded-fanout-oracle-20261022
- Fingerprint: ci|brain|anthropic-content-loop-bounded-fanout-stale-singleton-oracle|20261022-v1
- Parent issue: #3742
- Original run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071
- Original not-ok: 114 of 355 on exact separate PR #4641 head (3,526 total).
- Original test: tests/brain-anthropic-subcall-deadline-p0-4198.test.mjs
- Canonical runtime sources (unchanged): supabase/functions/powerhouse-content-loop/index.ts and supabase/functions/powerhouse-content-orchestrator/index.ts
- Root cause: stale singleton source oracle; current bounded 4-channel fanout and in-flight interlock.
- Recovery: replace two retired textual assumptions with stronger current source-invariant checks, keeping all other coverage.
- Evaluation: historical replay, shadow, canary; pending CI/CodeQL/full BRAIN/clean-room/customer acceptance.
- Status: CANDIDATE; no terminal green, runtime deployment or production claim.
