# Development ledger — generated SEO owner source of truth

- Date: 2026-09-20
- Fingerprint: `seo-generated-owner-source-of-truth-v1`
- Baseline: diagnose run `35533314225` reported 4 high findings on generated routes after #2504.
- Root cause: stale generator keyword/title overrides rewrote corrected HTML during the V18 production build.
- Change: align generated ownership for `/blog/`, `/investeerders-ma`, `/product`, `/systemen-koppelen` with canonical registry semantics and remove conflicting V18 view ownership.
- Expected outcome: 0 high-severity SEO findings after production build.
- State: candidate pending exact-head gates, protected merge and production/main readback.
