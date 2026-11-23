# bg-bedrijfsprofiel is aangegeven in de Supabase-config

Datum: 29 oktober 2026
Obligation: `supabase-edge-config|bg-bedrijfsprofiel-declared|20261029-v1`

Na de merge van #5058 ontbrak `[functions.bg-bedrijfsprofiel]` in `supabase/config.toml`. De productiepoort op `main` weigerde daardoor de functie, en `attest` faalde voor elke edge-wijziging.

Fix: blok toegevoegd met `verify_jwt = true`. De handler authenticeert de aanroeper niet zelf en gebruikt de service role plus Tavily- en Anthropic-budget; publieke aanroep is daarom niet toegestaan.

Tests: `tests/brain-bedrijfsprofiel-20261028.test.mjs` 7/7 groen.
