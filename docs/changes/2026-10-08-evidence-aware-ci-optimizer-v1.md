# POWERHOUSE — Evidence-aware engineering optimizer · 8 October 2026

Obligation-ID: `powerhouse-evidence-aware-ci-optimizer-20261008-v1`.
Authority: reuse the existing CI Intelligence, Autonomous Engineering Fabric v3, and ONE BRAIN closure. No new schedulers, databases or brains.

## Root cause and actual change
The previous daily tuner interpreted a large fraction of **skipped** jobs as wasted compute. A correct GitHub skipped job incurs no runner execution; treating it as runner pressure could incorrectly reduce safe parallelism. The tuner also had no minimum sample threshold for optimistic scheduling decisions and could repeat upward tuning without observing the preceding change.

This patch distinguishes measurement from inference, records the number of eligible queue/execution and Required samples, requires at least 20 sampled jobs and representative timing observations to tune, no longer counts skipped lanes as runtime waste, and enforces a 30-hour cooldown for upward changes on recently optimized settings. Downward corrective tuning remains allowed during the cooldown when directly observed safety/performance pressure is present.

Existing safe gates remain mandatory: protected merge, exact SHA, Required/CodeQL, production readback. The daily optimizer reuses its existing scheduled workflow and bounded tuning PR. It does not turn artifact generation into a success claim.

## Verification
Regression: `tests/brain-autonomous-engineering-fabric-v3.test.mjs`, including empty evidence, legitimate skips and cooldown/recovery. Existing `Required test` and CodeQL must succeed for the exact PR head. Then compare the first post-change observed 7-day p95 queue time, Required total duration, failed jobs and duplicate work against the pre-change baseline; require both performance and non-regression evidence before claiming benefit.

## Separate product opportunity
Future hypothesis (not implemented here): the same versioned experiment protocol should trace each change from business signal to code, tenant impact, provider release, customer-visible outcome, and learning. That would be a differentiated Business & Engineering OS, not a second control plane.

## Delivery state
Candidate until protected merge and relevant production/execution readback. No external commercial messages, direct production DB change, or bypass.
