# Development ledger event — model supplier source freshness

- Date: 2026-10-23
- Lineage: `brain|ai-model-intelligence|supplier-freshness-expired-v1` (reuse the canonical failure; do not duplicate it)
- Scope: canonical AI model source-age policy, existing daily audit, public advisor eligibility, regression
- Observed baseline: 110 records; 83 historical VERIFIED, 26 PARTIAL, 1 CONFLICT; all verification dates older than seven days
- Risk: stale model/provider evidence could be mistaken for current advice
- Prevention: seven-day source claim TTL and fail-closed automatic eligibility; no artificial timestamp refresh
- CI: exact branch tests and protected release checks required
- Result: candidate only until verified merge and exact production readback; no claim of delivered supplier reverification
- Operators: reuse existing Powerhouse Brain, existing GitHub Actions daily scheduler and existing failure registry
