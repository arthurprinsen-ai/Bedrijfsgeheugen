# Correct revenue goal deadline to 1 September 2027

**Cause.** The production revenue pace view used 29 September 2027 instead of the agreed 1 September 2027, inflating available campaign time.

**Fix proposed.** Migration `supabase/migrations/20261019075200_fix_revenue_goal_target_end.sql` sets the correct deadline and uses actual campaign duration. Test `tests/seo-order-revenue-goal-deadline.test.mjs` guards against regression.

**Prevention.** Preserve protected Required CI, CodeQL, migration review, and authenticated production readback. Record the observed date and result before closing the obligation. Do not treat an open PR or pending check as live deployment.

**Acceptance.** After protected merge and deployment, query `SELECT target_end, target_eur FROM public.powerhouse_one_million_revenue_pace_v1` and confirm `2027-09-01` and `1000000`. Until then status is NOT LIVE.
