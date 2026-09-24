# 2026-09-24 — pricing browser proof authority

Observed:
- Netlify exact production SHA `0c372634337ea90322fefdf04df6a2220f2e9dd3` was verified on deploy `6ab4d0fd2930df0008637e2b`.
- The production snapshot then failed twice in the intermediate raw-HTML pricing marker check.
- Because that gate ran before Playwright, the stronger user-behavior proof was skipped.

Decision:
- remove the intermediate raw-HTML pricing gate from terminal production proof;
- retain exact SHA/deploy identity;
- make `verify-pricing-i18n-production.mjs` the authoritative pricing/i18n functional proof;
- strengthen canonical learning and continuity skill so future agents do not reintroduce pre-browser grep gates for interaction incidents.

Terminal closure still requires protected CI, current-main merge, exact production readback and successful production Playwright interaction proof.
