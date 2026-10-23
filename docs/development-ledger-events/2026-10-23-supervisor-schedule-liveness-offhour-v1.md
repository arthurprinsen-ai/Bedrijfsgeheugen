# One-supervisor schedule liveness ledger — 2026-10-23

- Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120 .
- Observed provider evidence: four scheduled Recovery Supervisor runs among scheduled workflow-run history between 2026-10-21 18:34 and 2026-10-23 13:20 UTC; `workflow_dispatch` 39960974891 after merge is a separate event type.
- Hypothesis: top-of-hour GitHub Actions event load and/or disabled/invalid scheduled actor; **not proven causal**.
- Controlled adjustment: offset the one existing five-minute cron to minutes 2,7,...57; preserve one workflow, recovery owner, lease/expected-head native CAS, bounded attempts, no push fanout.
- Regression: same original two executable supervisor + Brain single-flight tests, now asserting the intended offset and unchanged safety invariants.
- Release: CANDIDATE until exact-head Required/CodeQL and protected merge; scheduled operation verified only from future real provider `event=schedule` runs.
- Customer outcomes: unmeasured. No scheduling SLA guaranteed by GitHub, no duplicate writes, no new autonomous agent.
