# Powerhouse 1 organisme — canonieke 15-lussenbron in Portal V2

**Datum:** 30 oktober 2026. **Eigenaar:** bestaande ONE BRAIN / Heartbeat / Portaal Reliability / SkillOps. **Bestaand incident:** [#4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918). **Geen nieuwe scheduler, writer of truth store.**

## Oorzaak

De beschermde GitHub/Netlify-release van Agent Fabric en 32/32 gekoppelde intelligentielagen waren technisch groen, maar de oorspronkelijke `powerhouse_loop_assurance_state_v1` registreert afzonderlijk vijftien lussen met expliciete guard, timestamps en vereiste bewijsfasen. De bestaande Powerhouse Control Center Live-weergave gebruikte vooral eventgroepen; daarin ontbrak een concreet totaaloverzicht van de actuele vijftien brongebonden lussen. Groen op code en architectuur kan daardoor voor volledige autonome werking worden aangezien.

Supabase op 30 oktober rond 07:06 UTC: **15 lussen, 9 GREEN, 1 AMBER, 5 RED**; 32/32 WIRED, 18/18 verplichte jobs actief, 2 actuele runtimefouten en learning `EVIDENCE_DUE_GAPS`. De oorspronkelijke RED-guards: `content-closed-loop`, `daily-compound-learning`, `full-cycle-production-proof`, `one-brain-reconcile`, `revenue-flywheel`. De oranje `autonomous-outreach` mist actie- en readbackbewijs. Dat zijn geen ontbrekende schedulers. Onderliggende correcties blijven bij originele eigenaren en bronnen. Een volledig gevulde 8/8 stagecount is **niet** hetzelfde als guard_pass=true.

## Eén bron, één conclusie

De bestaande `public.powerhouse_loop_assurance_state_v1` is de exclusieve statusautoriteit van de oorspronkelijke 15 lussen. De kleine uitleesmodule `brain/observability/one-loop-assurance-readback.mjs` doet een begrensde GET op deze originele view. De route `netlify/functions/powerhouse-one-loop-assurance.mjs` gebruikt dezelfde Netlify admin/JWT/tenanttoegangscontrole als het bestaande Control Center. De bestaande UI `portal-v2/modules/powerhouse-observability.js` toont op de Live-tab het totaal en per lus de status, oorspronkelijke guard, ontbrekende fasen en bronwaarneming. De nieuwe route bestaat uitsluitend om de bestaande afgeschermde UI een overzicht van dezelfde bron te geven; hij organiseert of publiceert niets.

De projectie volgt vaste waarheidsregels: precies 15 unieke actuele records; maximaal 20 minuten leeftijd; elke bron-RED maakt het totaal RED; geen rood maar minimaal één bron-AMBER maakt het totaal AMBER; pas overal expliciet GREEN maakt het totaal GREEN. Een onvolledig, verouderd, onjuist of tegenstrijdig overzicht krijgt uitsluitend `UNVERIFIED`, **niet** 0 of groen. Geen rechten, tokens, provider-ID's, ruwe foutpayloads, klanten of bedrijfskritische secrets gaan terug naar de browser. Geen fallback naar klant-API en geen onbeperkte retries.

## Betekenis voor agents en herstel

Eén gezamenlijke handelwijze blijft: bestaande bron -> ONE BRAIN-context -> prioriteit -> originele eigenaar/agent -> veilige uitvoering met CAS en consent -> onafhankelijke provider/operationele uitkomst -> resultaat -> learning -> regressiepreventie -> originele Portal/Heartbeat-readback. Een toekomstige run kan pas zijn eigen guard op groen zetten met onafhankelijk bewijs. Extra schedules, logboeken of agents die de oorspronkelijke status overschrijven zijn verboden. Het portaal houdt de bestaande foutgrenzen: LinkedIn persoonlijk 30 oktober `STORY_FAMILY_DUPLICATE` tegen 27 oktober; 29 oktober bestaande providerpost mag nooit opnieuw worden verzonden; bedrijfspagina OAuth-herautorisatie blijft menselijk; Mira-identiteitsmatch en blog-redactionele goedkeuring blijven harde gates. Het huidige `one-brain-reconcile` RED is geen toestemming om de hele dag op GREEN te forceren.

## Acceptatie

- Canonieke regressie `tests/brain-one-loop-assurance-readback-20261030.test.mjs` verifieert echte 9/1/5 uitslag, incomplete/duplicaat/oudere bronnen, guardconflicten, afgeschermde route en HTTP-fail closed.
- Protected PR Required/BRAIN/CodeQL/System Map en scope-eigenaar. Laat bron in `OBSERVED` totdat test én eigen productie-deploy zijn afgelezen.
- Na merge Netlify `READY` met exact main-SHA en oorspronkelijke admin-only browserreadback; ongeautoriseerde 401/403. Productie-code LIVE is nog niet gelijk aan resultaat `FULL_GREEN`.
- Elke originele rode lus wordt pas afzonderlijk gesloten als zijn eigen `guard_pass` en uitkomst aantoonbaar groen zijn. Geen statuswijziging of fictieve order.

**Opmaak en bewijsgrens:** dit is de menselijke architectuurbeschrijving voor een beschermde kandidaat, geen claim dat alle vijftien lussen autonoom hersteld zijn.
