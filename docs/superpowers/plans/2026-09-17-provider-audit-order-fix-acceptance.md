# Acceptance criteria

- Provider audit occurs before orchestration.
- Existing Buffer delivery references are audited before any replanning.
- Missing provider records become stale/blocked before recovery.
- Verified provider records remain preserved.
- Required CI gates pass before merge.
- Production readback proves the supervisor ordering and provider reconciliation outcome.
