# Production readback pricing contract drift recovery — 5 October 2026

## Trigger

PR #3741 merged successfully, but its post-merge production readback could not be treated as terminal proof because the live verifier still encoded a retired pricing contract.

## Root cause

The canonical commercial pricing model changed on 1 October 2026 to Starter, Pro, Groei and Enterprise, plus consulting/workshops. The production verifier still expected the retired Build/Transform and monthly/yearly-toggle surface.

During exact-HEAD recovery, the SEO diagnostic also exposed three independent authority gaps: the noindex CMS was incorrectly treated as an SEO orphan, /pakketadvies had no incoming public link, and the systems-koppelen cluster lacked a reciprocal AFAS article link.

## Correction

- Align live pricing verification with Starter / Pro / Groei / Enterprise.
- Verify current SaaS/consulting tabs and package-advice controls.
- Keep exact release SHA, shell parity and production release-marker assertions unchanged.
- Treat the noindex CMS as a utility route rather than a crawl-authority page.
- Link /pakketadvies from /prijzen.
- Restore the AFAS cluster backlink from /blog/systemen-koppelen-mkb/.

No gate is weakened and no historical evidence is rewritten.
