# Living Business Interface — ondernemerskompas, niet een extra dashboard

Datum: 2026-10-30. Status: CANDIDATE_PR, **niet LIVE of klantgevalideerd**.
Fingerprint: `portal|ux|decision-first-cognitive-load-and-evidence|20261030-v1`.
Eigenaar: bestaand Portal V2 / Product & UX binnen Powerhouse / ONE BRAIN / Heartbeat.
Basis: originele `portal-v2/entrepreneur-home.js`, `entrepreneur-home-model.js`, `entrepreneur-journey-view.js` en `portalDomainState`.

## Permanente productbelofte
**De ondernemer hoeft de software niet te begrijpen; de software begrijpt de ondernemersvraag.**
Dat is een ontwerpdoel, geen claim dat de toepassing nu aantoonbaar de markt leidt.
Elke schermactie helpt de gebruiker antwoorden op:
1. Hoe gaat mijn bedrijf? 2. Wat speelt er? 3. Waarom telt het? 4. Wat kan ik doen? 5. Wat leverde het werkelijk op?

Geen tech-jargon, opgelegde AI-chat, overvloed aan dashboards of cosmetische groene cijfers. Innovatie moet *minder beslisfrictie en betere aantoonbare klantuitkomsten* opleveren, niet slechts nieuwe animatie.

## Vastgestelde frictie en gerichte eerste reparatie
De bestaande doelgestuurde startpagina heeft zeven doelkeuzes, scan- en doelkaarten, een onderbouwde volgende stap, vijf journey-stadia, bewijs-/autopilottegels, scenario-ingang en technische systeemflow. Veel is functioneel goed, maar de eerstvolgende beslissing stond ná uitgebreide keuzelijsten en uitleg.
**Root cause:** primair handelen en optionele onderbouwing waren visueel gelijkwaardig; de gebruiker moest zelf informatie uitfilteren.

Eerste kandidaatwijziging (geen nieuwe engine):
- Houd bij eerste gebruik de doelkeuze zichtbaar; na het kiezen wordt doelwisseling één toegankelijke uitklapbare regel.
- Plaats exact de **bestaande** uit tenantgebonden data afgeleide volgende stap direct bovenaan: ondernemingskompas, reden, bestaand brononderscheid en één primaire actie.
- Verplaats scan, bedrijfsgegevens, vijf-stappenreis, bewijs, autopilottegels en voortgang naar native `details/summary` (progressive disclosure). De expliciete knop 'Waarom deze stap?' opent dit deel direct.
- Laat bestaande pagina's, Winstnavigator, Brain, bewijs, goedkeuringen en actie-autoriteit volledig beschikbaar; alles blijft met toetsenbord bruikbaar.
- De optionele verdiepingsstand wordt alleen tijdelijk in de huidige view onthouden, niet in browseropslag of tenantdata; logout/tenantwissel wist hem.
- Geen verzonnen ROI, scores, echte acties, uitkomstbewijzen, analytics-events of bronzekerheid.

