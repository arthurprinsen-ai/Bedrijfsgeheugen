# SEO pricing trust correction — 2026-10-14

- Obligation: seo-pricing-article-trust-20261014
- Candidate: PR #4365; pending protected checks and production readback.
- Root cause: canonical pricing page and indexed cost article drifted, including obsolete price and product claims.
- Changes: correct supporting article and FAQ structured data, align CTA, maintain English translation, add historical replay and regression tests.
- Verification: `tests/brain-seo-pricing-trust.test.mjs` and `tests/seo-order-pricing-article-trust.test.mjs`; do not claim deployment or conversions before provider proof.
- Prevention: require historical pricing parity test and evidence-backed learning on future material changes.
