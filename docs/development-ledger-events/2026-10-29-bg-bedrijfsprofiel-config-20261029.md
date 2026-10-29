# Ledger event: bg-bedrijfsprofiel aangegeven in config

- Datum: 2026-10-29
- Event: `bg_bedrijfsprofiel_config_declared_v1`
- Scope: supabase/config.toml
- Schrijver: alleen configuratie; geen nieuwe deploy in deze PR
- Waarheid: branch-test; productie-deploy nog niet bewezen
- Invariant: deployed edge-functie heeft een config-blok met expliciete verify_jwt
- Bewijs: tests/brain-bedrijfsprofiel-20261028.test.mjs 7/7
