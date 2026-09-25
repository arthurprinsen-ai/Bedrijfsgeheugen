# Pricing hero CI single-flight recovery — 25 September 2026

During terminal verification of the NL/EN Powerhouse writeback, the BRAIN backend lane exposed one independent CI regression: `.github/workflows/prijzen-hero-seo-regression.yml` used `github.run_id` as its concurrency key.

That makes every run unique, so `cancel-in-progress: true` cannot deduplicate superseded work. The workflow is now keyed by pull-request number when available and otherwise by the stable ref name. This restores the repository-wide rule: parallel development is allowed, duplicate execution of the same logical PR/ref flight is not.

Regression authority: `tests/brain-actions-pr-single-flight-v1.test.mjs`.
