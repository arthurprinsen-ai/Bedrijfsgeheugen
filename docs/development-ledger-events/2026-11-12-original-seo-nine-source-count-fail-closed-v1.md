# Incident en preventie: originele #175 telt nieuwe SEO-bron niet

**Oorspronkelijke eigenaar:** SEO #105 → dagarchivering #175 → ONE BRAIN #140 → bestaande Heartbeat/Portaal. **Geen nieuwe scheduler of parallelle lus.**

**Onafhankelijke productiefeiten 12 november 2026:** oorspronkelijke beschermde SEO derived-bronmigratie `20261112214500` is als native Supabase-versie 837 toegepast. `powerhouse_daily_source_archive_v1(date)` bevat het afgeleide `seo_opportunity_intelligence`-bronrecord met originele observation-ID, echte meetdatum en evidencehash. Dezelfde oorspronkelijke productieaanroep `powerhouse_daily_source_archive_v1(date '2026-11-12')` faalde fail-closed met PostgreSQL `23514 GROWTH_SOURCE_MANIFEST_INCOMPLETE:9`. **Oorzaak:** na het toevoegen van de 9e eigen bron bleef de originele functie op `IF v_manifest IS NULL OR v_saved<>8 THEN` controleren. De transactie is teruggedraaid, geen deels vervalste Brain-overdracht. Vorige 20-source SHA `d3babe73edb07aebb77b54e30285d0a428f0ce30a9ecb7a7970b17794ad88e55` blijft alleen bewijs voor de vorige versie.

**Herstel binnen originele providerautoriteit:** de exact gecontroleerde native migratie `20261112220500_original_seo_manifest_nine_source_guard_v1.sql` vervangt uitsluitend de ene eerdere bronregelteller door `v_saved<>9`. De vorige functie en bronregistratie worden op exact slot en owner gecontroleerd, daarna is de nieuwe definitie zelfstandig leesbaar. Dit is geen uitschakeling of versoepeling van de bronvolledigheidsbeveiliging. Geen aanpassing van andere acht bronnen, tabellen, auth, RLS, grants, cronjobs of contentpublicaties. Andere bronrijen van de dagmanifest blijven behouden.

**Vaste acceptatie:** beschermde Required/BRAIN/CodeQL en officiële Supabase Preview, protected merge, native migratie- en bronfunctie-readback; één originele #175-herverwerking van dezelfde bron/dag levert **9 eigen** recordwrites en afgeleide SEO-rij op; originele #140 consumer bevestigt de veranderde **totale** dagmanifest-SHA; originele Heartbeat matcht exact die SHA. Portal mag alleen ontvangen tonen waar deze ACK bestaat. CRO-uitvoering en 7/14/28d bezoekers/leads/omzet blijven `OPEN` totdat eigen uitvoerder en externe provider die onafhankelijk bewijzen; geen vals groen.

**Regressie:** `tests/brain-original-seo-nine-source-count-20261112.test.mjs`. **ONE BRAIN-learning:** `brain/learning/2026-11-12-original-seo-nine-source-count-20261112-v1.json`. **Agents/skill:** `platform/agents/agent-team.mjs`, `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`. Alle incidenten/fouten blijven in originele P0 #4198.

## Statusbewijs
- LIVE_MIGRATION_837 — nieuwe derived SEO-select in productie aanwezig
- ORIGINAL_SOURCE_ARCHIVE_FAIL_CLOSED — PostgreSQL 23514, actual v_saved=9 versus expected=8; transactie teruggedraaid
- PROTECTED_SOURCE_CANDIDATE — gecontroleerde update expected=9, regressie en skill/agent/Brain-preventieregel
- RELEASE_PENDING — geen liveclaim voor nieuwe migratie vóór protected provider-deployment en onafhankelijke native readback
- HANDSHAKE_PENDING — geen geldige actuele 21-source #140/Heartbeat ACK of werkelijk CRO-resultaat zonder latere provider-readback
