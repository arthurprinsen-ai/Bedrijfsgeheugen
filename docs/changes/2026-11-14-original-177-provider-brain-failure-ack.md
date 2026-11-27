# 2026-11-14 — originele #177-providerfout mag niet tussen runtime en ONE BRAIN verdwijnen

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. De oorspronkelijke metricsjob `bg-social-metrics-source-6h-v1` (#177), bestaande `bg-social-metrics-sync` Supabase Edge Function en oorspronkelijke ONE BRAIN consumer #171 blijven de enige keten.

## Gecontroleerde bron
De vorige beschermde release (PR #5810, commit `d785825`) is native live als Edge versie 790, exact 7/7 bestanden gelijk aan main, oorspronkelijke #177 en #171 actief. Eén recente oorspronkelijke bedrijfspost-providerpoll geeft ondanks HTTP 200 / gedeelde vier echte snapshots het resultaat `healthy=false` omdat Windsor API vanaf bestaande Vault sleutel `WINDSOR_PROVIDER_HTTP_403` retourneert. Vier juiste originele LinkedIn-bedrijfsmetingen en drie niet-causale BRAIN-evaluaties zijn wel gemeten en blijven bewust separaat.

## Root cause: foutopvang stopt vóór ONE BRAIN
Een `provider_social_metric_ingest_receipt` bevat per originele 6uurs-run al een immutable `runId`, originele bronrevisie/slot, status en providerfout. De bestaande Edge verifieert die runtime-receipt door een onafhankelijke SELECT maar registreert daarna niet automatisch dezelfde fout als unieke `brain_failure_occurrences` bij `brain_observe_failure`. De eerdere vijf ONE BRAIN-foutwaarnemingen werden handmatig toegevoegd. Daarom ontbreekt bij een nieuwe mislukte originele run de aantoonbare originele incident/learning-overdracht.

## Veilig herstel binnen dezelfde lus
De bestaande helper `original-provider-poll-receipt.mjs` berekent uitsluitend uit een exact oorspronkelijk job#177 / UUID-runidentiteit en allowlisted `WINDSOR_*` foutklasse een idempotente ONE BRAIN-occurrence-identiteit, canonieke P0-fingerprint en veilig bewijs. De bestaande originele Edge roept na onafhankelijke bronreceipt de **al bestaande** `public.brain_observe_failure` RPC aan met SHA256 van de exacte allowlisted JSON, leest daarna via service_role en bestaande RLS exact `brain_failure_occurrences(occurrence_id,fingerprint,payload_sha256)` terug en slaat afzonderlijk `original_company_source_brain_failure_ack` op in de huidige dagprojectie. Bij ontbrekende ack blijft de response niet-2xx en de origin status RED. Geen nieuwe beheerder/cron/function/table/RLS-grant, geen API-key of querysecret in bewijs, geen extra provider-request, geen herpublicatie of emails.

## Definition of Done
Protected exact-head Required/historical replay/backend/CodeQL/Netlify parity; native originele Supabase Edge update en herlezen van alle bestanden; eenmaal de bestaande #177 read-only poll, native HTTP-resultaat, runtime per-run record én aantoonbaar exact ONE BRAIN-occurrence inclusief original poll run-id en SHA-256. Dit repareert de foutoverdracht, **niet** de Windsor-accountautorisatie of volgende commerciële leerresultaten. Oorspronkelijke onverwerkte verplichtingen blijven open; tickets blijven bij dezelfde eigenaar.

Documentatie: https://windsor.ai/api-documentation/ en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
