# Activity event — atomic whole-site English

- **Fingerprint:** `global-i18n-atomic-whole-site-en-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Requirement:** after selecting English, the complete website must be English; mixed Dutch/English is not an acceptable state.
- **Root cause:** the previous runtime allowed partial translation and omitted several user-facing text surfaces such as option text and input/image attributes.
- **Recovery:** require complete translation coverage before committing English, retry unresolved strings individually, cover options and user-facing attributes, and revert to the previous locale if complete English cannot be produced.
- **Evidence:** `assets/js/i18n.js`, `tests/site-shell-global-i18n.test.mjs`.
- **Terminal state:** open until exact-head gates, protected merge and exact production readback.
