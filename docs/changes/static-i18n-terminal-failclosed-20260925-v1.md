# Static i18n terminal fail-closed recovery — 25 September 2026

Production could serve exact-main while `/en/prijzen` still contained the Dutch H1. HTTP readback proved `lang=en` and `data-bg-static-translated=false`, so the problem was not routing or runtime locale state: the static English builder had discarded all cached translations because at least one post-build string was missing.

The committed base cache was also incomplete. A previously proven complete cache blob existed but was not the canonical main cache.

This recovery:
- restores complete cache blob `0be053e028cc3d8a78c1e3391397e35072a7050c`;
- sets `STATIC_I18N_REQUIRE_CACHE=1` with network translation still disabled;
- excludes the volatile version timestamp from the translation corpus;
- retains pricing H1 canonical patch translations;
- keeps production browser NL→EN→NL proof fail-closed.

No Dutch `/en/*` fallback is acceptable.
