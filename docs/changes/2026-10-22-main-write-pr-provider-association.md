# Main Write Integrity: bounded GitHub PR provenance proof (22 October 2026)

**Canonical existing incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4657

## Incident
On exact main SHA `4ce0846ca51227169389241d3a122b274795a0b2`, postmerge Main Write Integrity workflow [39807485724](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39807485724) received `unexpected end of JSON input` reading the GitHub `commits/SHA/pulls` endpoint and classified `UNKNOWN_MAIN_WRITE`. GitHub [PR #4658](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4658) independently reports `merged=true`, `base=main` and `merge_commit_sha=4ce0846ca51227169389241d3a122b274795a0b2`, proving this was not a direct main bypass.

## Contained correction
Re-use the existing classifier and workflow. Retry actual provider commit-to-PR association a bounded three times; if inconclusive, obtain the PR number from the squash subject strictly as an untrusted **lookup hint**, then independently verify GitHub `pulls/number` returns `merged_at`, `base.ref=main` and exact immutable `merge_commit_sha`. Any provider error or mismatch remains a blocking main-write incident. At most five read requests. No new scheduler, store, PR authority, security waiver or production mutation.

## Test and prevention
The existing `tests/brain-main-write-integrity.test.mjs` protects successful primary, malformed response and verified secondary lookup, forged/unmerged/wrong-base/wrong-SHA cases, total provider outage, workflow fail-closed and issue dedupe. Actual protected Required CI, CodeQL, postmerge Main Write Integrity and Netlify evidence required before LIVE/PROVEN. Existing #4657 remains open until authoritative terminal proof.
