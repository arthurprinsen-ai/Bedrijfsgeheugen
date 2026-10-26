# Adaptive CI Intelligence v2 — 2026-10-06

CI optimization now measures the critical path rather than only broad averages: Required queue/total p95, direct pull-request workflow count, duplicate workflow runs, duplicate open obligations, skipped work and retired-candidate churn.

The daily optimizer and Daily Self Evolution no longer allocate their own pull-request workflows. Their contracts are validated by canonical Required instead. Direct-PR workflow budget is monotonic downward with a target of two authorities (Required + CodeQL).

Hard limits are immutable: Required queue p95 30s, Required total p95 120s, at most five workflows per PR head, 30s external agent wait and 120s unchanged-state no-repoll. Autonomous optimization cannot weaken release, security, protected-merge, exact-SHA or production-readback controls.

The optimizer now writes an identical proposal when no tuning changed, so timestamp-only differences no longer create daily no-op PRs.
