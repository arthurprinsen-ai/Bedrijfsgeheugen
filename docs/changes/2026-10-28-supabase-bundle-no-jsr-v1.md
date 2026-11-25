# 2026-10-28 — Supabase bundel zonder build-time jsr-import

Obligation: supabase-bundle-no-jsr-20261028.

Supabase Preview faalde met "failed to bundle function: exit status 1". De logs tonen de oorzaak: de module-graph kon de jsr-manifest van `@supabase/functions-js` niet laden ("body timed out after 10s", 06:22 en 06:47 UTC). Vijf functies importeerden `jsr:@supabase/functions-js/edge-runtime.d.ts` puur voor ambient types; die regel is verwijderd. Geen functie gebruikt de globale `EdgeRuntime`, dus runtimegedrag verandert niet. Regressietest blokkeert nieuwe build-time jsr-imports.
