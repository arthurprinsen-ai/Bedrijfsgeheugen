# Development ledger event — delivery latency hardening v1

- Date: 2026-10-06
- Obligation: `delivery-latency-hardening-20261006-v1`
- Lane: automation
- Observed admission waste: `fetch-depth: 0` + `git fetch origin main --no-tags` + local merge-base caused full remote-ref hydration.
- Observed external wait: writer verification allowed 72 attempts × 5 seconds.
- Change: shallow checkout + GitHub API exact-state proof; writer synchronous wait capped at 6 × 5 seconds.
- Resume state: `WAITING_EXTERNAL:WRITER_PR_NOT_MATERIALIZED:<writer>:<verify-sha>`.
- Safety preserved: exact candidate SHA, current-main identity, static security, branch hygiene and writer lease remain fail-closed.
- Regression: `tests/delivery-latency-hardening-v1.test.mjs`.
