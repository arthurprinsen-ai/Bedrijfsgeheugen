# Development event — provider-proof daily execution status

- Date: 2026-10-15
- Obligation-ID: `powerhouse-provider-proof-execution-status-20261015`
- Root cause: SQL status function counted only legacy `social_posts` (zero rows) and considered `state=published` sufficient without independent provider readback.
- Observed provider truth: LinkedIn company `urn:li:share:7516489347345334272` verified, blog production/public URL verified; LinkedIn personal `urn:li:share:7516487392590217216` has provider-status published but GET_POST_CONTENT returned 403, provider truth false.
- Source repair: one canonical SQL function replacement preserving the signature, SQL stable/invoker and all required return keys. Exact provider proof is mandatory for delivery and social counts.
- Regression: `tests/brain-powerhouse-provider-proof-execution-status-v2.test.mjs` checks all proof predicates and 2026-10-15 historical replay.
- No publishing/writes: only publication reporting logic changes; personal post must not be resent.
- Release acceptance: provider-managed preview green on exact head, Required CI & CodeQL green, protected merge, native production schema/function readback, two verified deliveries / one unverified personal and one verified social.

- Fail-closed NULL regression: explicit SQL `coalesce((proof predicates),false)` plus missing-receipt replay, so a missing delivery_evidence object can never disappear from `unresolved_publish_count` through SQL three-valued logic.
