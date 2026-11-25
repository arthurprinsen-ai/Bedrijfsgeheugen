# One shared terminal writer — 2026-10-23

Canonical fingerprint: `github|recovery-supervisor|shared-terminal-file-workflow-ownership|20261023-v1`. Owner issue #4120; throughput issue #4661.

- #4792 and #4793 previously collided on Repository Janitor workflow and supervisor telemetry source. #4792 was retired unmerged; #4793 was protected merged at `4d3ea9335c8e0e5449c116e2440e558509cc2697`.
- Existing admission gains exact `Change-Scope` claims and provider-read current PR file checks. Deterministic oldest active terminal writer wins same-resource conflicts; retired and closed owners release their claim.
- Native existing Recovery Supervisor alone owns terminal PR CAS (`expected_head_sha`), up to two main-drift refresh attempts and mandatory new-head Required + CodeQL verification. This admission guard is not a cross-PR atomic lock.
- Existing hourly Janitor observes independent real runs, repeated drift and CAS/provider refusals. No unverified production latency improvement, SLO, or customer value claimed.
- Regression: `tests/brain-shared-terminal-writer-ownership-v1.test.mjs`; source review, protected CI and main readback required before LIVE status.
