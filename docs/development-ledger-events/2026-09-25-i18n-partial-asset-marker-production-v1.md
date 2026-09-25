# 2026-09-25 — i18n partial asset marker production incident

Observed:
- exact-main production identity was green;
- Netlify deploy state was ready;
- pricing production content was green;
- production browser failed because no mobile language selector existed;
- direct served-HTML readback showed i18n CSS present and i18n JS absent.

Root cause:
- one generic asset marker was incorrectly used as proof that the complete multi-asset i18n runtime was installed;
- the transformer returned early on partial state.

Borging:
- new canonical learning: `i18n-partial-asset-marker-production-20260925-v1`;
- Powerhouse continuity skill updated;
- Netlify production-truth skill updated;
- final HTML asset completeness and active mobile-control proof made mandatory;
- earlier host diagnosis retained as historical evidence and refined, not erased.

Terminal rule:
`LIVE_BEWEZEN` for public i18n requires exact-main production identity + complete served assets + visible active mobile selector + NL → EN → NL browser roundtrip.
