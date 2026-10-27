# Independent public browser readback — 30 september 2026

The default public browser could not connect to bedrijfsgeheugen.nl, but an independent ZenRows JS-rendered browser/fetch path could. This is now the canonical fallback instead of stopping at Netlify READY.

The independent readback also found a real runtime SEO defect on the English AI Modelwijzer: the raw server title was correct, but legacy script `#bg-tabtitel` overwrote `document.title` after JavaScript execution.

The localized-route builder now strips that legacy SPA title mutator from every static NL/EN canonical before publication. Public SEO readback must compare raw HTML and JS-rendered state.
