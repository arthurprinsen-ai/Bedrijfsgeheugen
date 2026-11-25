# BRAIN archive evidence regression — 3 Nov 2026

Original full BRAIN run [41599748028](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41599748028) on merged PR #5342 reported one failed backend test (#465). The old `tests/brain-branch-archive-sweep.test.mjs` expected `if-no-files-found: warn`, while the canonical Janitor now requires `error` because missing evidence itself is a reportable incident.

Correction: update the test to **assert the stricter gate** `if-no-files-found: error` and the always-running `--observe-archive` original agent. Keep workflow unchanged. Maintain GitHub provider 403, orphan queue, terminal #3967 blocked lineage and any other drift as separate obligations, not automatically resolved by a test assertion.

Original owner: one BRAIN/GitHub delivery writer. Regression: `tests/brain-branch-archive-sweep.test.mjs`. Learning: `brain/learning/2026-11-03-archive-evidence-test-drift-v1.json`. State: candidate, requires protected Required/CodeQL/full BRAIN and subsequent original terminal readback before saying fixed/live.
