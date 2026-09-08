# AI Koppelingen Wizard — Design

## Doel
Maak koppelen in het klantportaal zo eenvoudig dat iemand zonder technische kennis een werkende koppeling kan maken, testen, activeren en begrijpen. De gebruiker beschrijft in gewone taal wat hij wil; AI vertaalt dit naar bron, verwerking, velden, bestemming, ritme, authenticatie en veilige tests. Geen koppeling wordt als werkend getoond zonder execution evidence.

## Productprincipe
De primaire ingang is één zin: **“Wat wil je automatisch laten gebeuren?”**

Voorbeeld: “Haal elke dag PDF-facturen uit Outlook, lees leverancier, datum, bedrag en btw en zet ze in Exact.”

AI zet dit om in een voorstel dat de gebruiker in gewone taal controleert:
- Waar komt het vandaan?
- Welke bestanden/data tellen mee?
- Welke informatie moet eruit?
- Waar moet het heen?
- Hoe vaak?
- Wat moet gebeuren bij twijfel of fouten?

Technische termen zoals API, OAuth, webhook, JSON, cron, mapping en token zijn standaard verborgen. Ze verschijnen alleen in Geavanceerd.

## UX: drie niveaus
### 1. Vertel wat je wilt
Standaardroute. Eén tekstveld, voorbeeldzinnen en AI-assistent. AI maakt een voorstel en stelt alleen vragen die echt nodig zijn.

### 2. Kies een voorbeeld
Templatebibliotheek met taakgerichte voorbeelden, niet techniekgerichte integraties. Bijvoorbeeld:
- Outlook PDF-facturen → Exact
- Outlook PDF-facturen → AFAS
- Outlook bijlagen → SharePoint
- Outlook aanvragen → Datahub
- SharePoint documenten → database
- SharePoint Excel/CSV → Datahub
- OneDrive bestanden → SharePoint
- AFAS → Datahub
- Exact → Datahub
- AFAS ↔ Exact met veldmapping
- SQL/Postgres/Supabase → Datahub
- API JSON → database
- Database → API
- Webformulier → Datahub/CRM
- CSV/Excel upload → database
- PDF upload → extractie → bestemming
- SharePoint-lijst → database
- Database → SharePoint-lijst
- E-mail → extractie → menselijke nakijkrij

### 3. Bouw zelf
Visuele bron → verwerking → bestemming bouwer. Geavanceerde opties zijn inklapbaar.

## Wizard
De wizard heeft zes vaste stappen en is op desktop én mobiel bruikbaar.

1. **Bron** — “Waar komt het vandaan?”
2. **Selectie** — “Wat wil je meenemen?”
3. **Informatie** — “Wat moet Bedrijfsgeheugen eruit halen of veranderen?”
4. **Bestemming** — “Waar moet het heen?”
5. **Ritme** — “Wanneer moet dit gebeuren?”
6. **Test & aanzetten** — echte veilige test, resultaat uitleggen, daarna pas activeren.

Elke stap toont:
- één hoofdvraag;
- één duidelijke standaardkeuze;
- voorbeelden in gewone taal;
- korte uitleg direct zichtbaar;
- `?`-uitleg voor extra context;
- AI-knop “Help mij kiezen”;
- mobiel geen informatie die alleen via hover beschikbaar is.

## AI-assistent
AI heeft vier rollen:

1. **Interpreteren** — vrije tekst omzetten naar connectorconfiguratie.
2. **Aanvullen** — ontbrekende keuzes voorstellen op basis van context en template.
3. **Controleren** — onlogische of riskante configuraties signaleren vóór activatie.
4. **Uitleggen** — technische fouten vertalen naar concrete menselijke acties.

AI mag nooit credentials verzinnen, geheime waarden tonen of een provider als ready markeren zonder server-side bewijs.

## Voorbeeldflow: Outlook PDF’s dagelijks
Gebruiker kiest of zegt: “Haal elke dag PDF-facturen uit Outlook.”

