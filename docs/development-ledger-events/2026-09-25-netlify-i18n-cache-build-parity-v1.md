# 2026-09-25 — Netlify i18n cache build parity v1

Observed:
- Netlify linked production deploy `6ab68cc1620347dff3081d39` for `e6b93695…` failed with build exit code 2.
- Netlify production config uses `STATIC_I18N_REQUIRE_CACHE=1`.
- GitHub website full build parity used `STATIC_I18N_REQUIRE_CACHE=0`.

Action:
- align GitHub full build parity with production fail-closed cache behavior;
- keep network translation disabled;
- use the resulting pre-merge failure to identify and patch exact missing cache entries;
- require exact-main deploy and browser proof before closure.
