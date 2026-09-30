# AI Modelwijzer novice static-i18n recovery — 2026-09-30

Fingerprint: `ai-modelwijzer-novice-static-i18n-v1`.

The novice outcome-first Modelwijzer introduced 99 new Dutch public strings. The deterministic production build correctly failed closed because those strings were not yet present as exact keys in the static English cache.

Recovery:
- add exact English entries for all 99 detected novice-wizard strings;
- project same-lineage i18n ownership into the AI Model Intelligence skill;
- keep `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1`;
- require exact production build parity and public readback before terminal closure.
