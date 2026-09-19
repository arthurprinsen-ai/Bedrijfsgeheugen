# Regulatory source watch writer policy v1

- Date: 2026-09-19
- Obligation-ID: regulatory-source-watch-writer-policy-v1
- Trigger: PR #2327 Repository Writer Candidate Shadow failed with `UNKNOWN_WRITER:regulatory-source-watch`.
- Root cause: writer identity missing from `scripts/ci/repo-writer-policy.mjs`.
- Change: register exact canonical path only; retain fail-closed behavior for all other data paths.
