# Development ledger — tools/ci trigger suppression live proof

- Date: 2026-10-06
- Obligation: `tools-ci-trigger-suppression-live-proof-20261006-v1`
- Structural fix: #3969 merged as `a603f712fee167b8c60e0aab07b4f00316185130`.
- Probe PR: #3976.
- Probe runtime delta: comment-only change in `tools/ci/install-chromium.sh`.
- Closure evidence: this ledger, matching change note, and Brain learning artifact.
- Trigger invariant: `tools/ci/**`, `brain/learning/**`, and `docs/**` are all ignored by Production Source Snapshot and Production Release Readback.
- Terminal proof: after protected auto-merge, neither production workflow may have a run for the proof merge SHA.
