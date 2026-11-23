# Static i18n patch segment drift — development ledger

- 2026-11-06, owner: static i18n cache patches and brain-static-i18n cache tests.
- Fingerprint: `i18n|cache|blog-2026-11-06-segment-keys|20261106-v1`.
- Source: BRAIN backend lane red on five consecutive main merges with STATIC_I18N_CACHE_INCOMPLETE (5 missing).
- Repair: second patch with the five exact build keys; one lesson and rule; no test weakened.
- Known limit: patch generator still writes sentence-level keys.
- Status: CODE_CANDIDATE, not verified until original BRAIN backend lane on main is green.
