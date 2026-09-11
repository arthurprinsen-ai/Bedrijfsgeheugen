# Portal V2 Project Navigation Design

## Doel

Portal V2 krijgt één duidelijke projectwerklaag waarin alles rond offerte, bouwen, koppelen, uitvoeren, documenteren, samenwerken en factureren logisch bij elkaar staat. De huidige mobiele navigatie wordt teruggebracht tot één globale navigatielaag met daaronder één contextuele projectlaag, zodat er niet langer twee concurrerende mobiele navigatieconcepten naast elkaar bestaan.

## Aanleiding

In het oude portaal staat een herkenbare sectie **Jouw project** met onderdelen als Offerte, Koppelingen, Taken & werkstromen, Uren & facturen, Documenten, Notities, Activiteit, Team & toegang en Integraties. In Portal V2 bestaan veel van die functies al als native pagina of module, maar ze zijn verspreid over de algemene portaalstructuur. Daardoor ontbreekt de mentale eenheid: de gebruiker ziet losse functionaliteit in plaats van één project van offerte tot oplevering.

Portal V2 heeft op mobiel bovendien twee navigatieconcepten tegelijk:

1. een vaste bottom navigation met `Overzicht / Portaal / Data & AI / Taken / Meer`;
2. een hub/sheet voor alle portaalpagina's.

De oplossing is niet een derde navigatie toevoegen, maar de bestaande lagen expliciet hiërarchisch maken.

## Besluit

### Globale navigatie

De primaire navigatie krijgt vijf vaste bestemmingen:

- **Overzicht**
- **Project**
- **Data & AI**
- **Taken**
- **Meer**

Op mobiel blijft dit de enige permanente bottom navigation. `Project` vervangt het abstracte label `Portaal`.

Op desktop blijft de algemene linker navigatie bestaan, maar daar wordt **Jouw project** een herkenbare hoofdsectie met de projectonderdelen gegroepeerd daaronder.

### Projectnavigatie

Binnen **Jouw project** ontstaat een tweede, contextuele laag met deze groepen:

- **Overzicht**
- **Commercieel**
- **Bouwen & koppelen**
- **Projectinformatie**
- **Samenwerken**

De inhoud is:

#### Overzicht

Projectcockpit met:

- projectfase/status;
- offerte- en akkoordstatus;
- budget en bestede uren;
- actieve bouwitems;
- koppelingen en integratiestatus;
- openstaande taken;
- team en toegang;
- documenten/notities;
- recente activiteit;
- eerstvolgende actie.

De cockpit toont alleen data die werkelijk in de Portal V2-state of runtime beschikbaar is. Geen voorbeeldcijfers of afgeleide claims zonder bron.

#### Commercieel

- Offerte
- Uren & facturen

#### Bouwen & koppelen

- Koppelingen
- Integraties
- Taken & werkstromen

`Koppelingen` betekent het projectwerk dat wordt ontworpen en gebouwd, bijvoorbeeld AFAS → Power BI, API-flow, mapping, softwarecomponenten, tests en deployment.

`Integraties` betekent de operationele externe verbindingen: accounts, API/OAuth, webhooks, configuratie en connectiestatus.

#### Projectinformatie

- Documenten
- Notities
- Activiteit

#### Samenwerken

- Team & toegang

## Desktopgedrag

Desktop toont beide niveaus tegelijk waar dat overzichtelijk is:

- algemene Portal V2-hoofdnavigatie;
- herkenbare sectie **Jouw project**;
- binnen die sectie de groepen Commercieel, Bouwen & koppelen, Projectinformatie en Samenwerken.

De bestaande pagina's blijven dezelfde routes en state gebruiken. Dit ontwerp introduceert geen tweede inhoudslaag of duplicaatpagina's; het hergroepeert bestaande Portal V2-capabilities en voegt alleen de projectcockpit toe waar nodig.

## Mobiel gedrag

Mobiel toont één permanente bottom navigation:

`Overzicht / Project / Data & AI / Taken / Meer`

Bij `Project` opent de projectcontext. Binnen die context is de tweede laag zichtbaar als compacte, horizontaal scrollbare projecttabs of sectiekeuze:

`Overzicht / Commercieel / Bouwen & koppelen / Projectinformatie / Samenwerken`

Daaronder worden de pagina's van de gekozen groep getoond.

De bestaande algemene hub/sheet blijft bruikbaar voor `Meer`, maar wordt niet meer gebruikt als parallel projectmenu. Daardoor is er nog maar één antwoord op de vraag: “waar vind ik mijn project?”

## Routing

De bestaande `navigationUrl()`- en routermechanismen blijven leidend. Geen nieuwe parallelle router.

Aanbevolen doelen:

- globale `Project`-nav → `hub:project`;
- projectgroep `Overzicht` → nieuwe project-overview page/hub state;
- bestaande pagina's blijven via hun bestaande page-id openen;
- queryparameters blijven canoniek `page=` en `hub=`.

De projecthub wordt geregistreerd naast de bestaande hubs en leest de bestaande page registry. Pagina-ID's worden niet hernoemd wanneer dat niet noodzakelijk is.

