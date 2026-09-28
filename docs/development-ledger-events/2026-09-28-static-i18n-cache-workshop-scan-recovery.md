# Development ledger — static i18n cache recovery for workshop scan — 2026-09-28

- Root obligation: `workshop-scan-pdf-20260928`
- Recovery: production build cache completeness.
- Main containing workshop scan: `d95189e8cf67b40e490766ae3224206ee07eb8bf`.
- Production Source Snapshot run `36397804474` failed at Netlify build with exit code 2.
- The required parity build exposed `STATIC_I18N_PARTIAL_CACHE_FALLBACK` with missing current strings while production is intentionally fail-closed with `STATIC_I18N_REQUIRE_CACHE=1`.
- Recovery adds immutable English cache entries; it does not weaken the fail-closed production setting.
- Terminal proof remains exact-main deploy plus public `/scan` readback.
