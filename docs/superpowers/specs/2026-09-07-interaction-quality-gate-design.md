# Interaction Quality Gate — ontwerp

Datum: 2026-09-07
Status: ontwerp ter review

## Doel

Voorkomen dat interactieve websitefouten opnieuw productie bereiken. De gate moet specifiek blokkeren op fouten zoals: klik/toggle doet niets, scroll-state blijft hangen, tekst wordt onleesbaar of bedekt, een sticky/fixed element overlapt belangrijke content, buildstappen verwijderen runtime-wiring, mobiel erft desktopgedrag, keyboard/reduced-motion ontbreekt, of preview werkt maar productie wijkt af.

## Ontwerpprincipes

1. **Geen interactie zonder contract.** Kritieke interactieve componenten worden geregistreerd in één manifest met route, component-id, states, triggers en te controleren eigenschappen.
2. **Test de werkelijk gebouwde output.** Niet alleen bronbestanden controleren; de gate draait tegen de finale build-output nadat alle V18/page-policy/normalisatie-stappen zijn uitgevoerd.
3. **Browsergedrag is leidend.** Een statische test kan wiring bewaken, maar alleen een browsergate kan aantonen dat klik, scroll, zichtbaarheid, overlap en responsive gedrag werkelijk functioneren.
4. **Preview én productie-readback.** Dezelfde contracten worden eerst op de PR-preview en na deploy op de productie-URL gecontroleerd.
5. **Fail closed.** Ontbrekende componenten, ontbrekende states of onuitvoerbare checks gelden als fout; niet als stilzwijgende skip.

## Architectuur

### 1. Interaction contract registry

Nieuw manifest, bijvoorbeeld `quality/interaction-contracts.mjs`.

Per kritieke interactie bevat het minimaal:
- unieke `id`;
- route/URL;
- root-selector of robuuste tekst/DOM locator;
- benodigde viewport(s): desktop en/of mobiel;
- states die aantoonbaar bereikbaar moeten zijn;
- triggers per state: click, keyboard, scroll of combinatie;
- visibility/contrast/overlap-regels;
- optionele productie-only checks.

Eerste geregistreerde contracten:
- homepage Platform ↔ Expertise toggle;
- homepage “Eén wijziging. Overal doorgewerkt.” scroll-story;
- overige kritieke toggles/sliders die aan de protected releaseketen worden toegevoegd zodra ze als bedrijfskritisch worden aangemerkt.

### 2. Static contract gate

Node-test die controleert dat:
- ieder geregistreerd contract een bestaand component/build-entrypoint heeft;
- iedere interactie expliciete state-hooks heeft;
- finale buildpipeline de benodigde wiring bevat;
- desktop/mobile en reduced-motion waar relevant expliciet zijn afgedekt;
- nieuwe geregistreerde contracten niet incompleet kunnen worden toegevoegd.

Deze laag vangt regressies zoals “build stap overschrijft JS” vroeg en goedkoop af.

### 3. Browser interaction gate

Playwright-browsercontrole tegen de finale gebouwde site/preview.

Per contract:
- open route;
- wacht op stabiele layout;
- voer elke trigger uit;
- bevestig dat de verwachte state zichtbaar wordt;
- bevestig dat de vorige/volgende states correct leesbaar of verborgen zijn;
- controleer dat interactieve targets niet buiten viewport/achter overlays liggen;
- controleer dat geen geregistreerde content wordt bedekt door fixed/sticky overlays;
- controleer keyboardbediening waar relevant;
- controleer mobiel apart op een non-desktop fallback;
- controleer `prefers-reduced-motion` met gereduceerde animatie-instellingen.

Voor de homepage scroll-story wordt expliciet bewezen:
- state 01, 02, 03 en 04 zijn alle bereikbaar;
- scroll én CTA/step-click gebruiken dezelfde state-machine;
- de rechter cockpit verandert zichtbaar per state;
- eerdere stappen blijven leesbaar;
- toekomstige stappen worden niet zó gedimd dat tekst effectief verdwijnt;
- de gele zoektijdkaart bedekt de story niet;
- mobiel gebruikt geen vastgelopen desktop-sticky gedrag.

### 4. Geometrische overlap- en leesbaarheidsgate

De browsergate meet rechthoeken van kritieke content en fixed/sticky elementen.

Een fout ontstaat als:
- twee elementen elkaar visueel overlappen terwijl het contract dit verbiedt;
- een CTA/tekstblok voor een relevant deel achter een overlay valt;
- een kritieke tekstcontainer `display:none`, `visibility:hidden`, `opacity` onder de ingestelde grens of een niet-leesbare clipped toestand krijgt;
- een interactieve target een te klein/ongeldig interactiegebied heeft.

De gate gebruikt thresholds om anti-aliasing en minieme subpixelverschillen niet als fout te zien, maar inhoudelijke overlap wel.

### 5. Release-integratie

De bestaande protected `main`-gate blijft leidend.

Nieuwe releasevolgorde:
1. unit/static tests;
2. finale site-build;
3. Interaction Quality Gate op de gebouwde output;
4. PR/Netlify preview browser-readback;
5. merge naar `main` alleen indien required checks groen zijn;
6. productie-deploy;
7. productie-readback van dezelfde kritieke contracten.

