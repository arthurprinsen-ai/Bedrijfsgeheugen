# SEO production reconcile — exact main

- Date: 2026-09-25
- Obligation: `seo-money-pages-commercial-intent-20260925-v1`
- Delivery lane: website
- Classification: production reconcile / SEO / revenue
- Canonical source: `main`
- Observed main SHA before reconcile: `e6b9369587ed0b7f31a68a50f2cfd360b8800a18`
- Observed Netlify production SHA before reconcile: `f45ad02f8f719958c00b7ff8e39e3ca2104353b1`
- Condition: SEO implementation, learning contract, regression test and documentation are already present on `main`, while production is serving an older commit.
- Required terminal outcome: protected candidate -> BG169 handoff -> production contains current main -> browser readback proves the Exact Online, API-koppeling and Twinfield commercial-intent changes.
- No product behavior is changed by this ledger event; it records and reconciles a source-versus-production drift.
