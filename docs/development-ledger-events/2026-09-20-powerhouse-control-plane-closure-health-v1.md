# 2026-09-20 — RECOVERY — Control-plane closure and health authority

- Fingerprint: `powerhouse-control-plane-closure-health-v1`
- Failure class: `CANONICAL_AUTHORITY_DRIFT_AND_SUPERSESSION_TERMINALIZATION_GAP`
- Signal: ONE BRAIN health rapporteerde 17/18 actieve core jobs terwijl reconciliation worker v2 aantoonbaar iedere minuut draaide.
- Root cause: stale v1 authority in health contract plus over-strikte terminalizer voor closed-unmerged supersession migrations.
- Fix: v2 authority migration + exact-one canonical same-name migration reconciliation.
- Safety: missing or ambiguous canonical identity remains fail-closed.
- Regression: `tests/brain-powerhouse-control-plane-closure-health-v1.test.mjs`.
- Runtime evidence: production health moved from missing-job RED to 18/18 jobs after the hotfix.
- Terminal evidence: pending exact-head gates, protected merge and production readback.
