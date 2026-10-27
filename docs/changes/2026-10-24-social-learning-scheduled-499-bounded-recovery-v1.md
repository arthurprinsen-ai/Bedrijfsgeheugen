# Social learning 499 timeout and owned-brand scope — 24 October 2026

Verified Netlify production observations show the existing hourly `social-learning-evaluate` scheduled function has repeated HTTP 499 requests with nearly 15-second duration. Supabase shows 21 historical evaluations, last 19 September, all for `canonical`. The owned `bedrijfsgeheugen` tenant has 116 posts and 508 metrics snapshots but no evaluations.

The existing evaluator had no bounded batch and the social learning store defaults to `canonical`. Within that **same existing scheduled function**, this repair limits work to a small, deterministic batch, favors newly due observations and rotates through overdue 24/48/72-hour windows, and evaluates both explicitly known tenant scopes with distinct stores. No second scheduler, brand identity fusion or duplicate evaluation authority.

Missing historical snapshots are recorded as missed evidence, never reconstructed or counted as zero. A run can be reported as operationally successful only when provider HTTP responses and new per-tenant evaluation readback corroborate it. Optimizing/publishing the next post still requires the existing context and content quality gates and later measured engagement-to-revenue linkage.

Tests: `tests/brain-social-learning-daily-tenant-coverage-v1.test.mjs` plus `tests/social-learning-evaluate.test.mjs`. Production acceptance remains pending protected merge, deployment and next genuine scheduled invocation.
