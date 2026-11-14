# Originele bronconsumptie naar ONE BRAIN — stage-receipts in één keten

**Datum:** 14 november 2026  
**Oorspronkelijk P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Reparatie-eigenaar:** bestaande commerciële Heartbeat/stage #116 en runtime-mux #171  
**Status:** source candidate; LIVE pas na beschermd CI, migratie en onafhankelijke SQL/provider-readback

## Probleem en oorzaak

De bestaande functie `powerhouse_source_consumption_assurance_v1()` eiste twee afzonderlijke commerciële cronjobs die sinds consolidatie terecht niet meer actief zijn. Daardoor werd bronconsumptie als ongezond gerapporteerd, ondanks op 14 november aantoonbaar 23.295 verrijkte connecties en herhaalde stage-events van de éne canonieke commerciële eigenaar #116. Deze foutieve controle moet geen reden worden om twee extra jobs te starten: dat zou juist een tweede keten veroorzaken.

## Correctie

Dezelfde bestaande functie controleert de actieve originele #116 en #171, sluit concurrerende voormalige split-crons uit en vereist drie actuele, niet-degraded oorspronkelijke stage-receipts: bedrijfs-/relatiecontext, interne actie-routing en de leerfase. De bronversie en originele ONE BRAIN-obligations blijven onveranderd. Resultaat wordt expliciet begrensd als `ORIGINAL_SOURCE_TO_EXECUTOR_RECEIPT_ONLY`; echte provider-delivery, actuele consumer-ACK, omzet en leerapplicatie blijven afzonderlijk `NOT_ASSESSED_BY_THIS_READ_MODEL`.

De bestaande reliability- en data-quality-agents en de bestaande `powerhouse-source-universe-impact-engine`-skill zijn op hetzelfde contract aangepast. De SQL heeft geen nieuwe scheduler, tabellen, outbound publicatie, betaalde API-aanroep, wijzigingen aan RLS of permissies, of massale replay. Bestaande fouten, bronrechten, toestemming, tenant-isolatie en provider-readback blijven harde poorten.

## Productie-verificatie en overige schuld

Controleer na de beschermde merge de provider-geregistreerde migratie, de oude en nieuwe functie-uitkomst, de actieve jobs #116/#171, originele stage-IDs, en ten minste de volgende natuurlijke run. Hercontroleer `brain_obligations`, content-handoff, provider en daadwerkelijke resultaten apart. Source-healthy betekent **niet** dat 7 rode lussen, 420 niet-afgehandelde verplichtingen, 18 verlopen bronoverdrachten of 189 sociale meet-/leerachterstanden zijn opgelost.

## Preventie

Een scheduler die bewust wordt uitgefaseerd mag niet langer als vereiste identity in een assurance-projectie staan. Controleer de actuele canonieke eigenaar én diens originele stage-output; verwissel de interne uitvoerstap nooit met provider delivery of commerciële waarde. Regression: `tests/brain-original-source-consumption-stage-parity-20261114.test.mjs`. Herhaling gaat onder dezelfde oorspronkelijke P0-fingerprint.


## 14 november 2026 — beschermde opvolger na productieprovider 859

De originele PR #5786 is door een ontbrekende Supabase-previewassociatie niet gemerged. Intussen is productiemigratie `20261114184600` toegepast en heeft protected PR #5791 de volledige bronlock met 859 provider-records gelijkgetrokken. Daarom is de ongewijzigde functiecode heruitgebracht als één opvolgende **nog niet toegepaste** migratie `supabase/migrations/20261114230000_original_source_consumption_stage_receipt_parity_v1.sql`. Het oorspronkelijke P0 #4198, de Brain-eigenaar, tenant/source_revision en voornaamste test blijven identiek. Geen tweede scheduler, database-queue, sender, provider-write of dubbele learning lineage. De oorspronkelijke PR #5786 is expliciet SUPERSEDED en gesloten, niet als live/fulfilled afgemeld.

Nieuwe beschermde acceptatie vereist echte Supabase Preview exact PR-head, Required, CodeQL, merges, nieuwe Supabase-applied identiteit en onafhankelijke functie/readback plus originele volgende natuurlijke stage. Zelfs bronchecker `healthy=true` zou slechts bron-naar-executor betekenen; de volledige provider/consumer/measurement/outcome/learning-keten behoudt zijn eigen open poorten.

## Protected source resynchronization after native 860 — no lost innovation changes

The original #5794 head was never merged. Supabase Preview was cancelled by the platform's active-branch cap, and the already-existing ONE BRAIN failure fingerprint was updated with the exact provider check. After #5793 protected merged, both the original innovation-agent changes and our original source-consumption changes touched `platform/agents/agent-team.mjs`. GitHub correctly rejected a source merge conflict; no force-push or overwrite was attempted.

Protected lock-only #5795 then merged, with independently verified 860 native provider/860 GitHub source-lock identities. This one next successor from that **current main** adds only the two source-to-stage tasks into the latest innovation-capable agent-team file, imports the original source-universe skill section without wiping other skill content, carries the same read-model source and regression under proposed migration `20261114194000` (still > native `20261114193000`), and keeps every original P0 #4198 obligation OPEN until provider, consumer, measured outcome and next natural learning proof. PR #5794 was closed SUPERSEDED not FULFILLED. There is one active candidate, not multiple schedulers.

## 14 november 2026 — één oorspronkelijke kandidaat op actuele 861/861-baseline

De provider native productie heeft 861 daadwerkelijk toegepaste migraties. GitHub-main-lock is in beschermde PR #5798 naar exact dezelfde 861 identiteiten gebracht, onafhankelijk readback bevestigd. Dezelfde PR #5797 is daarna zonder conflict tegen de actuele main gesynchroniseerd; de nog niet toegepaste voorgestelde source-consumption-migratie is op versie `20261114230000` gezet, dus later dan de bestaande provider `20261114210000`. De oorspronkelijke SQL-functielogica en beide agent- en skillcontracten blijven ongewijzigd, inclusief alle innovatie-agentupdates op main. Geen tweede cron, onafhankelijk executiepad, handmatige live-omzeiling of gefabriceerde consumer/outcome. De oorspronkelijke ONE BRAIN-obligation #4198 blijft open tot originele provider- en overdrachtsbewijzen.
