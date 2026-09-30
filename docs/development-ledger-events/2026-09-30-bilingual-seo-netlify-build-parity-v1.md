# 2026-09-30 — bilingual SEO Netlify build parity

Obligation: bilingual-seo-netlify-build-parity-2026-09-30.

Observed: Netlify deploy 6abcfcde992ecd176ef25a99 failed during the site build after the bilingual SEO architecture had merged.

Structural gap: the website CI parity job did not yet execute the full production SEO pipeline.

Action: align the premerge website parity command with production, add a Brain regression, and retrigger the exact-current-main production build.
