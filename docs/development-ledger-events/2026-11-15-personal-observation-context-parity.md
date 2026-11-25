# Append-only engineering ledger — 2026-11-15 LinkedIn personal observation context

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|linkedin|personal-observational-context-lexical-drift|20261115-v1`
- Original owner: Powerhouse personal LinkedIn editorial / bg-pre-publish-review, within the existing Powerhouse Daily Publisher.
- Repro: original 2026-11-15 personal obligation BLOCKED; violation `OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED`; no provider ID. Original editor's `personalFinalCopyValid` daily-life lexicon includes three terms the final reviewer omits.
- Root cause: two drifted hardcoded lexical gates.
- Implementation: shared, deterministic lexical helper used by BOTH original parties; original strict source/identity/truth/commercial/uniqueness/provider gates preserved.
- Regression: `tests/brain-personal-final-truth-editorial-parity-20261115.test.mjs`.
- State on candidate creation: SOURCE_PATCH_PENDING_CHECKS (not a proved provider post).
- Acceptance: Required+CodeQL, protected GitOps release, exact production runtime readback, original LinkedIn provider URN/GET, ONE BRAIN consumer processing, Heartbeat outcome, one-loop learning.
- Preventive rule: never maintain separate unreviewed copies of the same observational life-context lexicon across generator and final reviewer.
