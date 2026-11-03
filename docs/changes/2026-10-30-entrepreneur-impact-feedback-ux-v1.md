# Portal V2 — ondernemerservaring, resultaatbewijs en lerende interactie (kandidaat)

Datum: 2026-10-30
Fingerprint: portal|entrepreneur-experience|prediction-action-outcome-feedback|20261030-v1
Status: PR-kandidaat. Geen claim van livegang of verbeterde klant-KPI zonder exacte productie- en gebruiksbewijzen.

## Strategische USP

Niet een dashboard dat veel grafieken toont, maar een **intuïtieve bedrijfscockpit die uitlegt wat belangrijk is, helpt een besluit uit te voeren en daarna laat zien of het werkte**. Geen AI-theater of extra widgetstapels.

De zichtbare interactielus op alle relevante pagina's:
**Wat verandert? → Waarom doet het ertoe? → Wat verwachten we? → Wat kan ik doen? → Wat gebeurde er? → Wat leverde het op? → Wat leren we?**

De bestaande Powerhouse/ONE BRAIN/Heartbeat blijven één bron van waarheid. Het portaal is een rol-/situatiegerichte projectie van hun tenant-scoped data. Geen tweede CRM, analytische eventstore, brain, scheduler, writer of experimentagent.

## Verplicht interaction contract (alle pagina's)

1. **Oriëntatie binnen vijf seconden.** Op elke pagina zijn het doel, de belangrijkste afwijking, de eerstvolgende toegestane handeling en de bewijskwaliteit herkenbaar. Normale ondernemerstaal, jargon achter 'Waarom?'.
2. **Één primaire volgende stap.** Contextuele prioriteit boven generieke navigatie; wel altijd een voorspelbare router, terugknop, zoekfunctie en complete navigatie.
3. **Actie → gevolg.** Toon vóór iedere betekenisvolle handeling scope, verwachte waarde, risico, doorlooptijd, eigenaar, benodigde toestemming en meetlat. Gebruik bestaande approval/execution-gates; geen automatische externe side effect vanuit een visuele knop.
4. **Uitvoeringsbewijs.** Toon na de handeling een begrijpelijke status en tijdlijn met beslissings-ID, uitvoeringsbewijs, meetdatum, onafhankelijke uitkomst en leertoepassing. ACK/HTTP 2xx is niet hetzelfde als bedrijfsimpact.
5. **Verwacht versus gerealiseerd.** Vergelijk alleen cijfers met dezelfde meeteenheid, definitie, baseline en periode. Een betrouwbare delta heeft geverifieerde bron, versheid en tenant-scope nodig. Urenbesparing is niet automatisch winst in euro.
6. **Transparante onzekerheid.** Onderscheid 'voorspeld', 'in uitvoering', 'bewijs ontbreekt', 'geverifieerd resultaat' en 'geleerd en toegepast'. Onbekende waarden blijven onbekend, niet nul.
7. **Progressive disclosure.** Eerst kernboodschap en actie, daarna optioneel 'Waarom?', bronnen, alternatieven en modelversies. Semantisch HTML; toetsenbord-, schermlezer- en aanraaktoegankelijk.
8. **Context in plaats van navigatiedoolhof.** Eenzelfde record krijgt dezelfde status in Overzicht, Kansen, Acties, Impact, Monitoring & Leren en domeinpagina's; source en owner blijven consistent.
9. **Mens blijft verantwoordelijk.** Leg uit waarom AI iets voorstelt; scenario's veranderen geen actuals. Toestemming blijft expliciet voor externe, financiële, identiteitsgevoelige en onomkeerbare acties.
10. **Werkelijke UX-verbetering.** Test taakvoltooiing, tijd tot besluit, fouten, tevredenheid, zakelijke uitkomst en privacytoestemming; niet alleen clicks of verblijfsduur. Gebruik gecontroleerde experimenten en rollback.

## UX-innovaties die gefaseerd worden getoetst

- **Mijn dag in drie besluiten:** drie belangrijkste aandachtspunten met reden, impact, actie en eigenaar.
- **Actiekaart met twee tijdlijnen:** boven voorspelde opbrengst, onder bewezen realisatie; tap/click voor bewijs.
- **Beslissingsbon:** begrijpelijk ontvangstbewijs na ieder besluit; niet verwarren met bedrijfsresultaat.
- **Wat-als schuifregelaars:** scenario-impact zonder actuals te overschrijven; keyboard-equivalent.
- **Impactkaart van onderneming:** effect op omzet, marge, cash, capaciteit, risico, klanttevredenheid en duurzaamheid; alleen indien gemeten.
- **Explain-in-place:** zakelijke verklaring in één zin, met facultatieve bronnen/rekensom.
- **Contextueel herstellen:** ontbrekende data voorzien van veilige herstelinstructie in plaats van een lege grafiek.
- **Adaptieve rolweergave:** directie ziet prioriteiten, finance cash/marge, operatie doorlooptijden; waarheid/autorisatie gelijk.
- **Veranderverhaal:** 'wat is er sinds je vorige bezoek veranderd?' met oorspronkelijke baseline en nieuwe observatie.
- **Lerende feedbackknop:** 'nuttig / niet passend' als UX-feedback, niet als geverifieerd omzetresultaat.

