# 2026-10-23 — recurrence-based agent CI diagnostics

Canonical obligation: `delivery|ci-agent-repeated-job-priorities|independent-evidence-only|20261023-v1`. Parent #4661, no new issue or scheduler.

**Production read:** existing Janitor [39926363163](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39926363163) success on protected `8a08a22107b29adc4a4fdcd92eb228e5a04790e6`: 28 valid executed jobs, 13 runs, wait p95 3000 ms, slowest executed job 353000 ms, read errors 0. Observation of a single max is insufficient to infer repeated bottleneck or improve business value.

**Change:** bounded pure grouping of existing timestamp-backed job evidence; >=3 different run attempts / median 60s; suggests existing domain owner only. Exact lineage IDs, SHA, aggregate median/p95 and rejection reason in existing Janitor artifact. Partial or corrupted samples fail closed. No new queue/agent/recurring observer, no workflow dispatch or autopromotion. Source, tests and canonical learning attached to same #4661.

**Release gates:** exact-head Required, CodeQL and protected main readback, Brain skill projection plus live Janitor dry-run before runtime status. If not independently proven remain candidate; #4661 and #4655 remain OPEN.
