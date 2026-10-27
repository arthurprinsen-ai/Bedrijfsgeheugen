# Development ledger — pricing-primary-cta-last-writer-20261005-v1

- Originating closure: PR #3808 merged as `9f4758aa72241773abe3b5711a038c7ac5c1a8e6`.
- Production deploy: `6ac3f24a5e347500080c3598`, exact merge SHA, ready.
- Production Release Readback: success.
- Remaining canonical brand-shell failure: `/prijzen` primary CTA not measurably marked.
- Proven shell state: canonical shell green; growth endpoint returned expected 405; production supersession safe.
- Root cause: `apply-commercial-pricing-v1.mjs` rewrites the pricing page after SEO-order enrichment and dropped the CTA measurement attributes.
- Recovery: preserve `data-bg-conversion="frisse-blik"`, `data-bg-page-role="money"`, and `data-bg-funnel-stage="decide"` in the final pricing writer.
- Regression: `tests/brain-pricing-primary-cta-last-writer-v1.test.mjs`.
- Closure condition: exact-HEAD CI green -> protected auto-merge -> production deploy/readback -> canonical brand-shell live readback green.
