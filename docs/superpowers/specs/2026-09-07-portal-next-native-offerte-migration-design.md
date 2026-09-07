# Portal Next native offerte- en projectmigratie

Datum: 2026-09-07
Status: ontwerp goedgekeurd in chat; klaar voor implementatieplanning na spec-review
Branch: `feature/portal-next-native-offerte-migration`

## 1. Doel

Portal Next wordt de enige zichtbare frontendlaag voor klantprojecten. De huidige legacy-bridge, iframe-weergave en links zoals `Open los` verdwijnen uit Portal Next zodra de native equivalenten compleet en getest zijn.

De bestaande IJsselmonde-offerte en bijbehorende projectstructuur blijven de bron van waarheid. We kopiëren die informatie niet naar losse hardcoded demo-objecten, maar lezen dezelfde klant- en offertedata en renderen die native in Portal Next.

De bestaande productieportal `/klantportaal?klant=ijsselmonde` blijft tijdens deze migratie ongewijzigd als rollback/reference. Portal Next wordt afzonderlijk opgebouwd en getest.

## 2. Kernprincipe

Voor een klantcontext geldt één functionele keten:

`Klant → Offerte → Onderdelen → Sprints → User stories → Documenten → Koppelingen → Planning/Roadmap → Taken/Acties → Outcome/Evidence → Learning/Writeback → Brain`

Iedere Portal Next-view gebruikt dezelfde klantcontext en dezelfde onderliggende project-/offertegegevens. Geen view onderhoudt een concurrerende eigen kopie van die gegevens.

## 3. Databronnen en model

### 3.1 Bestaande bron

De huidige IJsselmonde-offerte bestaat reeds in de applicatiedata en bevat onder meer:

- offerte-identiteit, titel, nummer, status, totaalbedrag en geldigheid;
- vaste en optionele onderdelen;
- prijs en doorlooptijd per onderdeel;
- sprints per onderdeel;
- user stories per onderdeel;
- documenten/deliverables met week;
- koppelingen met doel en geplande week;
- planning/fasering;
- licenties en externe kosten;
- informatie die de klant moet aanleveren;
- architectuur;
- doorlopende abonnementsafspraken;
- getekend/akkoord en voortgang waar beschikbaar.

De native Portal Next-laag normaliseert dit naar één intern projectmodel. De eerste implementatie mag de bestaande JSON-structuur adaptief lezen; migratie naar een verder genormaliseerd backendmodel is geen voorwaarde om de frontend native te maken.

### 3.2 Geen fictieve klantwaarheid

Normale klantmodus mag geen ontbrekende waarden invullen met demo-KPI's, voorbeeldpersonen, verzonnen statussen, verzonnen voortgang of fictieve runtime.

Wanneer data ontbreekt toont Portal Next expliciet een neutrale status zoals `Niet beschikbaar`, `Nog niet gestart`, `Waiting` of `Niet geverifieerd`.

Demo-inhoud blijft uitsluitend toegestaan op een expliciete demo-route.

## 4. Native Portal Next-views

### 4.1 Offerte

De offertepagina toont native:

- klantnaam;
- offertenummer;
- offertestatus;
- titel en kernpropositie;
- totaalbedrag;
- geldigheid;
- akkoord/getekend-status;
- vaste prijs/resultaatverplichting;
- fasering;
- vaste versus optionele onderdelen;
- licenties/externe kosten;
- doorlopende portal-/abonnementsafspraak;
- benodigde input van de klant;
- architectuur en bewuste afwijkingen/keuzes uit de offerte.

De pagina bevat geen iframe en geen link die nodig is om functionele informatie in de oude portal te bekijken.

### 4.2 Onderdelen

Ieder offerteonderdeel wordt een native projectonderdeel, bijvoorbeeld:

- Fase 1 — Meten opzetten;
- Fundament — datamodel en directiescherm;
- Marketing en UTM-analyse;
- ESG, duurzaamheid en operations;
- HR en veiligheid;
- Signalering;
- Vragen stellen in gewone taal;
- Maandduiding;
- Meldingen lezen en clusteren.

