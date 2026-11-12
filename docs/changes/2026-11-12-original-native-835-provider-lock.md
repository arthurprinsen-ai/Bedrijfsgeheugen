# Herstel originele Supabase providerhistorie 835/835

De originale databron Supabase heeft migratie `20261112211000_original_skipped_provider_reference_readback_handoff_v1` aantoonbaar toegepast als nummer 835. GitHub had slechts 834 toegepaste migraties geregistreerd. Een nieuwe SEO-migratie-PR mag deze lock niet tegelijk bijwerken: `UNEXPECTED_PROTECTED_BASE` beschermt juist tegen het vooraf claimen van niet-uitgevoerde SQL.

Deze zelfstandige bronreconciliatie voegt **uitsluitend** de reeds toegepaste native 835e versie/name toe aan `supabase/migration-history.lock.json`. Bestaande 834 registraties blijven identiek. Geen nieuwe migratie, cron of ongeautoriseerde provider-write.

Na exact-head CI en beschermde merge kan het bestaande SEO #5685-herstel opnieuw worden getoetst op de actuele basis. Zie `docs/development-ledger-events/2026-11-12-original-native-835-provider-lock.md` en `brain/learning/2026-11-12-original-native-835-provider-lock-v1.json`.
