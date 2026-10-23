# Evidence-based main-drift supervision in the existing Repository Janitor

23 October 2026 — candidate; **not yet live**.

Root: [#4120](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120); parent protected release [#4781](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4781). The Recovery Supervisor already has native `expected_head_sha` CAS, exclusive lease and two bounded refreshes. The actual [postmerge supervisor run 39960974891](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891) reported 49 main-drift classifications, 58 missing-lease rejections and one used recovery budget. This sample measures **observations, not 49 failed branch updates**. The run's success is not PR repair.

## Proposed single-source measurement
The **existing** hourly Repository Janitor will make no more than five read-only GitHub provider requests: one list of native supervisor runs, plus one jobs-list and one job-log read for each of at most two most recent completed runs within seven days. It will parse only runtime-timestamped log events; reject ANSI/source echoes; distinguish drift, missing leases, pending async CAS, budget exhaustion, rejection, reconciliation and one-per-cycle use. A PR appearing in both actual runs becomes `repeated_drift_pr_count`. Missing/partial log data yields `PARTIAL_PROVIDER_EVIDENCE`, never zero or fake green. GitHub's asynchronous 202, verified ancestry and protected merge remain separate proof levels; no inferred 422 or customer value.

Output is the existing Janitor's uploaded artifact `.artifacts/powerhouse-supervisor-drift-observation.json`; no extra scheduler, write, webhook, skill memory or Supabase table. CI tests replay deterministic GitHub-like runtime logs, incomplete provider responses, and safety invariants. Confirm exact-head Required + CodeQL, protected merge, and independent first hourly artifact readback before calling the addition live.

Follow-up: trend across independently observed supervisor runs and compare first-time-green, retry rate and throughput to prior baselines; automatically change prioritization only behind the existing governance and quality gates.
