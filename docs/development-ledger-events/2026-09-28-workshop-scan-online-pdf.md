# Development ledger — workshop scan funnel — 2026-09-28

- Obligation: `workshop-scan-pdf-20260928`
- Scope: website
- Candidate: PR #3142
- Added one canonical workshop flow: `/scan` -> 18 questions -> six-domain scoring -> radar -> top 3 opportunities -> 90-day plan -> downloadable two-page PDF -> portal/pricing CTA.
- Added workshop/partner/event/UTM attribution to lead delivery.
- Added regression coverage in `tests/components/workshop-scan.test.mjs`.
- Initial delivery hygiene rejected unclassified root paths. Root fix: place the page under `pages/` and test under `tests/components/`, retaining the clean `/scan` route.
- Production status is intentionally not asserted here; exact-main deploy/readback remains part of the release gate.
