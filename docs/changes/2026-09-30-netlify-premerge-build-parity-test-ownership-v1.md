# Netlify pre-merge build parity recovery — 2026-09-30

Fingerprint: `netlify-premerge-build-parity-test-ownership-v1`.

A deterministic production build defect reached Netlify because newly committed AI Modelwijzer regression tests were not owned by CI and the fail-closed static English cache was not validated in Required test before merge.

Recovery:
- wire all newly committed AI Modelwijzer regression tests into canonical CI;
- validate static English cache pre-merge under production-equivalent fail-closed flags;
- keep transport/auth incidents separate from build-content incidents;
- require same-lineage repair before promotion.
