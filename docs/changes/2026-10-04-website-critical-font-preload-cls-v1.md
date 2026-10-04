# Critical font preload CLS repair — 4 October 2026

Fresh cross-browser screenshots found two remaining CLS failures: AI Modelwijzer on tablet and the Wet-DBA blog on desktop. Runtime replay proved that the local metric-fallback @font-face sources are unavailable in the browser environment, leaving a much wider system font during `font-display: swap`.

The existing `font-display: swap` policy is preserved. Instead, the final `lettertype-terugval` build step now preloads the current Latin variable WOFF2 resources for Instrument Sans and Bricolage Grotesque on every public page. Controlled replay reduced the two failing CLS values from 0.150 → 0 and 0.225 → 0.00084 without changing the 0.1 threshold.
