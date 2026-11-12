# Original social-learning evaluator: numerical evidence gate (12 November 2026)

The existing `social-learning-evaluate` uurlijkse Netlify executor repeatedly processed old windows with `data_quality=OBSERVED` but no numeric provider metrics. The original due query rightfully rejected all-null evaluations as completed, so the same records repeatedly used bounded capacity. This did not mean source evidence or learning had been accepted.

## Wijziging

The existing `social-learning-window-ack.mjs` now requires an original, finite, nonnegative numerical observed provider field; valid zero and exact historical Buffer field names stay accepted. The existing evaluator also rejects any empty normalized metric vector and records the same original `UNVERIFIED_OR_PARTIAL_WINDOW` with tenant/post/time identity. It does not count an empty snapshot as evaluated, does not skip exact-source verification, and does not mutate provider posts or create a second scheduler.

## Acceptatie

- Tests: `tests/brain-social-obligation-evidence-ack-20261110.test.mjs` covers empty, null, text-only, valid zero, alias, partial and original evidence ACK.
- Before live: protected Required/CodeQL/Netlify deploy, plus exact production code readback.
- After live: the next natural original hourly run must show no repeated all-null evaluated successes, actual new uniquely stored evaluations when a qualified source exists, and source-bound `MEASUREMENT_VERIFIED` ACK only when all original conditions match.
- Original overdue `social_learning_obligations` and `brain_obligations` remain visible until independent proof exists; do not infer controlled lift, appointments or revenue. A pending production release is not a green closed loop.

Owner: existing Powerhouse social learning / original hourly social evaluator. Incident #4198; PR #5642.
