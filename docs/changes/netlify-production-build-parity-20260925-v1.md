# Netlify production build parity — 25 September 2026

A production-linked Netlify build for `66f5051e…` failed with build exit code 2 even though GitHub website checks had been green.

The mismatch was structural: the GitHub website lane used a reduced local composer and skipped production-critical stages from `netlify.toml`, including pricing build capture/restore and static i18n generation.

The website lane now contains a dedicated `netlify-build-parity` job that executes the complete Netlify production build chain before merge with deterministic production-like i18n settings.

This prevents a candidate from being called release-ready when GitHub has never actually built what Netlify will build.

## Revision 2 — production environment parity

On 29 September 2026, production failed again with build exit code 2 while the earlier website checks did not expose the defect. The parity job used the same command chain but not the same production environment: CI set `STATIC_I18N_REQUIRE_CACHE=0` whereas `netlify.toml` sets `STATIC_I18N_REQUIRE_CACHE=1`.

The parity contract now requires the production cache policy too. This makes missing/stale static-i18n evidence fail before merge instead of only after Netlify production starts.

The corrected parity gate immediately exposed the concrete production defect: 54 new conversion strings had no static English cache entry. They are now supplied in `config/bg-static-i18n-en.d/2026-09-29-money-page-order-conversion.json`. New NL production copy and its EN cache entry are therefore one delivery obligation.
