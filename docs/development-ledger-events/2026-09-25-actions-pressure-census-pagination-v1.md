# Development ledger — Actions pressure census pagination v1

- Date: 2026-09-25
- Failure class: queue-pressure undercount
- Production evidence: supervisor run 36114119449
- Symptom: raw active 6 minus 9 provider zombies produced effective 0
- Root cause: paginated exclusion census combined with unpaginated recent-run raw census
- Fix: fully paginate each non-terminal Actions status before computing raw/effective pressure
- Regression: `tests/brain-actions-queue-storm-guard-v1.test.mjs`
- Fingerprint: `github|actions-pressure-census|same-universe-pagination|v1`
