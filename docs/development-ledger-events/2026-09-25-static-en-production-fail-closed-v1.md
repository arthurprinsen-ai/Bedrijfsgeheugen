# 2026-09-25 — Static English production fail-closed

Observed:
- exact-main production identity was green;
- pricing content was green;
- browser NL→EN navigation reached /en/prijzen;
- /en/prijzen still showed the Dutch pricing H1.

Root cause:
- production build used STATIC_I18N_NETWORK=0 and STATIC_I18N_REQUIRE_CACHE=0;
- incomplete static translation cache caused English routes to be emitted from Dutch source without translation.

Repair:
- enable production static English translation;
- preserve terminal provider failure semantics;
- keep three-route NL/EN roundtrip as release proof.