Per onderdeel tonen we minimaal:

- titel;
- korte omschrijving;
- prijs;
- aantal weken;
- vast/optioneel;
- type indien relevant, bijvoorbeeld AI;
- status afgeleid uit echte project/runtimegegevens;
- gekoppelde sprints, stories, documenten en koppelingen.

### 4.3 Sprints

Iedere sprint wordt native zichtbaar binnen het juiste onderdeel en via een centrale sprint-/uitvoeringsview.

Per sprint:

- titel;
- wat er wordt gedaan;
- concrete oplevering/resultaat;
- gepland tijdvak/week indien beschikbaar;
- status;
- gekoppelde user stories;
- gekoppelde documenten;
- gekoppelde koppelingen;
- gekoppelde acties/eigenaar indien runtime beschikbaar is.

Een sprintstatus mag alleen `actief`, `afgerond` of vergelijkbaar worden wanneer daarvoor bewijsbare project- of runtimegegevens bestaan.

### 4.4 User stories

User stories worden native weergegeven als:

`rol → behoefte → beoogd resultaat`

Ze blijven gekoppeld aan het oorspronkelijke offerteonderdeel en waar mogelijk aan de sprint waarin ze worden gerealiseerd.

De gebruiker kan vanuit een story doorklikken naar:

- het onderdeel;
- sprint;
- relevante bron/koppeling;
- taak/actie;
- outcome/evidence zodra die bestaat.

### 4.5 Documenten

De native Documenten-view toont alle offerte-deliverables, inclusief:

- documentnaam;
- onderdeel;
- geplande week;
- status;
- versie/bestand indien beschikbaar;
- eigenaar indien beschikbaar;
- evidence/provenance.

Een offerte-document zonder daadwerkelijk bestand blijft zichtbaar als geplande deliverable en wordt niet ten onrechte als opgeleverd gemarkeerd.

### 4.6 Koppelingen

De native Koppelingen-view toont de integraties/bronnen uit de offerte, bijvoorbeeld GA4, Google Tag Manager, BigQuery, Power BI Service, SharePoint/OneDrive, interne bestanden, mail of Teams.

Per koppeling:

- naam;
- doel/waarom;
- gekoppeld onderdeel;
- geplande week;
- runtime-status indien aantoonbaar;
- autorisatie/synchronisatie/statusdetail indien beschikbaar;
- evidence.

Een genoemde offerte-koppeling is niet automatisch een actieve technische koppeling. Zonder runtime-evidence blijft de status gepland/idle/waiting.

### 4.7 Planning en roadmap

De offerteplanning wordt native vertaald naar dezelfde roadmap die Portal Next gebruikt.

Minimaal zichtbaar:

- akkoord/start;
- Fase 1;
- Fundament;
- aanvullende schermen;
- AI-onderdelen;
- geplande week/periode;
- afhankelijkheden;
- werkelijke voortgang wanneer beschikbaar.

De roadmap mag offerteplanning en runtime-uitvoering naast elkaar tonen, maar moet duidelijk onderscheid maken tussen `gepland`, `observed` en `verified`.

### 4.8 Taken en acties

Taken worden niet uit de offerte verzonnen. Ze ontstaan uit expliciete projectdata, sprintuitvoering of Powerhouse/runtime-acties.

Waar beschikbaar bevat een actie:

- omschrijving;
- bron/offerteonderdeel;
- sprint/story;
- eigenaar;
- deadline;
- status;
- blocker;
- evidence;
- outcome.

## 5. Navigatie en informatiearchitectuur

Het goedgekeurde Portal Next-front-enddesign blijft leidend.

De zichtbare hoofdnavigatie blijft:

- Overzicht
- Bedrijfsgezondheid
- Strategie & uitvoering
- Processen & organisatie
- Kennis
- Data & koppelingen
- AI & Insights
- Acties & impact
- Rapportages & beheer

De volledige deep-page structuur blijft bereikbaar via `Alle pagina's` en het mobiele hamburger-menu.

