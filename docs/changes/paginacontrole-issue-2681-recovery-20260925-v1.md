# Paginacontrole generated-source recovery — 25 september 2026

Issue #2681 exposed a stale-control-plane problem rather than a current sitemap defect.

The /inloggen page is generated with geenIndex: true. A noindex page is intentionally excluded from the sitemap. The audit could nevertheless keep reporting the old sitemap finding because changes to the generator, SEO registry and sitemap-producing sources did not consistently trigger the full public audit. Even when the workflow did start, the PR scope classifier could mark those source changes as non-public and skip the production build and browser/SEO checks.

This recovery changes the contract so public-output source files are first-class audit inputs. The same workflow now runs the generated production build and SEO/browser validation when those sources change. The robots-meta replacement in the V18 generator is also corrected so an existing robots tag is replaced deterministically rather than risking a duplicate tag.

The release remains fail-closed: issue #2681 is only terminal after protected merge and verified production/readback.
