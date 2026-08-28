# Deterministic SEO Publish Bridge — ontwerp

Datum: 28 augustus 2026  
Status: ter schriftelijke bevestiging vóór implementatie  
Eigenaar: Bedrijfsgeheugen / Post Guardian

## 1. Aanleiding

Het goedgekeurde kalenderartikel `BG-428` — *Kennis borgen in je bedrijf: zo voorkom je stilstand* — is op 28 augustus 2026 om 08:57 Europe/Amsterdam aangemaakt. BG22 had zijn dagelijkse publicatiemoment om 06:45 al gehad. Daarnaast leest `weekblog.yml` niet uit de centrale mediakalender, maar uit de aparte SEO-blogqueue. Daardoor kon een inhoudelijk gereed artikel niet deterministisch dezelfde dag worden gepubliceerd.

De keten bevat bovendien een beveiligingsprobleem: BG22 bewaart een GitHub-token rechtstreeks in een HTTP-module. De waarde van dit geheim mag nergens in documentatie, logging of agentuitvoer voorkomen en moet na migratie worden ingetrokken.

## 2. Bewezen huidige situatie

- Centrale mediakalender: `collection://626e4c3c-cfee-4390-b519-6a910538607d`.
- SEO-blogqueue: `collection://70706495-cc0c-44ed-84bc-493df00651f1`.
- Artikel BG-428: `3cada36a-ac8a-81c5-b835-f0daca06c2a3`.
- BG22: scenario `6829648`, actief, geplande dispatch naar `.github/workflows/weekblog.yml`.
- BG91: scenario `7037093`; dit is een opportunity-naar-keywordbridge en geen kalender-naar-publicatiebridge.
- De SEO-blogqueue bevatte tijdens de controle nul records met `Status = Gepland`.
- `weekblog.yml` ondersteunt reeds `workflow_dispatch.inputs.slug`, maar BG22 stuurt alleen `{"ref":"main"}` en geeft geen slug mee.
- `weekblog.yml` laat in de bestaande route een model een nieuw artikel schrijven. Dat is niet hetzelfde als het ongewijzigd publiceren van de goedgekeurde `Blogtekst` uit de centrale kalender.

## 3. Doel

Een goedgekeurd artikel uit de centrale mediakalender wordt uiterlijk bij de eerstvolgende bridgecyclus precies één keer als exact dat artikel aangeboden aan de websitepublicatie. Elke overgang is herhaalbaar, controleerbaar en fail-closed. Een agent mag veilige herstelacties uitvoeren, maar nooit goedkeuring, inhoud, beveiliging of deduplicatie omzeilen.

## 4. Niet-doelen

- Geen automatische inhoudelijke herschrijving na `Herzien = Goedgekeurd`.
- Geen publicatie bij ontbrekende of tegenstrijdige velden.
- Geen verwijdering van kalender-, queue- of GitHub-records.
- Geen geheimen in scenario-blueprints, Notion, logs of prompts.
- Geen brede retry die een ander artikel kan selecteren.
- Geen garantie dat software nooit wordt aangevallen of faalt; wel aantoonbare preventie, detectie, blokkade, herstel en escalatie.

## 5. Canonieke bron en eigenaarschap

De centrale mediakalender is de inhoudelijke bron. De SEO-blogqueue wordt een uitvoeringsopdracht en bevat geen tweede zelfstandig te redigeren kopie.

| Gegeven | Canonieke eigenaar |
| --- | --- |
| Titel, goedgekeurde blogtekst, CTA, campagne, datum | Centrale mediakalender |
| Content ID | Centrale mediakalender; onveranderlijke idempotentiesleutel |
| Vaste slug, SEO-focus en meta-omschrijving | Centrale mediakalender; vóór publicatie goedgekeurd |
| Dispatchstatus, poging, GitHub-run en bewijs | SEO-blogqueue |
| Gepubliceerde HTML en canonical URL | GitHub-repository / website |
| Incidenten, herstel en leerregels | Powerhouse Agent Activity Log |

## 6. Benodigde velden

### Centrale mediakalender

Toevoegen:

