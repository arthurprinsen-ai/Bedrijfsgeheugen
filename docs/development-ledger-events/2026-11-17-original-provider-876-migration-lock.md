# 17 november 2026 — Result Guardian native 876 bronlock incident

Fingerprint: `powerhouse|gitops|native-provider-876-applied-with-missing-source-lock|20261117-v1`.

**Bron:** originele Supabase management provider toont 876 werkelijk toegepaste `supabase_migrations.schema_migrations` op `2026-11-17T09:16:03.759162+00:00`. Origineel GitHub `supabase/migration-history.lock.json` staat op 875 (captured_at 16 november). Alle eerste 875 versie-/naamparen zijn exact identiek en in dezelfde volgorde. Uitsluitend `20261117094500/original_result_guardian_existing_watchdog_v1` ontbreekt.

**Impact:** zes native GitOps Required-tests blokkeerden onder andere herstel-PR #5940. Oorzaak: nieuwe al-toegepaste SQL-migratie uit protected #5939 was niet in het oorspronkelijke provider-bewezen GitOps-lock meegenomen.

**Veilig herstel:** append alleen exacte provideridentiteit en broncontroletijd in bestaande lock. Niet migreren, terugrollen, historische versies veranderen, Required uitschakelen of extra scheduler aanmaken. Zelfde oorspronkelijke incident-/release-eigenaar.

**Regressie:** `tests/brain-cro-production-migration-lock-20261029.test.mjs`, native complete provider-/repo-readback. **Afsluiting:** protected Required+CodeQL, native merged main, nieuwe originele provider 876/876 proof. CODE CANDIDATE totdat dat bewijs bestaat.
