# Canonical append-only engineering evidence — job-log redirect fallback

- Fingerprint: `ci|supervisor|github-job-log-provider-read-partial-after-merge|20261023-v1`.
- Real Janitor run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39971461584; completed successfully, telemetry partial on Supervisor run 39968527525.
- Independently inspected provider job: 120464700413, name `supervise`, 87KB log available, including real PR#4801 drift message.
- Cause classification: probable transport/redirect handling in existing `gh api` job-log read, precise exception unavailable in old collector; do not assert a specific HTTP cause.
- Repair: strictly bounded `gh run view --job --log --repo` fallback within existing Janitor collector, same source owner, no scheduler or writer.
- Tests: `tests/brain-recovery-supervisor-telemetry-v1.test.mjs` replays API failure, real-timestamp CLI fallback, missing provider, and echoed-source spoofing.
- Status: candidate pending new exact-head protected CI, CodeQL, merge, main readback, actual Janitor artifact.
