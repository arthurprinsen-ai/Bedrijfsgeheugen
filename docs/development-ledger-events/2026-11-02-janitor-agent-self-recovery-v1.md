# Janitor agent permanent detect-and-learn — 2026-11-02

- Event: `janitor-original-agent-recovery-contract-introduced`.
- Original incident: #5320, run 41342975119, job 124956777904, commit eedc3f8b380cd1e0c986cc0d0ea98854a48813e8, artifact 13098203266.
- Direct signature: gh HTTP422; secondary jq SIGPIPE. Exact API endpoint historically not proven.
- Design weakness: bounded PR window was treated as complete history; no guaranteed same-run failure observer despite later successful telemetry/artifact upload.
- Owner: existing `Powerhouse Repository Janitor`, ONE BRAIN/Powerhouse GitHub delivery control plane; no parallel executor.
- Repair: positive-only Search+direct merged successor verification, `if: always()` typed incident artifact and idempotent issue writeback/readback; bounded fail-closed provider behavior.
- Prevention: exact predecessor/obligation/merged proof before resolving lease; unknown ≠ reopened; failed cleanup ≠ green. `tests/brain-janitor-agent-self-recovery-20261102.test.mjs`.
- Earlier PR #5321 protected merge source: 88b53ef8d5d0257bfadc09fe6141bba6e3198708. This new patch **not live** until exact-head protected merge and next native Janitor run + independent readback. The older 133 supervisor drift events are not cleared.