Wizard:
1. Microsoft-account verbinden.
2. Map kiezen, standaard Postvak IN.
3. Alleen PDF aanvinken.
4. Optioneel afzender/onderwerp filteren.
5. Template “Factuur” kiezen.
6. AI stelt velden voor: leverancier, factuurnummer, datum, bedrag, btw, vervaldatum.
7. Bestemming kiezen: Datahub, SharePoint, AFAS, Exact of database.
8. Ritme standaard dagelijks.
9. Test op één recente e-mail/document.
10. Toon bewijs als keten:
   `Outlook ✓ → PDF gevonden ✓ → extractie ✓ → validatie ✓ → bestemming ✓`.
11. Alleen bij volledig geldige test wordt “Aanzetten” actief.

## Statusmodel
Een koppeling heeft altijd een evidence-gedreven status:
- `available` — technisch ondersteund;
- `configured` — benodigde configuratie aanwezig;
- `ready` — veilige providercheck geslaagd;
- `healthy` — recente echte uitvoering succesvol;
- `degraded` — gedeeltelijk probleem, uitvoering kan nog plaatsvinden;
- `error` — uitvoering aantoonbaar gestopt;
- `not-configured` — externe configuratie ontbreekt.

Het portaal toont menselijke labels:
- Nog instellen
- Klaar om te testen
- Test geslaagd
- Actief en gezond
- Actie nodig
- Verbinding ontbreekt

Nooit “Actief” of “Gezond” zonder live execution evidence.

## Live flowkaart
Iedere actieve koppeling toont visueel:
`Bron → Selectie → Extractie/Transformatie → Validatie → Bestemming`

Per stap:
- laatste status;
- laatste tijdstip;
- aantal verwerkt;
- fout indien aanwezig;
- bewijsreferentie/execution-id;
- knop “Wat betekent dit?”;
- knop “Los met AI op” wanneer herstel veilig en toegestaan is.

## Authenticatie
Voorkeur:
1. OAuth/“Verbind met …”;
2. server-side beheerflow;
3. handmatige token alleen als provider dit vereist.

Secrets:
- nooit in browser/localStorage;
- nooit in portalprojectie;
- nooit in logs of Notion;
- alleen server-side encrypted/configured;
- readiness-endpoint toont alleen capability state.

## Documentextractor
De bestaande `sample-only` extractor wordt uitgebreid met een echte server-side extractor.

Gedrag:
- expliciete `extractedFields` blijft bestaan voor deterministische safe-tests;
- echte documenten gaan server-side naar extractorprovider;
- tekstlaag eerst, OCR alleen wanneer nodig;
- output bevat documenttype, confidence en velden met confidence;
- onder confidence-drempel naar nakijkrij;
- provider ontbreekt → fail-closed `DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED`;
- geen browser-side AI-providercredentials.

## Connectorarchitectuur
Er blijft één generieke connector-engine:

`Template/AI intent → Connector Definition → Source → Extraction/Transform → Validation → Lookup → Target → Execution → Review/Evidence`

De wizard creëert alleen een connector definition; hij bouwt geen tweede automation-engine.

Adapters kunnen later worden toegevoegd zonder de wizard te herschrijven:
- Microsoft 365 / Outlook
- SharePoint
- OneDrive
- AFAS
- Exact Online
- Datahub
- SQL/Postgres/Supabase
- generieke REST API
- CSV/Excel/PDF upload

## Powerhouse + Brein gesloten loop
Koppelingen zijn integraal onderdeel van dezelfde bedrijfsloop:

`vraag/signaal → AI-voorstel → keuze → configuratie → safe-test → readiness → activatie → uitvoering → evidence → health → foutdetectie → herstel → root cause → regression/prevention → learning → Brain writeback`

Powerhouse is de uitvoerende laag. Het Brein bewaakt uitkomsten en leert van fouten. Geen statusverandering telt als waarheid zonder technische readback.

Bij fout:
1. detecteer stap;
2. stop/contain alleen het risicovolle deel;
3. classificeer fout;
4. AI geeft eenvoudige uitleg;
5. automatische veilige recovery waar mogelijk;
6. opnieuw testen;
7. pas daarna status herstellen;
8. learning/regression vastleggen.

