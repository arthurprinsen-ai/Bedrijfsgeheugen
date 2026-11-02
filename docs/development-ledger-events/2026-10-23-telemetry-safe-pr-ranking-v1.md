# Append-only development ledger: CI evidence consolidation
- Obligation-ID: delivery|ci-adaptive-evidence-pr-ranking|20261023-v1
- Base: latest main synchronized through non-force two-parent CAS
- Canonical rank owner: tools/delivery/recovery-pr-prioritizer.mjs (already merged)
- New scope: measured queue-versus-execution/duplicate-run telemetry; gated AI evidence diagnostics
- Resolution: remove overlapping supervisor edits and duplicate rank/CLI from this PR
- Proof: historical replay, shadow and canary canonical tests; new head exact Required and CodeQL still required
- Release state: CANDIDATE_UNVERIFIED (no independently proven speedup, production behavior or customer outcome)
