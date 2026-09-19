# 2026-09-19 — Terminalizer squash-lineage false negative

- Obligation-ID: github-terminalizer-squash-lineage-v1
- Fingerprint: github|terminalizer|squash-tree-equivalence-v1
- Failure class: POST_MERGE_SQUASH_LINEAGE_FALSE_NEGATIVE
- Trigger: PR #2415 merged successfully but post-merge terminalizer run 35450074361 failed at canonical merged-lineage validation.
- Root cause: candidate-commit ancestry was treated as universally required even for squash merges; merged-branch cleanup can also remove the candidate ref.
- Prevention: explicit candidate fetch plus ancestry-or-exact-tree-equivalence proof; merge SHA must remain contained in current main.
- Regression: tests/powerhouse-obligation-terminalizer-squash.test.mjs
- Skill: .agents/skills/powerhouse-delivery-self-optimization/SKILL.md
- Delivery state: RECORDED_PENDING_FINAL_DELIVERY_READBACK
