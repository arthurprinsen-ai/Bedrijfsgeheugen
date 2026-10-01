# Idempotent NL/EN commercial pricing generation

The commercial pricing composer now rebuilds the complete pricing `<main>` on every build for both Dutch and English. Existing pricing markers no longer suppress regeneration, preventing stale mixed-language English output.
