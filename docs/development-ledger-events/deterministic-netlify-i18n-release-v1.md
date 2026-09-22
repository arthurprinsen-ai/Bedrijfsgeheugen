# Deterministic Netlify i18n release — development ledger

- Fingerprint: `deterministic-netlify-i18n-release-v1`
- Failure: Netlify build returned exit code 2 while the same source passed GitHub build checks.
- Root cause: release-only network translation path was activated by a build-scoped Anthropic key and non-canonical translation cache state.
- Fix: network translation is opt-in only via `STATIC_I18N_NETWORK=1`; Netlify release builds set it to `0`.
- Regression: `tests/site-shell-global-i18n.test.mjs`.
- Terminal evidence required: protected merge, production Netlify ready state, exact release identity, public pricing/homepage verification.
