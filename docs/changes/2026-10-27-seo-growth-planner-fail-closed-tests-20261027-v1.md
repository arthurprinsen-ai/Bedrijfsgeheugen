# SEO growth planner tests aligned with fail-closed contract

Two tests in `tests/seo-growth-daily-conversion-planner.test.mjs` asserted the behaviour from before the planner began failing closed on the human/bot denominator. They now assert that no CTA rate is derived from raw pageviews, that low organic CTR yields a rejected-with-evidence title/meta proposal, and that a fresh rollup yields an evidence-gap proposal that never auto-publishes.

## Validation

`node --test tests/seo-growth-daily-conversion-planner.test.mjs`

## Boundaries

Test-only. No planner, policy or production change.
