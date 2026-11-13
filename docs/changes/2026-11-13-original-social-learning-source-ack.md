# 13 november 2026 — Aantoonbare sociale leerbron → ONE BRAIN, dezelfde originele keten

## Reële diagnose
In productie hebben 185 oorspronkelijke `social_learning_obligations` de status OPEN; 183 daarvan zijn als continue BRAIN `CONTENT_HANDOFF` OPEN. Ze bevatten originele tenant/post/obligation-ID's en eigenaar, maar nog geen exact bronrev/SHA256-ACK. Daardoor is aan het verschil tussen 'ontvangen' en 'bewezen verwerkt' onvoldoende auditbewijs gekoppeld. Historische providerdata, 24h/48h/72h-vensters, toestemming en experimentele causale uitkomsten mogen niet worden gesimuleerd.

## Herstel
Alleen de **bestaande** `powerhouse_content_handoff_receipts_v1(timestamptz)` (uitvoerder #171) wordt door de beschermde migratie `20261113174500_original_social_learning_source_ack_v1.sql` aangepast. Voor elke reeds geselecteerde OPEN bron:
- cryptografische `source_revision` van tenant, oorspronkelijke obligation, post, soort, eigenaar, venster, deadline, status, updated_at en originele JSON-payload;
- aparte `source_payload_sha256`, stabiele `source_correlation_id` en `source_record_key`;
- `consumer_ack.accepted=true` uitsluitend voor ontvangst van die **originele bronversie**; de `accepted_at` blijft bij identieke replay gelijk, vernieuwt uitsluitend bij bronwijziging;
- de originele eigenaar, overdue-datum, limiet 48 per tick, herstelroute, historisch replay en `OPEN` blijven intact.

De 183 oude records worden uitsluitend door de originele natuurlijke #171-replay aangevuld, niet massaal afgesloten of als gepost gemarkeerd. Bron-ACK is **geen** provider-GET, meting, causaal experiment, e-mailantwoord of omzet.

## Productie-eis
Protected Required/CodeQL/SQL preview, merge, native Supabase `schema_migrations` plus `pg_get_functiondef` en ACL; vervolgens onafhankelijke query `social_learning_obligations` naar de **originele** `brain_obligations` op tenant+original obligation ID en SHA256/parity, liefst na een echte #171-run. Ontbrekende ACK = OPEN met originele eigenaar; foutvingerafdruk en herstel terug in ONE BRAIN. Nooit nieuwe cron/publisher/Buffer/Make, geen bypass van 90-dagen bron of toestemming.

Bron: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
