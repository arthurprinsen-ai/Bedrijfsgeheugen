# Powerhouse improvement heartbeat (evidence first)

## Permanent feedback loop
Observe portal telemetry and authorized external sources -> assess data gaps -> rank hypotheses -> implement in isolated branch -> test -> protected review/merge -> production readback -> measure causal impact -> version agents/skills and incident knowledge -> repeat.

The engine does **not** claim to ingest production telemetry unless an existing authorized pipeline exports an anonymized JSON snapshot at `automation/self_improvement/opportunities.json`. Missing input is reported as **no_evidence**, never green.

## Required agent contract
For every agent run, record: agent ID, skill identifier + SHA256 of loaded skill text, model/tool version, input data snapshot IDs, permissions, actions and provider IDs, tests, timestamps, outputs, failures, downstream measurement, rollback link and confidence. No proof means status **unverified**.

At every run each agent asks: which outcome can improve, what is the limiting bottleneck, what source is missing, would an alternative technique be faster/cheaper/more reliable, what test would disprove the hypothesis, which existing skill must be updated, and what measurable outcome justifies promotion?

Skills must be versioned as code. Candidate improvements require a redacted dataset, baseline, falsifiable success criterion, regression tests and a champion/challenger comparison. Promote only when independent downstream measurements confirm improvement; revert regressions and save failure cases as future regression tests.

## Data contract
JSON list with objects: `id`, `source`, `observed_at`, `metric` (e.g. `conversion.scan_completion`), `baseline`, `candidate`, `confidence` (0–1), `evidence`. Numeric candidate is a **hypothesis**, not a realized outcome. Never export personal data, tokens or credentials; enforce consent, retention and source authorization upstream.

## Priority and constraints
Optimize for independently verified incremental customer value, qualified leads, paid orders, conversion, reliability, security, latency and costs — not raw green dashboards or synthetic activity. Gather missing data only with permission and provenance, applying rate limits, minimal collection and consent requirements.

May autonomously: read authorized metrics, detect drift, create tickets, propose patches on feature branches, run tests, update documentation and skill drafts. Cannot autonomously bypass Required/CodeQL checks, manipulate evidence, contact prospects without appropriate authorization/consent, rotate live secrets without a staged cutover or self-merge changes that lack required approvals.

The hourly GitHub workflow below is an **analysis pulse**, not proof that all portal agents are continuously running. To connect real portal data, integrate the existing authenticated event export and audit storage; do not introduce duplicate schedulers.