De offerte/projectinformatie wordt op de juiste functionele pagina verdeeld, niet op één enorme offertepagina gedupliceerd:

- Offerte → commerciële scope en afspraken;
- Strategie & uitvoering / Roadmap → planning, fasering, mijlpalen;
- Processen & organisatie / Taken & werkstromen → uitvoering;
- Kennis / Documenten → deliverables en bestanden;
- Data & koppelingen → integraties/bronnen;
- Acties & impact → acties, outcomes en evidence;
- AI & Insights → AI-onderdelen, Brain/Powerhouse-context;
- Rapportages & beheer → audit, rechten, governance.

## 6. Drie informatielagen

Iedere relevante native view volgt dezelfde informatiehiërarchie:

1. **Managementbeeld** — korte samenvatting, status, risico's, keuzes en voortgang.
2. **Operationele details** — onderdelen, sprints, stories, planning, eigenaarschap en afhankelijkheden.
3. **Trace & evidence** — bron, offerteversie, dataherkomst, Brain/Powerhouse-context, acties, outcomes en learning.

Deze drie lagen mogen visueel compact zijn, maar de achterliggende data mag niet worden weggegooid of verborgen achter de oude portal.

## 7. Brain / Powerhouse / evidence

De offerte is een bronobject binnen het Business OS en kan downstream context leveren, maar alleen feitelijke runtime krijgt een actieve status.

Canonieke trace:

`Offerte/bron → Datahub/context → AI Brain → Powerhouse-agent → portalmodule → actie → eigenaar → outcome → evidence → learning/writeback → Brain`

Regels:

- geen actieve lijn zonder runtime-evidence;
- succes/completed zonder evidence wordt niet `verified`;
- geplande offerte-items zijn geen actieve runtime-items;
- een outcome heeft `expected`, `observed` en `verified` als afzonderlijke concepten;
- writeback wordt alleen als voltooid getoond met execution evidence;
- blocked/recovery blijft zichtbaar tot herstel geverifieerd is.

## 8. Legacy-afbouw

### 8.1 Tijdens migratie

De huidige `/klantportaal?klant=ijsselmonde` blijft intact als rollback/reference.

Portal Next mag tijdens de implementatiefase intern nog vergelijkingstests uitvoeren tegen legacy, maar de eindgebruikersinterface toont:

- geen iframe naar `klantportaal.html`;
- geen `Open los`-knop naar legacy;
- geen afhankelijkheid waarbij ontbrekende Portal Next-functionaliteit alleen via legacy bereikbaar is.

### 8.2 Exitcriterium legacy-bridge

De legacy-bridge mag pas worden verwijderd uit Portal Next wanneer de parity-matrix voor alle betreffende pagina's groen is:

`oude functie | native view | inhoud compleet | interactie werkt | mobile | klantcontext | evidence/status correct | test groen`

## 9. Customer scoping

Alle data wordt geladen voor de actieve `?klant=<slug>` context of een equivalent geverifieerd tenantcontextmechanisme.

Er komt geen hardcoded `ijsselmonde` in generieke productiecomponenten.

De IJsselmonde-route is alleen een test-/voorbeeldcontext. De implementatie moet voor andere klanten hetzelfde datamodel en dezelfde componenten kunnen gebruiken.

## 10. Mobile en accessibility

De native offerte/projectviews moeten volledig mobiel bruikbaar zijn.

Vereisten:

- hamburger/drawer bevat alle pagina's;
- geen horizontale pagina-overflow;
- kaarten/tabellen krijgen een touch-first compacte representatie;
- geen hover-only functies;
- geen drag als enige bedieningsvorm;
- focus states zichtbaar;
- status nooit alleen via kleur;
- reduced-motion respecteren;
- deep links openen direct de juiste native pagina.

## 11. URL- en deep-linkcontract

Portal Next ondersteunt native deep links zoals:

- `/portal-next/?klant=ijsselmonde&page=offerte`
- `/portal-next/?klant=ijsselmonde&page=roadmap`
- `/portal-next/?klant=ijsselmonde&page=documenten`
- `/portal-next/?klant=ijsselmonde&page=koppelingen`
- `/portal-next/?klant=ijsselmonde&page=taken-werkstromen`

