# V18 Test Tagged Component Development Design

## Doel

De door de gebruiker geaccepteerde V18-testsite blijft de vaste visuele en functionele basis terwijl pagina's en componenten onafhankelijk, sneller en parallel kunnen worden ontwikkeld zonder stille regressies of terugval naar productie.

## Vaste bron van waarheid

De geaccepteerde V18-baseline is vastgepind op:
- source commit: `195d30e411a327553f81be40815d4c0d8da4e98d`
- source deploy: `6a918685f3737c0008ee981a`
- source page: `/prototype-v18-stable.html`

Geen mutable `deploy-preview-*` alias, productie-URL of latere preview mag deze bron stil vervangen.

## Vaste V18 → test samenvoegregel

1. Heeft een link in V18 al een echte V18-testpagina, dan is die V18-pagina leidend en wordt die behouden/gereconstrueerd.
2. Staat een link in V18 maar bestaat daarvoor geen V18-pagina, dan wordt de pagina volledig nieuw geschreven in dezelfde V18-stijl en informatiearchitectuur.
3. Bestaat die pagina wel op productie en is er geen vervangende V18-testpagina, dan blijft de productiepagina behouden; hij mag niet verdwijnen of door een lege placeholder worden vervangen.
4. Dit geldt sitebreed, waaronder Blog & kennisbank, Onderzoeken, Benchmark, Templates & tools, Security, AI Act, Privacy, Juridisch, Helpcentrum, Changelog, Contact, Inloggen, Over ons, Werkwijze, Partners en Cases.
5. Iedere zichtbare interne link en CTA moet automatisch worden gecontroleerd op een echte route; geen 404, geen dode CTA en geen verdwenen productiepagina.

## Tagmodel

Iedere beheerde route/component krijgt machine-readable tags in `site/v18-component-registry.json`.

### Source-tag

Exact één van:
- `source:v18-leading` — bestaande geaccepteerde V18-pagina is leidend.
- `source:production-preserved` — productiepagina blijft leidend omdat V18 geen vervangende pagina bevat.
- `source:new-v18-authored` — nieuwe pagina geschreven om een V18-linkgat te vullen.

### Area-tag

Eén of meer duidelijke domeinen, bijvoorbeeld:
- `area:navigation`
- `area:company`
- `area:knowledge`
- `area:trust`
- `area:support`
- `area:pricing`
- `area:cases`
- `area:platform`
- `area:integrations`
- `area:audience`
- `area:scans`

### Component-tag

Voor onafhankelijk ontwikkelbare componenten, onder andere:
- `component:header`
- `component:desktop-menu`
- `component:mobile-menu`
- `component:hero`
- `component:hero-video`
- `component:footer`
- `component:page-content`
- `component:cta`
- `component:blog`

### Status-tag

Exact één van:
- `status:accepted`
- `status:test-only`
- `status:needs-review`
- `status:production-approved`

### Baseline-tag

Alle V18-testonderdelen dragen `baseline:v18-accepted` zolang zij aan de vaste baselinecontracten voldoen.

## Scope-isolatie en parallel ontwikkelen

Een wijziging declareert expliciet zijn owned scopes. Voorbeeld: een mobiele-menutak bezit `component:mobile-menu` en `area:navigation`, maar niet `component:hero` of `area:pricing`.

Parallelle wijzigingen zijn toegestaan wanneer hun owned file/route/component scopes niet overlappen. Bij overlap wordt samenvoegen geblokkeerd tot beide wijzigingen opnieuw tegen de actuele V18-testbaseline zijn gerebased/getest. Geen force-push, geen blind overschrijven van concurrent werk.

## Testsite-invariant

Deploy previews voor deze reconstructielijn gebruiken uitsluitend de dedicated V18-testcomposer. De productiecomposer mag de preview-root niet overschrijven. Productie blijft de normale productiecomposer gebruiken.

Een preview is pas geldig wanneer alle volgende feiten tegelijk bewezen zijn:
- exact PR-head SHA gebouwd;
- Netlify deploy `ready` voor exact die SHA;
- root bevat de geaccepteerde V18-identiteitsmarkers;
- de vastgepinde V18-bron is publiek bereikbaar;
- route/CTA-controle is groen;
- productie-only behouden routes bestaan nog;
- geen 404 op zichtbare interne links.

## Faalgedrag en self-heal

Bij drift of regressie: detecteren → root cause → regressietest → minimale fix → opnieuw testen → exact deploy verifiëren → incident loggen → preventie automatiseren. Maximaal twee identieke retries; daarna nieuwe hypothese.

Een groene Netlify-status alleen is nooit voldoende bewijs van een correcte V18-testsite.

## Productiegrens

Deze ontwikkeling blijft test-only. Geen merge naar productie zonder expliciete visuele/business-goedkeuring, met name voor pricing/contentwijzigingen.
