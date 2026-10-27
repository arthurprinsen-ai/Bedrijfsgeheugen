# Website critical font preload CLS closure — 4 October 2026

Obligation: `website-critical-font-preload-cls-20261004-v1`

Evidence before repair:
- /ai-modelwijzer tablet: CLS 0.126 in canonical workflow; controlled replay 0.150.
- Wet-DBA blog desktop: CLS 0.200 in canonical workflow; controlled replay 0.225.
- no failed core requests.
- Instrument Sans fallback sample: 505px vs 441px with the loaded webfont.

Controlled preload replay:
- AI Modelwijzer: CLS 0.
- Wet-DBA: CLS 0.000842.
- `font-display: swap` remains unchanged.
- CLS limit remains 0.1.

Terminal closure still requires a fresh exact-preview canonical cross-browser run with zero failures.
