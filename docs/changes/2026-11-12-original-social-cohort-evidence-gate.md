# 2026-11-12 — Original social comparison source proof

## Source and cause
The existing original social-learning-store `get_cohort` selected the closest dated snapshot for each comparison post without applying the already mandatory provider/source qualification used for the target. Observed production data includes partial-only personal LinkedIn reactions, and Windsor company snapshots often arrive outside the original ±6-hour age window. The cohort could therefore include incomplete evidence or the wrong provider identity, inflating comparison sample size. Actual provider metrics are never inferred from response status.

## Correction
The same original store now calls a pure, fail-closed `selectQualifiedSocialCohortSnapshot` in the existing shared source gate. It requires identical tenant and post, verified provider event linked to the exact external post ID, a finite numerical provider metric (including observed zero), original 24/48/72h source age ±6h and a real observed timestamp. The existing hourly scheduler, six-hour source collector, tenant isolation, publisher and quality vetoes are unchanged. Invalid cohort points are dropped, not set to zero or marked complete.

## Verification and limits
`tests/brain-social-obligation-evidence-ack-20261110.test.mjs` adds positive and negative cases and checks the original Edge call site. Historic social-learning obligations remain open without real source snapshots and independent consumer ACK. The GitHub candidate is not runtime proof. Protect with exact-head Required/CodeQL, protected merge, active Supabase Edge deployment/readback and next original natural run. No fabricated causal lift or fully-green claim. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
