# 2026-10-07 — Source Universe & Company Impact Engine v1

## Aanleiding

Het portaal had al concrete externe data voor onder meer wetgeving, arbeidsmarkt, subsidies, economie en technologie. De bredere source universe, bronstatus, tenant-impact, canonical actie en outcome/learning-lineage waren nog niet als één authority geborgd.

## Existing-state-first

Voor de implementatie zijn de bestaande signal-, evidence-, Company Intelligence-, Brain obligation-, Outcome Memory-, scheduler- en Loop Assurance-authorities hergebruikt. Er is bewust geen tweede signal store, scheduler, task engine, outcome ledger of learning store gebouwd.

## Structurele wijziging

- 45-domeinen taxonomie: 35 extern + 10 intern.
- Brede source catalog met aparte capability- en availability-status.
- `CATALOGUED/AVAILABLE` wordt nooit als `CONNECTED/LIVE` geïnterpreteerd.
- Eén canonical externe signal projection.
- Tenant-specifieke company-impact projection bovenop canonical signalen.
- Impactscore faalt gesloten als probability/magnitude/exposure ontbreken.
- Euro-impact blijft NULL zonder tenant/company-evidence.
- Alleen READY + SCORED tenantacties kunnen materialiseren naar `brain_obligations`.
- FULFILLED obligation is niet automatisch een business outcome.
- DONE vereist linked verified Outcome Memory.
- Bestaande scheduler mux wordt hergebruikt; geen nieuwe cron writer.
- Portal V2 Omgevingsradar toegevoegd onder Actueel & externe data.
- Authenticated Netlify projectie combineert canonical outside-world evidence met alleen de eigen tenant-impact.
- RLS + explicit service-role grants + browser revokes.
- Capability geregistreerd in System Map, Loop Assurance, Brain learning, skill en regressietests.

## Delivery state

Status blijft `CANDIDATE_PROTECTED_DELIVERY` totdat protected merge, Supabase production migration/readback, Netlify exact-main deployment en functionele Portal/API readback bewezen zijn.
