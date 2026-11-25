# Ondernemerswaarde eerst — website en bestaand portaal

Datum: 2026-11-02
Fingerprint: `value-first-entrepreneur-trust-20261102-v1`
Status: codewijziging op featurebranch; geen liveverklaring zonder exact-head checks, merge en Netlify readback.

## Aanleiding
De publieke eerste indruk maakte niet snel genoeg duidelijk hoe een ondernemer waarde krijgt uit Bedrijfsgeheugen; de uitgebreide techniek stond voor de concrete aanleiding tot kopen. Een publieke demo is geen klantresultaat. Een voorstel, prognose of indicatieve scanwaarde mag niet als gerealiseerde omzet of kostenbesparing worden getoond.

## Wijziging in de bestaande keten
- Website: laatst uitgevoerde Netlify-copyprojectie toont vóór de technische productuitleg omzet, verspilling, meetbaar effect en duidelijke primaire scan-CTA. NL en EN worden op dezelfde canonieke buildroute samengesteld.
- Portal V2: het al bestaande `mountEntrepreneurHome` toont drie prioriteitskaarten: volgende stap, bronkwaliteit en gemeten uitkomst. Geen tweede database, agent, scheduler, dashboardprojectie of tenantautorisatie.
- Portaalwaarden komen uitsluitend uit dezelfde geauthenticeerde `stateClient.getSnapshot().state` en `buildEntrepreneurJourneyModel`; zonder ingelogde principal geen klantkaarten.
- Een `verified-proposal` blijft voorstel. Alle niet onderbouwde claims blijven onbekend. Uitkomstenteller toont uitsluitend unieke, brongeverifieerde uitkomsten uit het bestaande evidencecontract; geen fictieve euro-ROI.
- De bestaande scan, goal-ACK, approval, router, portalplan, Heartbeat en ONE BRAIN-contracten blijven onaangetast.

## Controle en regressie
1. `node --test tests/brain-site-shell-homepage-daily-steering-positioning.test.mjs`
2. `node --test portal-v2/tests/entrepreneur-home.test.mjs`
3. Netlify preview op exacte PR-head, browserbeoordeling desktop/mobiel, geen dubbele secties na 2 builds.
4. Afgeschermde klantdata pas na principal-auth; sessie- en tenantwissel; zonder bron geen resultaten.
5. Required + CodeQL + portal/backend + Netlify build; pas na beschermde merge en exacte productiecommitreadback status LIVE.
6. Commerciële impact pas als nieuwe providerdata voor scan→gekwalificeerd bezoek→aanmelding→betaalde order aantoonbaar en periodegelijk zijn. Geen resultaten van deze UI-wijziging verzinnen.

## Niet opgelost binnen deze wijziging
Aanmelden/betalen/proefperiode vereist een afzonderlijke echte E2E-test met provider-readback, zodat een prototype-/demovermelding niet verward wordt met actieve authenticatie. Geen betaalde order of productie-release wordt uit deze PR afgeleid.


## Live productie-main integratie en oorspronkelijke ONE BRAIN-fouten
Op 2 november is de aparte, reeds goedgekeurde Portal V2 klantwaardebriefing #5247 daadwerkelijk in main-commit `285dab223d18eb9ec26d649f99a4b0279b98527e` gepubliceerd (Netlify READY). PR #5248 komt hier **aanvullend** bovenop: drie acties/bron-/outcome-kaarten in de oorspronkelijke `entrepreneur-home`, geen duplicaat van de oorspronkelijke Executive Cockpit briefing en geen overschrijving daarvan.

Oorspronkelijke `public.brain_observe_failure` registreerde op 2 november drie unieke, idempotente real-world source failures met maturity `OBSERVED`: 
- `powerhouse|delivery|pr5248-missing-machine-admission-metadata|20261102-v1`, protected run 41402742631.
- `powerhouse|learning|pr5248-invalid-historical-test-path|20261102-v1`, protected run 41402955306.
- `powerhouse|system-map|pr5248-explanation-inventory-hash-drift|20261102-v1`, protected run 41403060983.

Alle drie hebben de oorspronkelijke bronrun, oorzaak, fix, eigenaar en preventieregel als gecanoniseerde evidence; geen `PROVEN` of groen zonder regression + consequent geslaagde protected CI/natuurlijke volgende-run/productie-readback. De **bestaande** root `AGENTS.md`, company-intelligence en self-improvement skills zijn rechtstreeks bijgewerkt. De oorspronkelijke dagelijkse executor, klanttenant-ACL, CMS-redactie, GDPR, factuur-/betalingstoestemming en bron-meetregels blijven intact. 
