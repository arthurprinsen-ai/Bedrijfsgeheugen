# 2026-11-13 original no-publish source next-action discrepancy
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Same original content source and #171 BRAIN consumer; no new executor.
- Real production source before candidate: 846 migrations; 21 incomplete SKIPPED (20 blog, 1 LinkedIn company) with no observed provider refs/checked side-effect flags. Twenty blog source next_actions claimed explicit completed decision despite missing decision_code. This is a misleading source routing claim, not proof of resends or a terminal provider error.
- Scope: only current original source next_action, last_error, updated_at; candidate guard <65 rows, no fabricated historical decision, status, evidence, source owner or publication.
- Test: tests/brain-original-no-publish-legacy-source-action-20261113.test.mjs; learning: brain/learning/2026-11-13-original-no-publish-legacy-source-action-v1.json.
- Release state at authoring: CANDIDATE; provider migration/version, content source changes and natural #171 original BRAIN receipts MUST be read back independently before claiming LIVE.
