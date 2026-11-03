# Janitor archive — hard three-tag-403 budget

**Original evidence:** GitHub Actions run [#41599769122](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41599769122), archive job #125797041084, immutable original SHA `c58a4d5290938b0ea7b911aa5ff5aaf6e32e6f6c`. Despite a three-strike breaker, six create-tag requests failed HTTP403. Three successful pre-existing tag readbacks between failures reset the **consecutive** failure counter. The original archive job truthfully failed, and both canonical GitHub [#5333](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5333) and `brain_failure_occurrences` readback independently verified an incident.

## Exact repair

In the **existing** `tools/ci/branch-archive-sweep.mjs`, count all native `CREATE_ARCHIVE_TAG` HTTP403 permission denials across one original run; do **not** reset on success. After the third denial immediately stop all further provider calls. Emit `archive_tag_denials` and `archive_circuit_open` to the original JSON report. Keep protected branch and SHA readback, unique-branch retention, per-branch failure receipts, upload `if-no-files-found:error`, original GitHub/ONE BRAIN incident observer, and existing 60-branch rotating quota window.

## Regression and release proof

The original Brain test replays deny / existing-tag success / deny / other success / deny and asserts exactly three denied creates, no reset. The existing archive-incident observer test enforces report schema and hard breaker. The protected PR must independently satisfy Required, CodeQL, full BRAIN, merge, native postmerge original Janitor and direct provider/ONE BRAIN readback. No new executor or scheduler. **A functioning breaker is not permission repair**: GitHub tag-write HTTP403, provider ghost runs, drift and secure portal mapping remain separate OPEN/UNVERIFIED outcomes, not cosmetic GREEN.