## Next-gen UX-functies — gefaseerde ontwerpvisie, nog niet geïmplementeerd
1. **20-seconden bedrijfsbriefing:** verandering sinds laatste bezoek, maximaal drie aandachtspunten, één aanbeveling; expliciete data-actualiteit en 'onbekend'.
2. **Intent-first navigatie:** zoek op zakelijke vraag ('Waar lekt mijn marge?') en krijg antwoord, bron, beslisroute en veilige volgende stap in één context; hergebruik bestaande Ask Portal en pagina-router.
3. **Explainable Decision Twin:** vóór besluiten verifieerbare scenario's vergelijken (doen/niet doen), bandbreedte, aannames en bron; geen scenario als gerealiseerde omzet aanprijzen.
4. **Action receipts:** per goedgekeurde actie zichtbaar *voorgesteld → toestemming → uitgevoerd → providerreadback → gemeten → geleerd*, met herstel/rollback waar werkelijk mogelijk.
5. **Adaptieve diepte:** default eenvoudige ondernemerstaal, experts kunnen zonder aparte dataset naar gegevenslijn, KPI-definitie, tijdvenster, onzekerheid en details.
6. **Immersieve bedrijfskaart:** doelen, mensen, processen en gebeurtenissen als navigeerbare verbanden **alleen als dat aantoonbaar sneller besluiten oplevert**. Geen onverklaarbare 3D-animatie.
7. **Meertalige, mobile-first, toegankelijkheid:** WCAG 2.2 AA als acceptatiedoel, toetsenbord, screenreader, duidelijke focus, reduced motion, touch. Visuele stijl kan vernieuwen, betekenis en stabiliteit blijven consequent.
8. **Gedoseerde autonomie:** bij lezen/analyseren direct ondersteunen; voor externe verzending, betaling, destructieve wijziging of noodzakelijke expliciete toestemming altijd de originele bevoegdheidsgrens en duidelijke preview/controle.

## Continu UX-kwaliteitsmechanisme — bestaande natuurlijke Powerhouse-lus
Signaleren: vanuit bestaande consented UX/portal telemetry, feedback, support en funnels, nooit cross-tenant of zonder toestemming. Meet eerst of betrouwbare, toerekenbare basisgegevens beschikbaar zijn. Ontbrekende data = EVIDENCE_DUE.
Prioriteren: prioriteit voor taakvoltooiing, correctheid en frustratiereductie, daarna conversie/retentie/omzet, daarna esthetiek. Voorkom dat vanity metrics toegankelijkheid verslechteren.
Experimenteren: hypothese, cohort, baseline, vergelijking/holdout indien verantwoord, gelijkwaardige data-vensters; experiment mag hulptekst of CTA aanpassen, niet ongemerkt klantverplichtingen.
Veilig leveren: bestaande agent/skill, ONE BRAIN fingerprint, exclusieve writer, protected Required/CodeQL, exact main→Netlify, tenant A/B/guest browser/readback, kleine omkeerbare UI-release.
Leren: effect pas VALIDATED na echte gebruikstaak en onafhankelijke bronmeting; register en portal bijwerken via bestaande infrastructuur, geen tweede scheduler.

### Te meten UX-uitkomsten (doelen, geen gemeten prestaties)
- Tijd tot eerste begrijpelijke actie (mediaan), time-to-decision en taakvoltooiingspercentage per echte ondernemerstaak.
- Eerste-sessie activatie: doel kiezen → bevestigde opslag/ACK → volgende stap geopend.
- Frictie: terugnavigatie, foutmeldingen, afhaakmomenten, aantal verplichte interacties, hulpvraagpercentage.
- Vertrouwen: gebruiker kan het onderscheid tussen voorstel / voorspelling / uitgevoerd / geverifieerd resultaat correct uitleggen.
- WCAG-audits, keyboard/screenreader succes, mobiel bruikbare targets, performance/CLS.
- Commercieel: consented website→scan→opt-in→gekwalificeerde lead→onafhankelijk geverifieerde order; geen deterministische dagelijkse stijging claimen.

## Acceptatie en waarheid
Code- en source-regressie: `node --test portal-v2/tests/entrepreneur-home.test.mjs` en bestaande journey/goal/routing/security tests.
Releasebewijs vereist protected PR, Required/BRAIN/CodeQL, exacte huidige main-SHA, Netlify READY/current exact SHA en onafhankelijke DOM-readback.
Klantbewijs vereist twee echte geautoriseerde tenants, guest/preview-no-leak, doelwissel + ACK, mobiele/keyboard parcours, en taak-/impactmeting. Zonder dit blijft marktleidend/UI-succes een **ambitie**, geen bewezen resultaat.
Rollback: frontendregels terugdraaien; data/Brain/Heartbeat/authorities blijven onveranderd.
