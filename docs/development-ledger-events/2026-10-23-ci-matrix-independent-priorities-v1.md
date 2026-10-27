# 2026-10-23 — matrix-independent CI advisory evidence

Canonical fingerprint: `delivery|ci-agent-repeated-job-priorities|matrix-independent-vote|20261023-v1`; parent incident [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661).

Observed before change: Existing `tools/delivery/ci-agent-priorities.mjs` groups by workflow/job and checks `group.attempts.size>=3`, but computes median/p95 from raw `group.jobs`; matrix job fanout within one run therefore adds extra voting weight. This can cause false-positive 60-second optimization suggestions and false-negative repeated slow jobs. Runtime source is already invoked by the existing hourly Janitor; precise real occurrence rate is **UNKNOWN**, not fabricated.

Recovery: deduplicate each workflow attempt to the slowest observed executed matrix job in the same signature while retaining immutable job IDs/SHA, all raw sample counts and read-only action limits. Replay regression injects 12 extremely slow matrix replicas into one fast cohort, and 14 extremely fast replicas into one repeated-slow cohort; each must retain one sample per attempted run. No second writer, timer, issue, queue or agent fleet; original PR #4778 step-phase writer remains untouched.

Proof required: exact candidate head and base epoch, Required+CodeQL, protected merge, independent main and skill-projection readback, actual existing Janitor runtime and zero provider errors. Do not infer performance uplift from deterministic replay.
