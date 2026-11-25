# Append-only event: 2026-10-09 seven-leaks final build source truth

- Fingerprint: `powerhouse|revenue|seven-leaks-homepage-final-build-persistence|v1`.
- Original protected PR #4287 and Netlify exact production deploy `6ac9405b67d5080008d2d4ac` succeed, but production html shows no homepage PDF link; `/zelfscan` link survived.
- Root cause: final V18-generated homepage supersedes historical checked-in index source; CI source assertions were insufficient for that exact CTA.
- Repair: project one idempotent ungated PDF link through existing final money-page converter after risk-reversal, guarded by source and valid existing PDF path.
- Preserved: primary scan, portal, NL/EN translation, real provider proof, no scheduler changes, no duplicate outreach, no made-up revenue.
- Required acceptance: protected test, production readback, actual HTML link on homepage and selfscan, downstream paid results distinct from provider post acknowledgement.
- Commercial parent P0 #4198 remains open absent actual paid outcome and learning.