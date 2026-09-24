# Actions queue storm guard — development ledger

Obligation-ID: actions-queue-storm-guard-20260924-v1

Delivery-Lane: automation

Candidate-Type: recovery

Observed incident: 19 Actions runs in progress, 121 queued, and 55 open pull requests.

Root cause: the repository-wide delivery recovery supervisor ran on every main push and every five minutes, so recovery could add more CI work while the queue was already saturated.

Implemented prevention:
- no repository-wide recovery trigger on main push;
- scheduled cadence changed to 15 minutes;
- circuit breaker at 20 active/queued/pending/waiting/requested runs;
- maximum one PR recovery per cycle;
- duplicate active recovery dispatches suppressed;
- regression coverage in tests/delivery-powerhouse-supervisor.test.mjs.

Linked learning: brain/learning/actions-queue-storm-guard-20260924-v1.json

Linked documentation: docs/changes/actions-queue-storm-guard-20260924-v1.md