- `SEO Slug` — tekst; onveranderlijk vanaf eerste queue-opdracht.
- `SEO focuszoekwoord` — tekst.
- `SEO metaomschrijving` — tekst; 140–155 tekens.
- `SEO Queue URL` — URL naar het gekoppelde queue-record.
- `Publish Command ID` — tekst: `seo-publish|<Content ID>|<slug>`.
- `Publish Attempt` — getal.
- `Publish Verified At` — datum/tijd.

### SEO-blogqueue

Toevoegen:

- `Bron Content ID` — tekst; uniek logisch sleutelveld.
- `Bronpagina` — URL naar de centrale kalenderpagina.
- `Publish Command ID` — tekst; gelijk aan de centrale kalender.
- `Source Mode` — select: `Approved central article` of `Legacy generated article`.
- `Dispatch status` — select: `Pending`, `Claimed`, `Dispatched`, `Published`, `Failed`, `Blocked`.
- `Dispatch attempt` — getal.
- `GitHub Run ID` — tekst.
- `Dispatched At` — datum/tijd.
- `Verified At` — datum/tijd.
- `Failure fingerprint` — tekst.

Er wordt geen uniekheidsconstraint verondersteld in Notion. Uniciteit wordt daarom vóór elke create én vóór elke dispatch afgedwongen door zoekopdrachten op `Bron Content ID`, `Publish Command ID` en `Slug`.

## 7. Toelatingspoort

Een centraal artikel is alleen kandidaat wanneer alle voorwaarden tegelijk waar zijn:

1. `Contenttype = Artikel`.
2. `Herzien = Goedgekeurd`.
3. `Publicatiecheck = Gereed`.
4. `Make status = Publiceren`.
5. `Genereren = nee`.
6. `Testmodus = nee`.
7. `Publicatiedatum <= vandaag` in Europe/Amsterdam.
8. `Publicatielink` is leeg.
9. `Content ID`, `Titel`, `Blogtekst`, `SEO Slug`, `SEO focuszoekwoord` en `SEO metaomschrijving` zijn gevuld.
10. Rode-draadcheck is `Klopt`.

Bij nul kandidaten eindigt de run zonder writes. Bij meer dan één kandidaat verwerkt de bridge maximaal één record per cyclus, oudste publicatiedatum eerst. Conflicten op Content ID of slug leiden tot `Blocked`, niet tot een gok.

## 8. Bridgeproces

Voorgestelde scenario-identiteit: `BG160 — Central Article to Deterministic SEO Publish Queue`.

Triggers:

- On-demand interface met verplicht `content_id`, voor Post Guardian en gecontroleerd herstel.
- Lage-kosten planning om 09:15, 12:15, 16:15 en 20:15 Europe/Amsterdam als vangnet.

Stappen:

1. Zoek één toegelaten centraal artikel; bij on-demand exact op `Content ID`.
2. Normaliseer en valideer de reeds opgeslagen slug; genereer hem niet tijdens dispatch.
3. Zoek queue-records op `Bron Content ID`, `Publish Command ID` en `Slug`.
4. Nul matches: maak één queue-opdracht met `Source Mode = Approved central article` en `Dispatch status = Pending`.
5. Eén identieke match: hervat alleen de aantoonbaar veilige volgende toestand.
6. Meerdere of conflicterende matches: blokkeer, log en publiceer niets.
7. Claim atomair door de status op `Claimed` te zetten en poging plus tijd vast te leggen.
8. Dispatch `weekblog.yml` met exact `inputs.slug` via een beheerde GitHub-verbinding.
9. Schrijf het ontvangen GitHub-run-ID terug zodra beschikbaar.
10. Laat de verificatieloop het resultaat bewijzen; markeer nooit alleen op basis van een succesvolle dispatch.

## 9. GitHub-workflow

`weekblog.yml` krijgt twee expliciete modi:

### Approved central article

