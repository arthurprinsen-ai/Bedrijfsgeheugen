# Development ledger — Search indexing recovery — 2026-09-23

## Trigger
Google Search Console showed a rapid increase to 53 URLs in “Gevonden - momenteel niet geïndexeerd” while search impressions dropped sharply.

## Material change
- Netlify now regenerates `sitemap.xml` from the final production HTML after route/localization generation.
- Explicitly non-indexable generated views now override inherited robots metadata with `noindex, follow`.

## Evidence
- Candidate: `6cff982ddfe3a3291130df567b766f5c584054c8`.
- Netlify preview: `6ab3aa979b53ce000802fada` reached `ready`.
- Build, contract and smoke gates succeeded before promotion.
- Production readback remains a terminal delivery gate after merge.

## Prevention
Never maintain the production sitemap as an independent source of truth when pages are generated during the build. The sitemap must be compiled from the exact final HTML that is deployed.
