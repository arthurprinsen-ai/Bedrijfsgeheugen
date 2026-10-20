# Acknowledge actual uncertain writes and avoid unchanged-row locks
Obligation-ID: predictive-calibration-uncertainty-retention-20261019
Supersedes: 4512

A real8092calibration returnedHTTP200/12uncertain; exact per-forecast readback found10persisted. Supabase edge/Postgres logs show the last2PATCHes failedHTTP500/SQLSTATE57014 while waiting for row locks. The caller ignored update.error. Earlier22real bound assessments did survive refresh with exact digest c74bd4df6dc88c25eab73a92909e738d,12historical attempts archived, publicclosed53/personmarkers0 unchanged. Do not turn partial runtime proof into completion.

Require an acknowledged OPEN/same-revision update and compare the returned real marker/due before incrementing uncertainty. Retry only the same computed result once for transientSQL errors; no additional model request. Reject auth errors, zero-row/stale/closed writes and mismatched readback. Existing refresh compares desired/current state before attempting INSERT/ON CONFLICT, preventing unnecessary locks on6913unchanged rows; callers PERFORM the helper and do not depend on its old affected-row count. Keep the existing revision merge and immutable CLOSED evidence.

Native Preview and PostgreSQL execution, Required/CodeQL, protected main, native Integration source parity for the existing calibrator, actual unchanged refresh0rows, all newly claimed uncertainty IDs persisted with7day backoff, preserved earlier evidence and durable dashboard closure remain required. Never fabricate the2missing assessments from HTTP receipts.
