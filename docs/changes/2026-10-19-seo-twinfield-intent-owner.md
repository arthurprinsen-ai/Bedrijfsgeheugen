# Twinfield SEO canonical ownership

## Why
The existing Twinfield commercial page should own plural and reversed search intent; missing explicit synonyms risk competing SEO suggestions.

## What changed
Added `twinfield koppelingen` and `koppeling twinfield` as secondary keywords for https://www.bedrijfsgeheugen.nl/twinfield-koppeling in the resolver's existing intent-owner projection. No new page.

## Verification and rollback
Review PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4443. Confirm protected CI and CodeQL, merge, deploy resolver, and query production resolver for both variants. Roll back the commit if tests or canonical ownership regress. Conversion and revenue remain unverified.

## Canonical source closure — 2026-10-25
GSC 2026-10-01..22 observed 10 impressions for `koppeling twinfield` and 6 for `twinfield koppelingen`, both zero clicks on the existing Twinfield page. Canonical keyword intelligence (2026-10-25) records estimated volume 40 and CPC €16.49 for each. Update source `site/seo-order-map.json` AND runtime projection, preserving one intent owner. Executable regression `tests/brain-seo-opportunity-first-mover-closure-v1.test.mjs`. No new page, ranking, conversion or revenue claimed. Requires exact-head Required/CodeQL, protected merge, Supabase resolver deployment and independent production readback.
