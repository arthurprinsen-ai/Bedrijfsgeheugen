# 2026-09-25 — static i18n production fail-closed recovery

Observed:
- Netlify production commit_ref matched protected main;
- production release readback still failed with: `English route still shows the Dutch pricing H1`;
- immutable cache values for the pricing H1 fragments were valid English translations;
- `netlify.toml` had `STATIC_I18N_NETWORK="0"` and `STATIC_I18N_REQUIRE_CACHE="0"`.

Root cause:
- any missing build-time translation caused the localized route builder to return no translation map;
- because cache completeness was not required, `/en/*` routes could still be emitted with Dutch content.

Action:
- restore `STATIC_I18N_REQUIRE_CACHE="1"` in Netlify production;
- add regression coverage for the fail-closed environment contract;
- retain semantic English-content browser proof before LIVE_BEWEZEN.
