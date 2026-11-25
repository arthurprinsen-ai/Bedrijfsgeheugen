# Development event — Janitor native 11-digit run ID rejected

2026-11-02 | issue #5320 | original owner: GitHub delivery Janitor.
Original proof: run 41508842023 on 896b4fc4db428c3aeaf13e6f9f02e083eefbee16; cleanup/readback SUCCESS, incident observer FAILURE `RUN_IDENTITY_INVALID`; artifact upload SUCCESS despite failure.
Root cause: PR-specific numberOk (<1e9) incorrectly reused for GitHub Actions run IDs. Same original Brain occurrence fingerprint `github|janitor-agent|github-run-id-over-billion-rejected-by-pr-validator|20261102-v1` recorded idempotently; version at first observation OBSERVED/1.
Fix: split namespace validators; retain bounded PR constraints; test 11-digit ID and invalid inputs.
Regression: tests/brain-janitor-agent-self-recovery-20261102.test.mjs. Skills delivery-self-optimization and continuity updated. Status remains CANDIDATE pending full protected release, next existing Janitor runtime and artifact readback. Older 133 supervisor drift observations remain independent.
