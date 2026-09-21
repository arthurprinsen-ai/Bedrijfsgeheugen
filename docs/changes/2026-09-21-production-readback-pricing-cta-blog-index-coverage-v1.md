# Production readback: pricing CTA + blog-index coverage

Fingerprint: `production-readback-pricing-cta-blog-index-coverage-v1`.

On 21 September 2026 the exact main SHA was already live on Netlify and the canonical Production Release Readback was green, while two narrower checks still exposed independent contract defects.

The pricing readback failed because the prior regression accepted a measurable Frisse Blik CTA in the footer. Canonical shell projection replaces that footer, so the production artifact lost the marker. The measurable primary CTA now lives on the retained `Start gratis` action inside the pricing page itself.

The page/SEO check reported `/blog/` as missing its keyword even though the title already contains `Digitalisering mkb kennisbank`. The scanner enumerated `*.html` and `blog/*/index.html` but omitted `blog/index.html`. The collection index is now explicit in estate discovery.

The regression binds both invariants. A pending deploy/readback remains an internal recovery state; the executing lineage owns correction through exact production verification.

During exact-head BRAIN verification the same recovery also exposed a stale System Map inventory left by the preceding i18n release: `netlify/functions/i18n-translate.mjs` existed but was absent from `POWERHOUSE_SYSTEM_MAP.inventories.netlifyFunctions`. The canonical inventory now registers it and the provider snapshot is aligned to the 62 repository Netlify functions. This is treated as incomplete writeback, not as an unrelated reason to hand the recovery back to the user.