- Selecteer uitsluitend de queue-opdracht met de geforceerde slug.
- Controleer `Status = Gepland`, `Autopublish toegestaan = ja`, `Quality gate = Geslaagd`, `Herzien = Goedgekeurd`, `Source Mode = Approved central article` en een geldige bronpagina.
- Lees de centrale pagina via de bronpagina-ID.
- Gebruik `Titel`, `Blogtekst`, SEO-meta en CTA uit de goedgekeurde bron.
- Render de goedgekeurde tekst deterministisch naar de bestaande HTML-template.
- Een model mag geen alinea's herschrijven, feiten toevoegen of CTA/prijzen veranderen.
- Technische markup, escaping, structured data en interne links worden door testbare scripts aangebracht.

### Legacy generated article

- De bestaande generatiefunctionaliteit blijft alleen beschikbaar voor expliciete legacy-queue-items.
- Legacy-items mogen nooit een gekoppelde centrale bronpagina overschrijven.

De workflow weigert een lege of onbekende slug. Bestaat `blog/<slug>/` al, dan wordt geen nieuwe commit gemaakt en gaat de flow naar verificatie van de bestaande publicatie.

## 10. Authenticatie en gegevensbeveiliging

- Het in BG22 ingebedde GitHub-token wordt uit de blueprint verwijderd.
- Dispatch verloopt via een beheerde GitHub OAuth-verbinding met minimale rechten voor uitsluitend workflow-dispatch van `arthurprinsen-ai/Bedrijfsgeheugen`.
- Na bewezen migratie trekt de eigenaar het oude token in bij GitHub.
- Geen connector, prompt, foutlog of Notion-record mag tokens of Authorization-headers opslaan.
- Agents redigeren secrets uit toolresultaten en incidentdetails.
- Notion-integraties krijgen alleen toegang tot de centrale kalender, SEO-queue en Activity Log die zij nodig hebben.
- Publicatie blijft geserialiseerd via GitHub concurrencygroep `repo-schrijven`; force-push blijft verboden.

## 11. Verificatieloop

Publicatie is pas bewezen wanneer alle controles slagen:

1. GitHub-workflow eindigt succesvol en levert een run-ID.
2. De commit bevat uitsluitend de verwachte blogslug plus noodzakelijke index, RSS, sitemap en toegestane clusterlinkwijzigingen.
3. `https://www.bedrijfsgeheugen.nl/blog/<slug>/` retourneert HTTP 200.
4. Canonical is exact dezelfde schone URL.
5. Er is precies één H1 en geldige JSON-LD.
6. De zichtbare hoofdtekst komt inhoudelijk overeen met de goedgekeurde `Blogtekst`.
7. De queue wordt `Published`; centrale `Publicatielink`, `Make status = Gepubliceerd` en `Publish Verified At` worden bijgewerkt.
8. Post Guardian schrijft een `post_published`-activiteit met Content ID, slug, URL, workflow-run, commit en bewijsdatum.

Een succesvolle HTTP-dispatch zonder deze controles is `Dispatched`, nooit `Published`.

## 12. Agentgedrag en automatisch herstel

Post Guardian controleert minimaal:

- due + approved + geen queue-opdracht;
- dubbele Content ID, command-ID of slug;
- opdracht ouder dan de afgesproken tijd in `Pending`, `Claimed` of `Dispatched`;
- ontbrekende GitHub-run of mislukte workflow;
- publieke URL ontbreekt of canonical wijkt af;
- Notion zegt gepubliceerd terwijl publiek bewijs ontbreekt;
- geheim of Authorization-header aangetroffen in een blueprint of log.

Veilige autonome acties:

- ontbrekende identieke queue-opdracht aanmaken;
- een niet-uitgevoerde exacte slug eenmaal dispatchen;
- status herstellen op basis van aantoonbaar publiek bewijs;
- een transient GitHub/Notion-fout maximaal twee keer opnieuw proberen met begrensde back-off;
- incident, oorzaak, bewijs en preventieregel vastleggen.

Altijd blokkeren en menselijke actie vragen bij:

- conflicterende slug of meerdere bronrecords;
- inhoudelijke wijziging na goedkeuring;
- ontbrekende toestemming of verbroken OAuth-verbinding;
- rotatie of intrekking van credentials;
- verwijdering, force-push, rechtenverruiming of publicatie zonder goedkeuring.

## 13. Kostenregels