Een productie-readback die faalt blokkeert de claim “release geslaagd” en levert een harde regression signalering op. Automatisch rollbacken valt buiten deze eerste scope tenzij de bestaande releaseketen daar al veilig ondersteuning voor heeft.

## CI en branch protection

Er komt één herkenbare required check, bijvoorbeeld `interaction-quality-gate`.

Doel:
- geen losse vrijwillige workflow die kan worden genegeerd;
- branch protection moet deze check verplicht maken voordat `main` mergeable is;
- browser-preview failures gelden als release blockers;
- production-readback wordt apart gerapporteerd zodat een post-deploy afwijking niet onzichtbaar blijft.

Omdat branch-protection beheer mogelijk niet beschikbaar is via de huidige GitHub App-permissies, wordt eerst geprobeerd de required check programmatisch te koppelen. Als alleen read-rechten beschikbaar zijn, wordt de workflow wel gebouwd en wordt de nog benodigde repository-setting expliciet als open operationele blocker gerapporteerd; er wordt niet gedaan alsof die bescherming actief is.

## Foutklassen die expliciet worden geborgd

- `interaction-no-op`: klik/toggle/CTA verandert niets;
- `state-unreachable`: één of meer states zijn niet bereikbaar;
- `scroll-desync`: scrollpositie en UI-state lopen uit elkaar;
- `build-wiring-loss`: finale build bevat de runtime-wiring niet;
- `content-hidden`: belangrijke tekst verdwijnt of wordt te ver gedimd;
- `overlay-obstruction`: fixed/sticky widget bedekt belangrijke content of CTA;
- `responsive-leak`: desktopinteractie lekt naar mobiel;
- `a11y-interaction-regression`: keyboard/ARIA-state is kapot;
- `motion-regression`: reduced-motion pad ontbreekt of breekt;
- `preview-production-drift`: preview en productie gedragen zich verschillend.

## Observability en bewijs

Bij een failure moet de gate voldoende bewijs produceren om geen debuglus te veroorzaken:
- contract-id;
- route en viewport;
- verwachte versus gevonden state;
- relevante DOM-state/attributes;
- geometrie van overlappende elementen;
- screenshot of browser-artifact indien beschikbaar;
- commit/deploy-ref;
- exacte foutklasse.

Het doel is dat één mislukte run direct antwoord geeft op “wat faalde, waar en waarom”.

## Teststrategie

TDD voor de nieuwe tooling:
- eerst tests die falen wanneer het manifest ontbreekt/incompleet is;
- eerst een browsertest die de bekende regressie simuleert, daarna de gate implementeren;
- red/green-verificatie voor ten minste `interaction-no-op`, `overlay-obstruction` en `state-unreachable`;
- daarna bestaande homepage-interacties registreren en tegen de echte finale output laten draaien.

## Scope v1

In scope:
- registry;
- statische contractcontrole;
- Playwright browsergate;
- desktop + mobiel;
- keyboard/reduced-motion waar relevant;
- overlap/zichtbaarheid;
- finale build en preview-integratie;
- productie-readback;
- CI-reporting met duidelijke foutklassen.

Niet in scope voor v1:
- generieke visual-diff van de hele website;
- volledig automatisch rollback-systeem;
- alle niet-kritieke micro-interacties meteen registreren;
- zelfherstellende codewijzigingen zonder normale PR/release-gates.

## Acceptatiecriteria

Het ontwerp is pas geïmplementeerd wanneer:
1. een kapotte CTA/toggle de gate aantoonbaar rood maakt;
2. een onbereikbare state de gate rood maakt;
3. een overlappende fixed/sticky kaart de gate rood maakt;
4. desktop en mobiel apart worden uitgevoerd;
5. reduced-motion/keyboard waar van toepassing worden gecontroleerd;
6. de homepage scroll-story en Platform/Expertise toggle als eerste echte contracten zijn geregistreerd;
7. de check tegen finale build-output draait;
8. preview-readback en productie-readback aantoonbaar dezelfde contracten gebruiken;
9. de required-check status van branch protection is geverifieerd en niet aangenomen;
10. failures bruikbare diagnostiek opleveren in plaats van alleen een generieke roodstatus.

## Implementatierisico’s

- Browsertests kunnen flaky worden door timing; daarom wachten op expliciete DOM-states/layout-stabiliteit en geen arbitraire sleeps.
- Tekstlocators kunnen breken door copywijzigingen; daarom waar mogelijk stabiele `data-*` hooks gebruiken.
- Productie-readback mag releases niet eindeloos blokkeren op externe netwerkruis; failures moeten onderscheid maken tussen applicatiefout en infrastructuur/onbereikbaar, maar beide mogen niet stil worden genegeerd.
- Branch-protection wijziging kan permission-bound zijn; status wordt expliciet geverifieerd.

## Beslissing

Aanbevolen aanpak: één centrale Interaction Quality Gate met contract registry + statische build-borging + echte browsercontrole + productie-readback. Daarmee worden de fouten uit deze chat niet individueel gepatcht, maar als terugkerende foutklassen structureel onderdeel van de release-eisen.