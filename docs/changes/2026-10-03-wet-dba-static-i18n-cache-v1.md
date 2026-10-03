# Wet DBA static i18n recovery

The 3 October Wet DBA article was present on `main`, but the production build correctly refused to publish it because its deterministic English translation cache was incomplete.

This recovery adds only the missing cache patch. It does not weaken `STATIC_I18N_REQUIRE_CACHE`, enable network translation during builds, or bypass the protected delivery lane. After merge, the same production deploy and public-readback chain is rerun.

CI replay is intentionally triggered after the PR machine metadata was expanded to cover all four recovery files.
