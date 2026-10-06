# Development ledger — CI Intelligence ratchet v1

- Date: 2026-10-06
- Obligation: ci-intelligence-ratchet-20261006-v1
- SLO: Required queue p95 <= 30s; Required total p95 <= 120s.
- Fan-out: workflow fan-out p95 budget 5; unscoped pull-request workflow target 2.
- Agent wait: synchronous external wait budget <= 30s.
- Optimizer: daily/manual only; no pull_request runner.
- Ratchet: unscoped PR budget may decrease automatically and may never increase automatically.
- Safety: protected merge, Required, security, exact-SHA and production readback remain mandatory.
