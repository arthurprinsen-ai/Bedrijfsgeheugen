# Static i18n blog segment keys, repeat — development ledger

- 2026-11-07, owner: static i18n cache patches and brain-static-i18n cache tests.
- Fingerprint: `i18n|cache|blog-2026-11-07-segment-keys|20261107-v1`.
- Source: BRAIN backend lane red on main after the daily blog merge, STATIC_I18N_CACHE_INCOMPLETE (2 missing).
- Repair: second patch with the two exact build keys; no test weakened.
- Known limit: the generator still writes fragment-level keys; same class as 2026-11-06.
- Status: CODE_CANDIDATE, not verified until the original BRAIN backend lane on main is green.
