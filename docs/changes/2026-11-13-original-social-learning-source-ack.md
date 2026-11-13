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


## Onafhankelijke productie-uitkomst — 13 november 2026
Protected [PR #5752](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5752) is met exact-head Required, CodeQL Python/JS en native Supabase Preview/SQL replay success samengevoegd op `main` via commit `2feb1186bc48e5b9fea0ff4dc076b697f238147e`. Native productiebron `supabase_migrations.schema_migrations` bevat migratie `20261113174500/original_social_learning_source_ack_v1` als **850e** toegepaste entry. Directe `pg_get_functiondef` bevestigt de source-SHA en source-only ACK; `anon=false`, `authenticated=false`, `service_role=true`. Native bron-revisieregister heeft 849 bestaande exacte versies/naam-paren gelijk aan provider (nul verschillen), gevolgd door de echt toegepaste nieuwe 850e entry.

**Na echte originele #171-receipt-functie in vier opeenvolgende, begrensde batches (48 maximaal)**: 185/185 oorspronkelijke OPEN leerbronnen gekoppeld aan hun oorspronkelijke ONE BRAIN-verplichting; alle 185 met exact gelijke SHA256 van volledige originele bron, payload-SHA256, stabiele correlatie en `consumer_ack.accepted=true`. Onafhankelijke productiedatabasevergelijking: **0 ontbrekende/verouderde bron-Acks, 0 onbewezen provider-/metric-/leerclaims**. De BRAIN-verplichtingen blijven OPEN: SOURCE_RECEIVED is nooit gelijk aan provider-publicatie, meting, een werkelijk experiment, toegepaste les of order. Er is geen extra scheduler, geen nieuwe provideractie, geen synthese en geen parallelle agent.

**Restbewijs:** volgende *natuurlijke* bestaande #171 assurance-run en indien nodig bronmutatie/replay-pariteit, vervolgens de afzonderlijke echte provider-GET, metriek, analyseresultaat, leertoepassing en commerciële uitkomst. Ook de overige 366 open contentoverdrachten zijn hiermee niet automatisch afgehandeld. Deze release repareert specifiek aantoonbare `social_learning_obligations -> ONE BRAIN` bronoverdracht; geen claim van volledig commerciële ALL_GREEN.

### Preventieregistratie
Het previewpad faalde eerst door ontbrekende SQL-eindpuntkomma na `pg_get_functiondef` en daarna door een postflight-controlewoord dat niet in de runtimefunctie voorkwam. Beide zijn in dezelfde PR gerepareerd en getest; officiële Supabase Preview heeft daarna succes gemeld. Oorspronkelijke ONE BRAIN-les: `brain/learning/2026-11-13-original-social-learning-source-ack-v1.json`. Native migration history lock volgt uitsluitend exact na read-only provider-verificatie; geen denkbeeldige deploy of migratie.


## Natuurlijke executor — onafhankelijk bewezen
Op **13 november 2026 om 18:14 UTC** is de werkelijk bestaande `pg_cron`-job **#171** `powerhouse-runtime-scheduler-mux-v1` zelfstandig uitgevoerd: `succeeded/DO` (18:14:00.027554–18:14:01.127033 UTC). Niet alleen de cron-enqueue: de originele `powerhouse_ops.runtime_scheduler_run_evidence_v1` had `state=COMPLETED`, `healthy=true`, `content-closed-loop ok=true` (224 ms) en `loop-assurance ok=true` (853 ms). De originele loop-assurancefunctie roept exact dezelfde `powerhouse_content_handoff_receipts_v1` aan. Dit is **de natuurlijke productierun**, geen handmatige nieuwe scheduler.

De aansluitende onafhankelijke ONE BRAIN-productievergelijking bevestigde opnieuw **185/185** bestaande exacte social-learning source/consumer ACKs. `accepted_at`-digest `a65f8d67c6a7f494cbff26d836bc22bc` en optelsom originele BRAIN-bronrijversies `2696` bleven gelijk na herhaling: geen dubbele ontvangst of onbewezen provider-actie. `content-closed-loop` en `one-brain-reconcile` bleven aantoonbaar **RED** doordat provider-/meting-/leren-/omzetuitkomsten ontbreken; bron-ontvangst is alleen de eerste ketenschakel. Native provider-lock 850/850 werd apart beveiligd via [PR #5755](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5755). Permanente incidentaudit: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232#issuecomment-6859256876.

## Structurele testpreventie na echte provider 851
De latere gecontroleerde BRAIN-run voor PR #5758 signaleerde dat de oude test van migratie #850 een **vaste globale `captured_at`** vereiste. Die tijd verandert bij elke legitieme nieuwe provider-migratie. Herstel: verifieer altijd de ongewijzigde historische versie/naam op de vaste index en accepteer een *nieuwere* geldige readbacktijd. De nieuwe #851-test mag op dezelfde manier geen totale migratiecount exact op 851 vastzetten; een volgende echte #852 moet toelaatbaar blijven. Tests blijven streng op identiteit, volgorde, uniciteit en echte providerobservatie. Deze reparatie verandert geen lopende cron, migratie, bronstatus of publicatie.
