# 2026-11-03 original Janitor archive incident writeback — development event

- **Cause:** original 403 archive failures now fail their job but were not independently guaranteed to generate issue+Brain occurrence readback; missing source artifact had no native archive observer. A workflow failure is not a registered and preventable incident.
- **Source evidence:** #5333, native runs 41528932134 and 41546047078, original branch archive source, protected PR #5334; provider permission root still unproven.
- **Change owner:** existing canonical Powerhouse Janitor and original `branch_archive_sweep` step. Add `--observe-archive` mode to existing Janitor incident agent and one `if: always()` step in same pre-existing archive job; preserve one original scheduler, writer, issue #5333, Brain RPC and artifact.
- **Typed classification:** `ARCHIVE_PROVIDER_FAILURE`, `ARCHIVE_STEP_FAILURE`, `ARCHIVE_EVIDENCE_MISSING`; exact source run/attempt/SHA and fail-closed unknown/missing provenance.
- **Incident evidence:** deduplicated GitHub comment (direct readback) and exact `brain_observe_failure` occurrence/hash (independent `brain_failure_occurrences` GET). Reporter failure is a failing native job, not a success.
- **Safety:** no new permissions, no broad token/credential substitution, no tag protection bypass, no branch with unique work deleted without original archive-tag SHA readback; three-strike circuit breaker unchanged.
- **Regression:** `tests/brain-janitor-archive-incident-readback-20261103.test.mjs` plus existing archive and native Janitor tests in original protected automation lane; historical, shadow, canary as in learning record.
- **Status:** code candidate only pending protected full checks/merge and next original live archive job with issue+Brain+admin portal readback. The original provider HTTP403 may recur; preserve open incident, do not report full GREEN.
