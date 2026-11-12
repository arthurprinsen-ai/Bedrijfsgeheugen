# Uitvoeringslog en preventie – afgeleide SEO-bron naar ONE BRAIN

**P0 original #4198 · 12 november 2026 · bronhouder #105→#175→#140→Heartbeat · géén tweede scheduler.**

**Onafhankelijke productiemetingen:** SEO Edge v536 exact gelijk aan de protected main. Bronregister `seo-opportunity-intelligence` heeft één dedupe-event `e1dd5ffa-8aa7-47cf-a979-64197d3e71d9` op 12 november, HTTP 200, vijf forecast-receipts, twee pagina-eigenaar-overdrachten. Originele #175-dagarchivering toont 20 bronnen maar **mist** een eigen rij voor dit afgeleide SEO-besluit. Originele #140-consumer en commerciële Heartbeat bevestigden om 20:14 UTC wél exact dezelfde oorspronkelijke 20-bronnen-SHA `d3babe73edb07aebb77b54e30285d0a428f0ce30a9ecb7a7970b17794ad88e55`. Dat is een echte maar **onvolledige** overdracht. De originele dagverplichting blijft `OPEN` met `optimization_status=NOT_EXECUTED`, geen aantoonbaar extra bezoek, lead, CRO-experiment of omzet.

**Oorzaak:** beide bewijslagen hadden afzonderlijk echte data, maar `powerhouse_daily_source_archive_v1(date)` projecteert het afgeleide SEO-event nog niet naar de bronmanifest. Zonder eigen rij verandert de bron-SHA niet wanneer die SEO-beslissing verandert; dat mag niet gebeuren.

**Correctie binnen bestaande keten:** beveiligde additieve native migratie vervangt uitsluitend het exact gecontroleerde `UNION ALL`-deel van oorspronkelijke #175. Er komt een bronregel `seo_opportunity_intelligence` uit `powerhouse_evidence_source_observations` met originele observation-ID, UTC-brontijd, evidencehash en afgeleide provenance. Als bron ontbreekt is kwaliteit `MISSING_DERIVED_SEO_OPPORTUNITY`; anders `DERIVED_SEO_OPPORTUNITY_OBSERVED`. Geen providerfictie, geen klant-RLS-/grant-wijziging, extra database, cron, executor, publisher of nieuwe authenticatieroute. De overige 20 bronnen en hun oorspronkelijke eigenaren blijven intact.

**Acceptatie:** beschermde CI en echte Supabase Preview → beschermde merge → native providerfunctie-readback → oorspronkelijke #175 datumsnapshot levert eigen afgeleide rij → #140 herkent exact nieuwe manifest-SHA en verwerkt in bestaande Brain-verplichting → commerciële Heartbeat verifieert dezelfde actuele SHA, nooit een oude ACK → portaal krijgt betrouwbare bron-/uitvoer-/effectstatus. Commercieel `OPEN` tot bestaande echte CRO-executie én onafhankelijke 7/14/28-daagse GA4/GSC- en lead-/omzetcontrole. Originele taak blijft altijd actief, herstel wordt geregistreerd, oorzaak + regressie leidt tot preventie.

**Preventietest:** `tests/brain-original-seo-derived-manifest-handoff-20261112.test.mjs`. **Agent/skill:** `platform/agents/agent-team.mjs`, `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`. **ONE BRAIN-learning:** `brain/learning/2026-11-12-original-seo-derived-manifest-handoff-v1.json`.

## Stagegates
- SOURCE_VERIFIED: oorspronkelijke SEO-bronwaarneming met observation ID, origineel ouder/tijd en gededupliceerde HTTP200
- MISSING_HANDOFF_CONFIRMED: oorspronkelijke 20-bronnen-brain-manifest mist afgeleide SEO-lijn, Heartbeat bevestigt slechts die eerdere 20-bronnen-SHA
- SOURCE_CODE_CANDIDATE: additieve origineel-#175 archivering + regressie + agent/skill/ONE BRAIN-learning
- PROTECTED_DELIVERY_PENDING: geen liveclaim over nieuwe migratie, de 21e bronrij, gewijzigde Brain-SHA of CRO-resultaat zonder onafhankelijk native provider-readback
- NEXT: bestaande oorspronkelijke uitvoerder herkent nieuwe bron, #140 ACK actuele SHA, Heartbeat bewijst SHA, CRO uitvoer/effect alleen op daadwerkelijk providerbewijs
