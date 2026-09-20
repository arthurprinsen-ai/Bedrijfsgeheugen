# Development ledger — SEO generated legacy routes

- Date: 2026-09-20
- Fingerprint: `seo-generated-legacy-route-normalization-v1`
- Root cause: generated legacy routes were audited as canonical owned content.
- Change: exclude the three non-canonical generated routes from the SEO page inventory.
- Evidence: source-tree readback showed no canonical files; production build audit created the false ownership signal.
- Delivery state: candidate pending protected gates and exact-main SEO readback.
