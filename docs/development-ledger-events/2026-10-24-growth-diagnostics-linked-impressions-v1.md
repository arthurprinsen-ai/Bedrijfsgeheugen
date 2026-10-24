# 2026-10-24 — post-impression readback in existing growth learner

- Existing source: provider metrics in `powerhouse_growth_source_daily_v1` with independent publication organization identity and protected analytics reconciliation PR #4841.
- Consumer gap: `daily-performance-diagnostics.mjs` did not recognize linked provider source quality or `impressions` denominator.
- Fix: one diagnostic contract extended; no publisher retries or new scheduler; no mismatched video view/reach inference.
- Test: append regression to existing `tests/brain-daily-content-performance-diagnostics-v1.test.mjs` and assert 5 impressions cannot be marketed as a success/creative winner.
- Production proof: protected merge and fresh original daily learning execution.