## Componentgrenzen

### `navigation-model.js`

Verantwoordelijk voor de globale navigatiecontracten. Mobile item `portal` wordt inhoudelijk `project` met target `hub:project`. Desktop mapping krijgt een expliciete projectbestemming zonder bestaande routes te dupliceren.

### `hubs.js`

Krijgt een nieuwe canonieke `project` hub met vaste groepen en page mappings. De hub is de bron voor zowel desktop- als mobiele projectgroepering.

### `app.js`

Blijft verantwoordelijk voor shellbinding en koppelt de bestaande controls aan het gewijzigde navigatiemodel. Geen hardcoded tweede projectstructuur in `app.js`; projectgroepen worden uit `hubs.js` gerenderd.

### `page-shell.js` / bestaande shell

Blijft verantwoordelijk voor het openen van native Portal V2-pagina's. Geen nieuwe shell.

### Nieuwe project-overview component

Een kleine, geïsoleerde module toont de projectcockpit op basis van bestaande domain state/runtime data. De component maakt geen eigen business truth en introduceert geen tweede datastore.

### Styling

`navigation.css` en waar nodig een kleine project-specifieke stylesheet verzorgen mobile tabs, projectgroepering en desktop-sectiepresentatie. Geen brede restyle van Portal V2.

## Datastromen

De projectcockpit leest uitsluitend bestaande Portal V2-state en runtime/projecties. Waar een bron niet beschikbaar is, wordt een lege of expliciet onbekende toestand getoond in plaats van een schatting.

Voorbeelden:

- offerte uit bestaande offerte-state;
- uren/facturen uit bestaande project/financial slice;
- koppelingen/integraties uit bestaande integration state/runtime;
- taken uit bestaande delivery/task state;
- documenten/notities/activiteit uit bestaande slices;
- team & toegang uit bestaande identity/access state.

Als een specifieke slice nog geen native V2-bron heeft, wordt de tegel wel als navigatie-ingang aangeboden maar toont de cockpit geen verzonnen status.

## Toegankelijkheid en UX

- mobiele touch targets minimaal 44×44 px;
- projecttabs zijn toetsenbordbedienbaar en hebben correcte `aria-current`/`aria-selected`-status;
- actieve globale en actieve projectcontext zijn beide visueel herkenbaar;
- het openen van een projectpagina behoudt de projectcontext bij terugnavigatie;
- geen horizontale overflow van de complete pagina; alleen de projecttabrij mag horizontaal scrollen;
- labels blijven Nederlands en taakgericht.

## Backwards compatibility

- bestaande page-id's blijven geldig;
- bestaande deep links naar `?page=...` blijven werken;
- bestaande `hub:portal`, `hub:data-ai`, `hub:tasks` en `hub:more` blijven werken zolang andere flows ze gebruiken;
- `Project` wordt een nieuwe canonieke gebruikersingang, geen destructieve migratie van bestaande routes;
- geen wijzigingen aan onderliggende businesslogica tenzij nodig om een bestaande status correct te tonen.

## Teststrategie

### Unit/contracttests

Bewaken dat:

- de mobiele globale navigatie exact de vijf afgesproken bestemmingen bevat;
- `Project` target `hub:project` gebruikt;
- de projecthub alle vijf groepen bevat;
- alle afgesproken projectpagina's precies één keer in de projecthub staan;
- bestaande deep links ongewijzigd blijven werken;
- er geen tweede hardcoded projectnavigatie naast de hubdefinitie ontstaat.

### DOM/browsertests

Op mobiel:

- slechts één permanente bottom navigation zichtbaar;
- `Project` opent de projectcontext;
- projecttabs zijn zichtbaar, scrollbaar en bedienbaar;
- wisselen tussen groepen werkt;
- een projectpagina opent en terugnavigatie behoudt projectcontext;
- geen dubbele mobiele navigatie voor hetzelfde doel.

Op desktop:

- Jouw project is herkenbaar gegroepeerd;
- de vier groepen en projectoverzicht zijn bereikbaar;
- bestaande globale Portal V2-navigatie blijft werken.

### Regressie

De volledige Portal V2-testset, deliverytests en productie-readback moeten groen zijn op exact dezelfde head-SHA voordat merge plaatsvindt. Na merge moet productie exact de merge-SHA serveren en moet mobiele en desktop readback bewijzen dat de nieuwe navigatie live is.

## Definition of Done

De wijziging is pas af wanneer:

1. `Jouw project` in V2 als één samenhangende werklaag bestaat;
2. desktop beide niveaus overzichtelijk toont;
3. mobiel één globale bottom navigation heeft en daaronder één contextuele projectlaag;
4. de afgesproken projectfuncties via die structuur bereikbaar zijn;
5. de projectcockpit uitsluitend echte state/runtime-data toont;
6. alle relevante tests groen zijn op exact dezelfde SHA;
7. de wijziging is gemerged;
8. productie de exacte merge-SHA serveert;
9. production DOM/browser readback op mobiel én desktop groen is.
