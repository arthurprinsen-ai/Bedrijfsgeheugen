# Activity event — native mobile language chooser

- **Fingerprint:** `global-i18n-native-mobile-select-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Requested UX:** match the reference mobile menu behavior where tapping the current language opens the browser/iOS native English/Dutch chooser with the active option checked.
- **Change:** replace the two-button mobile language control with a native `select` inside the menu; keep desktop dropdown unchanged.
- **State sync:** `select.value` follows `bg_locale`; `change` delegates to the canonical `setLocale` flow.
- **Evidence:** `assets/js/i18n.js`, `assets/i18n.css`, `tools/site-shell/apply-i18n.mjs`, `tests/site-shell-global-i18n.test.mjs`.
- **Terminal state:** open until protected merge and production readback.
