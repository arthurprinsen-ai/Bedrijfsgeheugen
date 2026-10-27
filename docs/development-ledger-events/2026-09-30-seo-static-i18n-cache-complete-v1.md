# 2026-09-30 — SEO static i18n cache recovery

Obligation: `seo-static-i18n-cache-complete-2026-09-30`.

Root cause: bilingual SEO/source-copy changes left 23 exact source strings outside the committed English cache, causing the localized Netlify build to fail closed.

Action: completed the cache in the existing AI Modelwijzer SEO revenue patch, projected the invariant into the SEO revenue skill, and recorded prevention learning.

Terminal condition: protected merge → exact-main Netlify production deploy → NL/EN public readback.

Additional production-parity finding: after the first 23 source strings were covered, late SEO/order enrichment generated 9 further exact Dutch strings. Those are now cached as well. The permanent gate therefore validates both source cache completeness and the exact Netlify production build, not only the pre-build source tree.
