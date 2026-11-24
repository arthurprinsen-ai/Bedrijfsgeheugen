# Development ledger: original innovation workflow scoped permission contract (2026-11-16)

- Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Failure fingerprint: `brain|innovation|job-local-write-vs-unscoped-regression|20261116-v1`
- Source: GitHub Actions run 43763904923 (two BRAIN permission contract assertions).
- Root cause: tests inspect the entire YAML rather than separating top-level and the sole original write-authorized implementation job.
- Corrective action: enforce read-only ordinary jobs, exactly one bounded PR writer, no issues write; keep the actual workflow and GitHub protections unchanged.
- Preventive evidence: existing test suites now fail closed if another job or global scope gains write rights.
- Verification state: PR CANDIDATE / NOT YET PRODUCTION VERIFIED until Required + CodeQL, protected merge and next-run readback succeed.
- Business status: OPEN / DEGRADED, no provider event, attributed customer outcome or recovered 14 innovations asserted.
- Rollback: revert the two test changes via protected CI, retain source evidence and existing scheduler.

## PR admission recovery (2026-11-15 23:12 UTC)
- GitHub Required run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43773405437 correctly rejected the first PR body before tests: `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`.
- Cause: the PR author omitted the mandatory immutable `Base-SHA` field although the branch was based on actual main `ddde1bcd12aa8144262fd2876806e351c3445dc8`.
- Fix: add that exact observed base SHA to PR #5916 metadata. Trigger a fresh protected admission using this ledger commit, not by bypassing or marking failed check successful.
- Prevention: always include exact `Base-SHA` in the initial PR machine metadata and verify with provider admission evidence before claiming release.
- State: NOT GREEN; await fresh Required and CodeQL plus protected merge and production readback.
