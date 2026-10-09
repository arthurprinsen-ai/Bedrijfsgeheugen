# Bedrijfslek productie-ingest — exact providerbewijs

De bestaande Frisse Blik-scanroute was al met een echte provider-readback bewezen. De op 9 oktober samengevoegde Bedrijfslek-route gebruikt dezelfde beveiligde Powerhouse scan-ingest, Supabase Edge v12 en ONE BRAIN runtime-event-trigger, maar had nog geen **eigen**, niet-gesimuleerde HTTP POST/readback op `/zelfscan`.

## Eén bestaande workflow, uitgebreid
- Gebruik uitsluitend `.github/workflows/powerhouse-scan-production-proof.yml`. Geen extra workflow, cron, scanner of Brain.
- Na de bestaande beveiligingstests en Frisse Blik-smoke: één gecontroleerde anonieme Bedrijfslek-inzending naar `/api/powerhouse-scan-ingest` met de canonieke `/zelfscan` URL, de echte `bedrijfslek_scan` source-kind, domeinen en `__PRODUCTION_SMOKE__` markering.
- Verifieer een provider-bevestigde `scan_id` en `event_id`, `tenant_identity_status=unverified`; bij exact dezelfde idempotency-key de tweede respons `deduped=true` en beide identifiers gelijk. Geen PII, contactformulier, pseudoklant of schijnomzet.
- Dezelfde workflow draait bij relevante wijzigingen in Supabase-config, functies, proxy of de workflow zelf. De eerdere Frisse Blik- en privileged fail-closed-tests blijven onaangetast.

## Releasewaarheid
Een groen `Powerhouse Scan Production Proof` na deze wijziging bewijst de nieuwe *anonieme scan-ingest*. Klantgebonden portal-claim, automatisch bedrijfsspecifiek advies, provider-outbound, orders en opbrengst blijven aparte verificatiepoorten van P0 #4198.

Fingerprint: `powerhouse|bedrijfslek|real-production-scan-provider-proof|v1`.
