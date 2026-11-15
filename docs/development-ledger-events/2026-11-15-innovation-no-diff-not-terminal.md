# Delivery activity — original innovation nonterminal no-diff recovery
- Date: 2026-11-15 (Europe/Amsterdam).
- Original P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Production truth before source change: 14 canonical INNOVATION_DELIVERY OPEN; 14 native INNOVATION_INTAKE PLANNED, 14 pre-reviews, 14 decisions, 0 original consumer ACK, 0 original financial forecasts and 0 realized savings.
- Real original GitHub run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43752164113; original-innovation-code-candidate job 132928288752; Codex reported no source changes; original --validate step failed `ORIGINAL_INNOVATION_CODE_PATH_SCOPE_OR_EVIDENCE_MISSING`.
- Root cause: valid zero-diff code inspection fell into guard for incomplete partial diffs, leading to repeated nonterminal work without a native owner receipt.
- Repair candidate: same original script, same original GitHub job, same existing Brain CAS; classify empty diff without creating a PR and independently record pending verification on the native operation.
- Source/test/learning: `scripts/brain/innovation-original-code-delivery.mjs`, `.github/workflows/powerhouse-daily-self-evolution.yml`, `tests/brain-innovation-original-code-delivery-20261115.test.mjs`, `brain/learning/2026-11-15-innovation-no-diff-not-terminal-v1.json`.
- Prevention: exact no-change vs unsafe nonempty diff distinction, native operation version/idempotency check, immutable no-diff fingerprint, independent GET, duplicate-safe next-run selection.
- Authorization and safety: no direct main edits, no external sends, no new scheduler, no false acknowledgement; review-required stays in force.
- Release status at creation: SOURCE_CANDIDATE; protected exact-head Required, CodeQL and production readback DUE.
- Follow-through: after green protected promotion, original daily workflow natural run must show a native pending owner-review receipt and progress past repeated empty candidates, with independently proved implementation/effect/learning required before terminal.

## Same-PR protected admission recovery (actual failures, 2026-11-15)
- Original candidate PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5905, first head `1f951270ad533dd97015eabecb8d256b4aa066ce`.
- First Required admission https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43753505978 rejected `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`. Corrected the SAME PR body by adding the immutable provider-read base SHA `b7c019bc1b06e711ae11f928278b6f0bbd51c08c`; no base rewrite.
- Failed-job rerun of this Required check advanced beyond metadata but rejected `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:semantic_learning` because the learning JSON used `source_evidence` instead of the mandatory canonical `evidence` key. Corrected that one existing Brain learning source, keeping the original evidence and prevention semantics intact.
- Both failures and repairs are nonterminal; new exact-head Required, CodeQL and protected merge remain due. Prevention: include `Base-SHA` in the initial PR body; use explicit canonical `evidence` plus root cause, prevention, compiler.failure_class, and replay before opening an integration PR.
