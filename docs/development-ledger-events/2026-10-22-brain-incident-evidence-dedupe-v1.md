# Development ledger event — 2026-10-22 — Brain evidence preservation

- **Obligation / issue:** `brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1`, [#4681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681)
- **Delivery lane:** backend; one canonical owner; independent of commercial snapshot PR #4558/#4630.
- **Source defects:** live `brain_observe_failure` replaced existing registry JSON on observe; different writers encoded the same provider job/run into distinct occurrence IDs; observed historic raw 20, normalized distinct 11.
- **Migration:** `supabase/migrations/20261022172200_brain_failure_observe_preserve_evidence_v1.sql`, service-role-only function, non-destructive preserve old proof + advisory-lock event normalization.
- **Tests:** `tests/brain-failure-observe-preserve-evidence-v1.test.mjs` + `tests/sql/brain-failure-observe-preserve-evidence-v1.sql` (the latter must run on an authorized isolated migrated provider as a rollback-only regression).
- **Failed candidate write:** JS `String.replace` interpreted literal SQL `$'` as `replacement suffix`, creating a malformed versioned file. Recovered from the immutable prior blob, replaced via callback function and validated that generated SQL has exactly one transaction terminator; no live or provider mutation.
- **Safety:** history preserved; no deletion, rewrite of raw event IDs, extra scheduler, customer-data copy or automatic provider dispatch.
- **Proof status:** source PR pending; no exact-head Required/CodeQL, signed provider preview regression, merge or production readback yet. Not `PROVEN` or `LIVE`.
- **Next owner action:** finish source/skill/relevance test, run CI and rollback-only provider replay, current-main reconciliation, protected deploy, and read back live registry proof without touching commercial #4215 release gates.
