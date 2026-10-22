# Main Write Integrity — bounded GitHub association readback

Canonical incident: [#4657](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4657); fingerprint `delivery|main-write|unverifiable-pr-association-v1`.

Original run [#39807485724](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39807485724) failed because the single GitHub commit-to-PR API read was unavailable. Independent API readback proved exact merged PR #4658, and the original job's targeted rerun succeeded.

The existing Main Write Integrity workflow now retries only the same immutable commit's API read up to three times with 500/1500ms backoff, including transiently empty responses. It never changes the security classification: merged-main exact-SHA proof alone authorizes squash merge; genuinely missing associations and persistent provider errors remain fail-closed. Negative and positive regression, machine-readable Brain learning, and append-only ledger are included. No duplicate watcher/scheduler or protection bypass.

Release: CANDIDATE until exact-head Required, CodeQL and on-main postmerge integrity all pass.

CI admission correction: helper moved under the already classified shared `tools/ci/` directory, no new lane-policy exemption.
