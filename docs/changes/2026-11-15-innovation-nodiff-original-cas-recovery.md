# Original innovation builder: preserve legitimate no-diff decisions without false-green
Date: 2026-11-15. Canonical owner: original Powerhouse Daily Self Evolution and original Engineering agent.
Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Actual failure
Original GitHub workflow run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43752164113 (job 132928288752) selected the original commercial message source-context correction. The workspace-only Codex agent found the existing correction and matching positive/negative tests, and correctly modified no files. The deterministic validation then raised `ORIGINAL_INNOVATION_CODE_PATH_SCOPE_OR_EVIDENCE_MISSING` because the existing guard required a code+test+learning diff even when no change was appropriate. No source modification, PR, consumer acknowledgement, deployed innovation, measured benefit or savings resulted from that run.

## Bounded repair in SAME original workflow
The existing `scripts/brain/innovation-original-code-delivery.mjs` now classifies a genuinely empty tracked+untracked diff as `NO_DIFF_INSPECTION_REQUIRES_ORIGINAL_OWNER_FOLLOWUP`, never as implementation success. Deletions or incomplete/unsafe non-empty diffs still fail closed under the original strict path validator.

The existing `.github/workflows/powerhouse-daily-self-evolution.yml` branches on the original validation output: only a validated changed-source diff reaches the existing protected PR code; no-diff is native-CAS-recorded on that exact original `INNOVATION_INTAKE` operation using unchanged owner, source revision, SHA, idempotency key, immutable correlation ID and exact operation version. An independent provider GET validates the write. The original operation remains `PLANNED`, the innovation obligation remains `OPEN`, no remote_ref or consumer ACK is issued. A repeated original source revision is held rather than repeatedly generating an empty build; revised source is not accepted under stale proof.

The no-diff record is explicitly **NOT** a determination that the prior implementation is in production. The existing owner still owes source/production parity, independent observed effect, next natural agent consumption and learning; no synthetic forecast or customer value has been created. Neither a second scheduler, queue, table, model, sender nor permissions were introduced.

## Regression and release acceptance
Existing `tests/brain-innovation-original-code-delivery-20261115.test.mjs` now covers no-diff classification, forbidden deletion, native CAS readback and duplicate idempotency, unchanged original `PLANNED` status, false-green denial and protected PR gating. The original source learning is `brain/learning/2026-11-15-innovation-no-diff-not-terminal-v1.json`.

Only claim SOURCE_CANDIDATE before protected exact-head Required/CodeQL and merge. After deployment, inspect original next natural code recovery and Supabase `brain_operations` source-bound evidence. Do not close any of the 14 innovations merely because this workflow branch turns green. Rollback via protected revert of this scoped source/workflow change; never delete original obligations.
