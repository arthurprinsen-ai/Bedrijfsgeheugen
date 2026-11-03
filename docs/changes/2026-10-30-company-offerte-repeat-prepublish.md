# LinkedIn bedrijf — preventie van herhaalde offerte-opvolgingsverhalen

**Datum:** 30 oktober 2026. **Eigenaar:** bestaande Powerhouse-bedrijfsredactie en exclusieve social publisher. **Bestaand incident:** #4439. **Lerend patroon:** `powerhouse|linkedin-company|lost-offer-operational-family-repeat|20261030-v1`.

## Geobserveerd probleem
De bedrijfspost op 29 oktober had als concreet onderwerp een verloren/niet-opgevolgde offerte. De op 30 oktober gegenereerde zakelijke kandidaat gebruikte met andere formuleringen dezelfde ondernemersfrictie. De bestaande mondiale content-deduplicatie heeft de kandidaat daarom terecht geblokkeerd (`STORY_FAMILY_DUPLICATE`), zonder aangetoonde providerverzending. Dat is beter dan een dubbele post, maar de redacteur had het al vóór de publisher moeten herkennen.

## Oorzaak
De bestaande `companyEditorialViolations` controleerde specifieke actuele nieuwsverhalen en sterk overlappende teksten. Daardoor konden semantisch identieke operationele gevallen in sterk verschillende bewoordingen toch de eerste kwaliteitscontrole passeren. Het onderliggende probleem is **onderwerpherhaling**, niet een OAuth-fout of een defecte globale duplicaatbeveiliging.

## Gerichte preventie in de oorspronkelijke keten
De bestaande gedeelde editor krijgt een beperkte `companyRecurringFrictionFamily` voor het herkenbare geval *verloren/niet-opgevolgde offertes*. Bij herhaling in historische bedrijfsposts geeft de editor `COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT`. Algemeenheden als AI, CRM, MKB of omzet zijn nadrukkelijk geen duplicate-sleutel. De bestaande redactie mag maximaal één brongebonden revisie proberen, uitsluitend met een aantoonbaar **ander** ondernemersprobleem. Zonder geldig nieuw onderwerp blijft de originele verplichting op BLOCKED, waarna dezelfde oorspronkelijke bronintelligentie nieuwe feiten kan leveren; geen tweede scheduler of verzender.

## Bewijs en beveiliging
Regressie: `tests/brain-linkedin-company-editorial-contract-v1.test.mjs`, inclusief verschillend geformuleerde offertes en een negatieve voorraad-case. De globale databaseclaim, menselijke OAuth, provider-identiteit en onafhankelijke readback blijven verplicht. Deze kandidaat bevat geen vertrouwelijke ongepubliceerde concepttekst, tokens of klantgegevens in GitHub. Een groene codecheck of merge is **geen** groen publicatieresultaat.

**Afzonderlijke actuele blokkades:** Op 30 oktober had de oorspronkelijke Composio-setup inmiddels status `ACTIVE_RESUMED`, maar de bedrijfsclaim was nog BLOCKED wegens inhoudelijk duplicaat. De goedgekeurde tekstgenerator meldde `gpt-5-mini:429 insufficient_quota`; de eerdere Groq-fallback is governance-matig `SUSPENDED`, dus die mag niet stilzwijgend ingeschakeld worden. Bewijsvereisten: beschermde CI → merge → exact Supabase Edge source readback → natuurlijke agentrun → ander goedgekeurd verhaal → originele publisher-provider-ID → onafhankelijke postcontrole → ONE BRAIN-leerbewijs en portaal.