## Portaalintegratie
De bestaande `assets/js/portaal-koppelingen.js` blijft het ingangspunt voor het Koppelingen-paneel, maar wordt opgesplitst in kleinere modules zodat rendering, wizardlogica, templates en API-calls afzonderlijk testbaar zijn.

Voorgestelde eenheden:
- `assets/js/koppelingen/wizard.js` — wizardstate en navigatie;
- `assets/js/koppelingen/templates.js` — templatecatalogus;
- `assets/js/koppelingen/ai-guide.js` — AI intent/advies UI;
- `assets/js/koppelingen/status.js` — evidence/statuspresentatie;
- `assets/js/koppelingen/api.js` — portal API-client;
- `assets/js/portaal-koppelingen.js` — bootstrap/integratie met bestaand paneel.

Server-side:
- bestaande `/api/koppelingen` blijft tenant-scoped portalstate leveren;
- `/api/connectors/*` blijft connector definitions/tests/executions beheren;
- `/api/connectors/readiness` blijft capability-only;
- geen secrets via `/api/koppelingen`.

## Templatecontract
Elke template bevat minimaal:
- id;
- menselijke titel;
- resultaatzin (“Hiermee gebeurt…”);
- source type;
- filters/selectie;
- document/data type;
- voorgestelde velden;
- target type(s);
- standaardritme;
- benodigde verbindingen;
- teststrategie;
- veilige fallback;
- AI-vragen die alleen verschijnen als informatie ontbreekt.

Templates zijn startpunten; na opslaan ontstaat een gewone connector definition.

## Simpelheidsregels
1. Eén primaire actie per scherm.
2. Nooit meer dan één technische keuze tegelijk vragen.
3. Standaardwaarden waar verantwoord.
4. AI stelt voor; gebruiker bevestigt betekenis, niet techniek.
5. Geen lege foutcodes zonder uitleg.
6. Geen hover-only informatie.
7. Mobiel eerste klas.
8. Toon wat er gebeurt met data in gewone taal.
9. Laat vóór activatie zien wat gelezen, veranderd en geschreven wordt.
10. Eén echte test is verplicht vóór activeren.
11. Bij twijfel: niet activeren maar uitleggen wat ontbreekt.
12. Geavanceerde opties standaard verborgen.

## Veiligheid en privacy
- tenant isolation blijft verplicht;
- fail-closed voor ontbrekende adapters/config;
- providercredentials server-side;
- testdata minimaliseren;
- geen echte mutatie tijdens safe-test tenzij target expliciet een idempotente safe-test ondersteunt;
- auditbaar execution-id voor elke echte run;
- oorspronkelijke documenten behouden waar audit nodig is;
- menselijke review voor lage-confidence extractie.

## Eerste production slice
De eerste release moet volledig werkend zijn, niet alleen visueel:

1. AI-/templatewizard in Koppelingen-paneel.
2. Templatebibliotheek met circa 15 taakgerichte templates.
3. Werkende referentiekoppeling: Outlook/email-sample → PDF/document → server-side extractie → Datahub safe-test/target.
4. Echte readiness/evidence-status in portaal.
5. Fail-closed UI voor AFAS en Exact zolang externe config ontbreekt.
6. Mobiele regressietests.
7. Required test groen op exacte head SHA.
8. Merge → Netlify exact merge-SHA → live readback.
9. Learning/prevention terug naar Powerhouse/Brein zodra writebackroute uitvoerbaar is.

## Acceptatiecriteria
- Een niet-technische gebruiker kan vanuit één beschrijving of template een connector configureren zonder API-termen te hoeven begrijpen.
- Outlook-PDF referentieflow kan end-to-end veilig worden getest.
- AI legt elke noodzakelijke keuze en fout in gewone taal uit.
- Activatieknop is geblokkeerd totdat safe-test/readiness geldig is.
- Portaal toont live evidence in plaats van statische toggles.
- Geen secret staat in browserpayload/readiness/portalstate.
- Mobiel werkt elke primaire actie via tap en is alle essentiële uitleg zichtbaar.
- AFAS/Exact tonen correct `not-configured` zolang externe configuratie ontbreekt.
- Iedere fout produceert recovery + evidence + regression/learning-verplichting.
