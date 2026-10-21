# 2026-10-21 — verbonden ondernemersreis — kandidaat en verplicht bewijs

- **Fingerprint:** `portal|eight-outcomes|connected-entrepreneur-journey|v1`
- **Oorspronkelijke signalen:** scan/ondernemersdoel, bestaande cockpit en Winstnavigator, router, Brain/Powerhouse/Heartbeat en contextuele visualisaties waren afzonderlijke UI-componenten. De Winstnavigator kwam niet voor in de mount van `portal-v2/app.js`.
- **Hoofdoorzaak:** ontbrekende UI-compositie, niet een nieuwe tenant- of modelautoriteit. Niet alle bron- en effectverwerkingsbewijzen waren zichtbaar in één klantenreis.
- **Wijziging:** maak authentieke brongebonden journey-projectie, mount bestaande Winstnavigator, start op gekozen doel, toets gedrag bij onbekende metrics, luister uitsluitend op bestaande impact- en Brain-ACK-events, toon afhankelijkheid zonder fictieve berekening, bied hulp op geregistreerde pagina's.
- **Bewijs en regressie:** `tests/brain-portal-entrepreneur-goal-home-v1.test.mjs` importeert `portal-v2/tests/entrepreneur-journey.test.mjs`; bestaande scan-claim/revalidation/owner/winstnavigator-tests blijven leidend.
- **Beveiligingsgrens:** guest/demo geen tenantkaart; veranderende principal wist gebeurtenisstatus; beheerdata uit Notion/GitHub/Netlify niet in browserside bedrijfswaarheid; Composio alleen bestaande toestemming en providerbewijs.
- **Effecttypen:** interface-afhankelijkheid ≠ feitelijke herberekening; Brain-ACK ≠ uitvoering; statische Notion-tekst ≠ live klantdata; statistische scenario-extrapolatie ≠ gevalideerd financieel resultaat.
- **Status:** wijzigingen uitsluitend op een beschermde branch; Required/CodeQL, exact-HEAD release, twee echte ingelogde klanten, 51-veldpariteit en provider outcomereadback nog verifiëren. Laat #4215/#4547 open zolang dat ontbreekt.
- **Rollback:** revert uitsluitend deze frontendintegratie; oorspronkelijke scanclaim, domainState, cockpit, Brain, scheduler, jobs, Supabase schema en overige portalmodules blijven behouden.
- **Next-step/no-repeat:** herstel foutieve regressies in dezelfde lineage; geen tweede portaal of ongeautoriseerde provideractie maken om een test rood te verbergen.
