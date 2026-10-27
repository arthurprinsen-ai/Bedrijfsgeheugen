# Contact identity static-i18n recovery

A public contact-copy correction changed the localized Dutch source string from Den Haag to Enschede. The production build is intentionally fail-closed for English localization, so the corresponding static English cache must change in the same delivery lineage.

This recovery adds the exact sentence and paragraph variants to the versioned static English cache. The guard remains enabled; no network translation or cache bypass is introduced.

Acceptance: Netlify build parity succeeds with `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1`, followed by exact-main production publication and public readback.