- Geen continue polling; vier vangnetruns per dag plus eventgestuurd/on-demand herstel.
- Zoekopdrachten gebruiken `limit = 1` en server-side filters.
- Nul kandidaten betekent maximaal één leesbewerking en geen modelaanroep.
- Goedgekeurde artikelen worden niet opnieuw door een taalmodel geschreven.
- Dedupe gebeurt vóór create en vóór dispatch.
- Elke retry verhoogt `Dispatch attempt`; maximaal twee automatische retries per foutfingerprint.

## 14. Tests vóór productie

### Contracttests

- Goedgekeurd compleet artikel levert één command-ID en één queue-record.
- Dezelfde input tweemaal levert nog steeds één queue-record.
- Zelfde Content ID met andere slug wordt geblokkeerd.
- Zelfde slug met andere Content ID wordt geblokkeerd.
- Ontbrekende SEO-meta, tekst, goedkeuring of datum blokkeert.
- `Testmodus = ja` blokkeert.
- Gepubliceerde URL blokkeert een nieuwe dispatch.

### Workflowtests

- Geforceerde onbekende slug faalt zonder ander artikel te kiezen.
- Approved-mode gebruikt de centrale tekst en niet de generatieve prompt.
- Bestaande slug maakt geen tweede commit.
- Mislukte dispatch zet niets op `Published`.
- HTTP 200 met verkeerde canonical blijft geblokkeerd.
- Transient fout wordt begrensd opnieuw geprobeerd; permanente fout niet.

### Beveiligingstests

- Geen token of Authorization-header in de uiteindelijke Make-blueprints.
- De beheerde GitHub-verbinding heeft geen bredere rechten dan nodig.
- Incidentlogs bevatten alleen geredigeerde credentialverwijzingen.

### Canary

1. Gebruik eerst een testrecord met `Testmodus = ja` en bevestig dat publicatie wordt geblokkeerd.
2. Gebruik daarna één goedgekeurde canary op een niet-bestaande testslug in een niet-productieve branch.
3. Controleer diff, HTML, canonical, dedupe en writeback.
4. Publiceer pas daarna BG-428 met de definitieve slug.

## 15. Rollback

- De nieuwe bridge start inactief.
- GitHub-wijzigingen gaan via een aparte branch en pull request.
- Bij falende canary: bridge uit, PR niet mergen of commit terugdraaien, queue-opdracht op `Blocked`, centrale bron ongewijzigd.
- BG22 blijft actief tot de beheerde dispatch en nieuwe workflow zijn bewezen; daarna wordt hij vervangen of teruggebracht tot een expliciete legacyroute.
- Het oude token wordt pas ingetrokken nadat de vervangende verbinding werkt, maar onmiddellijk daarna.

## 16. Acceptatiecriteria

De wijziging is pas gereed wanneer:

- alle contract-, workflow- en beveiligingstests slagen;
- twee opeenvolgende identieke bridge-aanroepen geen duplicaat veroorzaken;
- de canary exact één verwachte commit en één publieke URL oplevert;
- BG-428 exact eenmaal via zijn vaste slug is gepubliceerd en publiek geverifieerd;
- centrale kalender, queue en Activity Log hetzelfde Content ID, slug, URL en bewijs tonen;
- BG22 geen ingebed geheim meer bevat;
- architectuur, rollback, kostenmeting, incident en les in het Bedrijfsgeheugen zijn vastgelegd.

## 17. Bronnen

- Centrale artikelpagina: https://app.notion.com/p/3cada36aac8a81c5b835f0daca06c2a3?pvs=204
- Vastgelegd incident: https://app.notion.com/p/3cada36aac8a8112b462e9396baa20f2?pvs=204
- SEO-blogkalender: https://app.notion.com/p/030cb778efbe4fcab9cdc9aa104ab0de?pvs=204
- Workflow: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/.github/workflows/weekblog.yml
- Engineering Registry: https://app.notion.com/p/3cada36aac8a81199e6cfa9217bf5218?pvs=204
- Zero-Trust-architectuur: https://app.notion.com/p/3cada36aac8a81c38558e4bc8bef0a1b?pvs=204
