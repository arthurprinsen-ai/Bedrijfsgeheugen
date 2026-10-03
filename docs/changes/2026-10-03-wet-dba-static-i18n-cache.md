# Wet DBA static i18n cache recovery

The 3 October 2026 daily Wet DBA article introduced new Dutch public copy without the deterministic English cache entries required by the static locale build.

This recovery adds the 66 missing translations through the existing append-only `config/bg-static-i18n-en.d` mechanism. The repair is intentionally separate from the Platform-navigation obligation because it restores the shared website delivery baseline.

The executable historical replay verifies the exact incident count, representative translations, and that every recovered cache entry is non-empty and translated.
