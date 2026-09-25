# 2026-09-25 — Static English production fail-closed v2

Observed: exact-main deploy and pricing-content proof were green, but Playwright failed because `/en/prijzen` still showed the Dutch pricing H1.

Root cause: incomplete versioned translation cache + production `STATIC_I18N_NETWORK=0` allowed Dutch source to be emitted under English routes.

Permanent recovery: production network translation enabled; provider errors remain terminal; previews stay offline; three-route NL/EN browser proof remains mandatory.
