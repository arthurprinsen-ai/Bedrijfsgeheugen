# Development ledger — production-readback-html-entity-heading-20261005-v1

- Source chain: PR #3741 -> merged recovery #3788 -> merge SHA eb51760dc95db37b8e2ee1f02b30134dbc035782.
- Production evidence: Netlify deploy 6ac3eae7a5a0b8000855de71, context production, commit_ref eb51760dc95db37b8e2ee1f02b30134dbc035782.
- Production pricing DOM contained all canonical sections, plans, prices, controls and package-advice route.
- Only mismatch: raw HTML encoded '&' as '&amp;' for the Directie & AI Workshop h3.
- Fix: make required heading text entity-aware and add regression coverage.
- Non-action: no gate threshold, required proposition, release identity or visual/readback invariant is weakened.
- Closure condition: exact-HEAD CI green -> protected auto-merge -> resulting main SHA -> Production Release Readback + Canonical brand shell live readback terminal success.
