# Revenue goal deadline drift — 2026-10-19

Obligation: revenue-goal-deadline-20261019. GitHub PR #4441.

Observed production view `powerhouse_one_million_revenue_pace_v1` specified target_end 2027-09-29; user-approved goal is 2027-09-01. Proposed migration corrects date and computes pacing against campaign duration. Regression test lives at `tests/seo-order-revenue-goal-deadline.test.mjs`.

CI admission failures were caused by unclassified test paths and subsequently missing canonical closure artifacts. This ledger records the actual actions; it does not assert deployment or verified sales. Protected checks, merge, Supabase migration and authenticated production readback remain required.