## Eerste implementatiestap in deze PR

- Hergebruik de bestaande tenant-scoped Executive Projection en executive-cockpit.
- Nieuwe **read-only** outcome-feedback component: maximaal vier bestaande outcome-enveloppen, verwachting vs. werkelijk (alleen onafhankelijk VERIFIED + gezonde bron + source_refs), neutraal verschil; leereffect alleen met learning evidence refs én volgende beslissing.
- Zichtbaar in de directiecockpit bij beschikbare en ontbrekende tenant-projectie.
- Responsief en toetsenbordtoegankelijk binnen bestaande styles.js; geen nieuwe data-authority/executor/telemetry.
- Test: tests/brain-entrepreneur-impact-feedback-20261030.test.mjs.
- Bestaande goal-outcome-learning kalibratie met minimaal drie verified outcomes blijft ongewijzigd.
- **Nog niet geïmplementeerd:** hergebruik op alle domeinpagina's, autonome UX-experimenten, onafhankelijke business-ROI/attributie, usability study, productie-readback en bewezen verbeteringen. Dit zijn vervolg-obligations voor bestaande UX/release-eigenaren, geen resultaten.

## Canonieke data- en meetketen voor uitbreiding

signaal-ID → aanbevelings-ID → beslissing-ID → actie-ID → provider-ID → outcome-ID → bron-/baselinebewijs → learning-ID → volgende beslissing-ID.

Hergebruik bestaande powerhouse.executive.outcomes, outcome_pairs, Goal Cockpit, Outcome Memory, Heartbeat en bestaande consent/GA4-bronnen. Maak geen tweede writer. Ontbrekende of niet-verifieerbare koppelingen krijgen EVIDENCE_DUE. Geen dubbel getelde actie tussen pagina's.

Voor verbetering monitoren bij geldige toestemming: taakvoltooiing, mediane tijd tot besluit, begrijpelijkheid, foutieve/afgebroken acties, mobiel/keyboard/WCAG, bereik van geverifieerde outcomes, en waar onafhankelijk bewezen omzet, order en retentie. Geen synthetische bezoekers/clicks/orders.

## Acceptatie vóór groene release

1. Bestaande Required, BRAIN, CodeQL en relevante visuele/mobiele gates.
2. Keyboard, screenreader en mobiel gecontroleerd; WCAG 2.2 AA waar van toepassing.
3. Fail-closed bij stale/missing/low-confidence, provider-ACK, mismatch units, XSS, ontbrekend resultaat en learning zonder bewijs.
4. Exact protected main SHA → Netlify → live DOM en tenant-readback; rollback en leer-/documentatie-writeback.
5. Alleen onafhankelijk gemeten UX- of bedrijfsverbetering als gerealiseerd leereffect; geen claim 'wereldleidend' zonder gebruikersonderzoek en marktbenchmark.

Externe uitgangspunten:
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Nielsen Norman Group progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/

Deze architectuur is een uitbreidingsbesluit voor Portal V2. Nieuwe agents hergebruiken dezelfde component en veranderen de interface alleen wanneer een betere bewezen oplossing bestaat.

## Uitbreiding strategisch advies — diagnose, afweging en uitvoerbaar besluit

Dezelfde kandidaat-PR bouwt de leesbare `strategic-advisor.js` op basis van de bestaande `executive-projection.js`. De ondernemerscockpit en bestaande Next Best Actions-beslispagina krijgen identiek advies: reden, oorspronkelijke probleemcontext, bron, prioriteit, voorspelde impact (apart gelabeld), onderbouwde alternatieven, ontbrekende afwegingen, toestemmingsgrens, vervolgactie en geverifieerde outcome-koppeling.

De module voegt **geen** nieuwe bron, opslag, AI-executor, planner, autonome writer of klantdata toe. Het is nadrukkelijk geen generieke 'McKinsey/BCG' claim: strategische kwaliteit is een toetsbaar productdoel, geen externe affiliatie.

Minimaal vijf evalvragen voor iedere advieskaart:
1. Is het onderliggende signaal actueel, tenant-scoped en herleidbaar?
2. Zijn de alternatieven expliciet onderbouwd of wordt het ontbrekende bewijs zichtbaar?
3. Is verwacht effect duidelijk gescheiden van gerealiseerd effect?
4. Is de actie omkeerbaar en/of is toestemming vereist?
5. Kan de ondernemer het besluit binnen enkele seconden begrijpen en de volgende stap zelfstandig nemen?

Gecontroleerde productiebron 30-10-2026: Powerhouse lagen 32/32, jobs 18/18, errors 3, architecture AMBER, 7d 9.202 niet-robot growth-events, 0 persisted primaire CTA events en 0 growth-outcomes. Niet interpreteren als 'geen echte klikken' of 'geen orders' voordat bron- en attributieketens correct zijn. Originele CRO agents repareren meetbewijs eerst en testen daarna optimalisaties. Resultaat/impact moet expliciet geverifieerd worden.

Regressie: `tests/brain-strategic-advisor-one-loop-20261030.test.mjs`.