Navigatie binnen Portal Next behoudt altijd de klantcontext.

## 12. Foutafhandeling

- Ontbrekende offerte: toon een neutrale lege staat, geen demo-offerte.
- Ongeldige klantcontext: fail closed; geen data van een andere klant.
- Onvolledige JSON: render bekende velden en markeer ontbrekende secties als niet beschikbaar.
- Backend/runtime niet bereikbaar: behoud de offerte/projectinformatie die veilig beschikbaar is, maar markeer runtime als niet geverifieerd.
- Koppeling niet actief: toon gepland/idle, niet actief.
- Document nog niet opgeleverd: toon gepland/open, niet voltooid.

## 13. Teststrategie

### 13.1 Unit/contracttests

Minimaal:

- offerteadapter parseert de huidige IJsselmonde-structuur zonder informatieverlies;
- alle onderdelen blijven aanwezig;
- iedere sprint blijft aan het juiste onderdeel gekoppeld;
- iedere user story blijft gekoppeld;
- documenten en koppelingen behouden onderdeel/week;
- deep links selecteren de juiste native pagina;
- klantcontext blijft behouden;
- ontbreken van data veroorzaakt geen fictieve waarden;
- runtime/evidence-gating blijft fail closed.

### 13.2 Paritytests

Automatische parity-matrix tussen bestaande offertegegevens en native Portal Next-weergave voor:

- offerte;
- onderdelen;
- sprints;
- stories;
- documenten;
- koppelingen;
- planning;
- licenties;
- benodigde klantinput;
- architectuur;
- doorlopend abonnement.

Geen legacy-functie wordt als gemigreerd gemarkeerd wanneer relevante data ontbreekt in de native view.

### 13.3 Browsertests

Desktop + iPhone + tablet:

- Portal Next opent rechtstreeks op offerte;
- geen iframe aanwezig;
- geen zichtbare legacy-link aanwezig;
- alle offerteonderdelen bereikbaar;
- sprint → story → document/koppeling relaties werken;
- menu/drawer werkt;
- klantcontext blijft staan;
- back/forward/deep links werken;
- geen overflow;
- geen fictieve runtime.

### 13.4 Releasegate

Voor merge:

- required `test` groen op exacte head;
- portal lane groen;
- preview/browser parity groen;
- geen regressie in bestaande website/portalcontracten.

Na merge:

- exacte merge-SHA op productie;
- production-readback groen;
- Portal Next deep links laden;
- bestaande `/klantportaal?klant=ijsselmonde` blijft ongewijzigd totdat expliciet een migratiebesluit wordt genomen.

## 14. Niet in scope voor deze migratie

- IJsselmonde automatisch omschakelen van de huidige portal naar Portal Next;
- offerte-inhoud inhoudelijk herschrijven;
- bedragen, planning of commerciële voorwaarden wijzigen;
- nieuwe fictieve KPI's toevoegen;
- bestaande Brain/Powerhouse runtime als succesvol markeren zonder evidence;
- verwijderen van de oude portal voordat de native parity aantoonbaar compleet is.

## 15. Definition of Done

Deze migratie is pas klaar wanneer:

1. Portal Next geen iframe of zichtbare legacy-link meer nodig heeft voor offerte/projectfunctionaliteit.
2. Alle huidige offertegegevens native op de juiste Portal Next-pagina's staan.
3. Onderdelen, sprints, stories, documenten, koppelingen en planning onderling gekoppeld zijn.
4. Klantcontext overal behouden blijft.
5. Het systeem geen fictieve klant- of runtimewaarheid toont.
6. Desktop, tablet en mobiel volledig bruikbaar zijn.
7. Paritytests aantonen dat de huidige IJsselmonde-informatie niet verloren is gegaan.
8. Required CI en browserpreview groen zijn.
9. Production-readback op de exacte merge-SHA groen is.
10. De bestaande IJsselmonde-productieportal niet is gewijzigd zonder een apart expliciet migratiebesluit.
