# Herstel: daadwerkelijke postmetingen bereikbaar voor dagelijkse contentgenerator — 25 oktober 2026

**Gecontroleerd productieprobleem:** Supabase function_logs op 24 oktober 22:25 UTC meldt `MEASURED_BRAND_TEST_READ_UNAVAILABLE DB_TABLE_REJECTED:social_posts`. De bestaande contentgenerator vraagt sinds kort eigen zakelijke social_posts en social_metric_snapshots op, maar de ingebouwde beveiligde SQL-adapter kende die leestabellen nog niet. Dezelfde code vraagt `.gte('observed_at', ...)` op, terwijl de adapter die operator ontbeert. Hierdoor bleef `measured_next_post_test` ten onrechte `SOURCE_UNAVAILABLE` en werd de al aanwezige veilige Lean Startup-exploratie geblokkeerd.

**Reparatie:** exact twee tabellen toegelaten voor bestaande tenantgebonden read-only metingen; JSON-snapshotvelden genormaliseerd; `observed_at >=` uitsluitend toegestaan met veilige, geparametriseerde UTC-timestamptz op de snapshots. Elke schrijfactie via deze adapter naar die twee tabellen wordt expliciet geweigerd. Alle andere bestaande beveiligingspoorten, contentverificatie, klanttoestemming, minimale effectsteekproeven en beschermde publicatie blijven ongewijzigd.

Hierdoor kan de dagelijkse generator weer het onderscheid maken tussen (a) bewezen vergelijkbare engagementgegevens, (b) kleine/ontoereikende steekproeven, waarvoor hoogstens één omkeerbare hypothese mag worden getoetst, en (c) daadwerkelijke providerfouten, waarvoor de bestaande source-recovery geldt. Er worden geen posts gedupliceerd, geen metingen aangevuld, geen fictieve klantomzet geboekt en geen nieuwe scheduler toegevoegd.

**Acceptatie:** `tests/brain-measured-provider-db-source-allowlist-v1.test.mjs` en bestaande `tests/brain-measured-next-post-challenger-v1.test.mjs`; Required, CodeQL, Supabase Edge productie-readback, daadwerkelijke volgende source-observatie en later afzonderlijke publicatie/klantresultaten.


## 28 October recurrence — personal history query
The production orchestrator failed at `load-context` with `DB_MEASUREMENT_GTE_SCOPE_REJECTED` (2026-10-28T08:09:40.211Z). The story-family query used the measurement-only `gte` method on a publication date, followed by unsupported `lt`. Both LinkedIn obligations remained PLANNED without provider IDs.

The same recovery lineage replaces the range with seven explicit previous calendar dates using the existing bound `IN` filter. Tenant, personal channel, published statuses, measurement read-only scope, historical uniqueness and publisher authority stay enforced. Three real-adapter regression cases reproduce the exact failure before the fix and pass after it (DST week, year boundary, leap day); relevant suite 20/20. Protected CI, merge, Supabase source parity and real next-run publication proof remain pending; this is not a live-publication claim.
