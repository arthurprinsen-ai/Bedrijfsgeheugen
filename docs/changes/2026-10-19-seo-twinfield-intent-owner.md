# Twinfield SEO canonical ownership

## Why
The existing Twinfield commercial page should own plural and reversed search intent; missing explicit synonyms risk competing SEO suggestions.

## What changed
Added `twinfield koppelingen` and `koppeling twinfield` as secondary keywords for https://www.bedrijfsgeheugen.nl/twinfield-koppeling in the resolver's existing intent-owner projection. No new page.

## Verification and rollback
Review PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4443. Confirm protected CI and CodeQL, merge, deploy resolver, and query production resolver for both variants. Roll back the commit if tests or canonical ownership regress. Conversion and revenue remain unverified.
