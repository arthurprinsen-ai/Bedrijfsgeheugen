# Netlify static i18n cache build parity — 25 September 2026

Netlify production failed on `main@e6b9369587ed0b7f31a68a50f2cfd360b8800a18` while the GitHub website lane had remained green.

Root cause: the full GitHub build-parity job ran with `STATIC_I18N_REQUIRE_CACHE=0`, whereas Netlify production uses `STATIC_I18N_REQUIRE_CACHE=1`. The standalone cache test validates source HTML before the complete build chain, so strings introduced by build transforms could escape pre-merge validation.

Repair:
- run the full production-equivalent website build with `STATIC_I18N_REQUIRE_CACHE=1`;
- retain `STATIC_I18N_NETWORK=0` so CI never relies on the translation provider;
- fail pre-merge on any missing post-transform translation;
- repair missing strings only through canonical static i18n cache patches.

Terminal release proof remains exact Netlify production SHA plus pricing/i18n browser verification.
