# 2026-09-20 — terminal-health-lifecycle-v2

- v1 production readback correctly remained fail-closed.
- Remaining red signals were traced to two historical artifacts: `selftest-recon-v1` from 31 August and time-boxed `P0_PROOF production-truth-proof-20260831-v1`.
- The selftest operation remained PLANNED with dispatch_generation=0, no remote_ref and empty evidence; its reconciliation exhausted three no-progress attempts.
- The P0 proof has an observation valid only until 31 August 08:13 UTC and is preserved as historical stale truth.
- v2 introduces explicit desired-state lifecycle retirement, current-vs-retired health separation and terminal reconciliation consistency.
- Real BLOCKED obligations plus active stale/drifted/unknown truth remain fail-closed.
- No new observation is fabricated and no external outcome is asserted.
