# 29 oktober 2026 — besluitcyclus is geen autonome agentactie

**Obligation:** `powerhouse|portal|sql-cycle-events-mislabelled-agent-actions|20261029`

## Gemeten productieprobleem

`public.powerhouse_cycle_events` bevatte in het gecontroleerde etmaal **1.585** canonieke events. Bronherkomst: **1.550** verkoopactie-materalisaties (SQL-stadia van dezelfde acties), **31** kanaalbesluitstadia en **4** runtime-signalen. Deze rijen vormen géén bewijs van 1.585 menselijke of autonome agenthandelingen. Bij **0** events stonden expliciete `agent_id`, `skill_version` en voor-/nametingen in de payload.

De bestaande beveiligde Systeemkaart had de generieke titel **Agentacties** en kon daarmee automatisch verwerkte SQL-besluitregels verkeerd framen als echte agentuitvoering.

## Bronvaste correctie

Verrijk de bestaande begrensde, alleen-lezen `cycle-evidence-coverage`-query binnen de bestaande `Netlify Identity → admin → tenant` guard met uitsluitend `entity_type`. Aggregeer de broncategorieën server-side en retourneer alleen **aantallen**: SQL-verkoopactie, SQL-kanaalbesluit, runtime-signaal en anders. Laat de huidige expliciete agent- en skill-/voormeting-/nameting-indicatoren strikt apart en rood wanneer bewijs ontbreekt. Bij een ontbrekende of ongeldige `entity_type`, foute tenant of onvolledige provider-readback volgt `UNVERIFIED`; geen nul als schijnbewijs. De gebruiker ziet niet langer `Agentacties` als generiek label voor SQL-events.

**Geen nieuwe executors, schedulers, tabellen, schrijvers of migraties.** Geen verborgen raw events, subject-ID's, commerciële gegevens of klantdata in de browser. Geen bewering dat agent-herkomst of omzet nu is opgelost.

## Levering en open acceptatie

De gewijzigde bestaande tests bewaken de broncategorieën, bewezen agentvelden, bronprivacy, tenantguard en negatieve providerrespons. Verplichte Learning Canonicalization, Material Writeback Closure, System Map-regeneratie en protected Required/CodeQL blijven vóór merge nodig. Daarna Netlify exacte productie-SHA, module-readback en waar geautoriseerd echte ingelogde Portal E2E.

**Openstaand:** alle echte agents instrumenteren in hun **eigen bestaande uitvoerketen** met toetsbare agent-ID/skillversie, en echte before/after-/provider-/omzetreadback. Niet retroactief verzinnen. Zie [acceptatie #4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).
