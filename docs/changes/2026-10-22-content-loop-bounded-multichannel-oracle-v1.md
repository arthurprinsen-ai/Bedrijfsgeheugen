# Bounded multi-channel supervisor source-oracle fix — 22 October 2026

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
- Fingerprint: `ci|brain|content-loop-bounded-multichannel-inherited-oracle|20261022-v1`
- Obligation: `ci-brain-content-loop-channel-fanout-test-oracle-20261022-v1`
- Observed immutable baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071; backend job 119869500824; failing original test `not ok 114`.
- Historical #4307 regression test still asserted retired `MAX_CHANNEL_GENERATIONS=1` and `bootstrapAttempted`. Actual current supervisor uses one run-date lease, a deduplicated and allowlisted four-channel bounded fan-out, channel-specific child requests and no second pass on unknown bootstrap outcomes. Its child rejects invalid channel scopes and queries the selected channel only.
- Fix is confined to that original source test, this canonical Brain learning file and append-only ledger. Twelve mutation-negative canaries must fail if safety guards are removed. Preserve 90s Anthropic/110s parent, editorial/source/identity constraints and actual runtime behavior.
- No runtime, SQL, provider, scheduler, publication, security or tenant modifications. Exact-head Required/CodeQL and focused/historical/shadow/canary tests remain mandatory. A full integrated immutable Unified BRAIN zero-failure run, migration replay #3742 and real tenant acceptance #4215 are independent; **no global or production green assertion**.
