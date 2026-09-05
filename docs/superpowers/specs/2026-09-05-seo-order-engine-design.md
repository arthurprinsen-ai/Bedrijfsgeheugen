# SEO Order Engine Design

## Doel

Bedrijfsgeheugen.nl wordt technisch en inhoudelijk ingericht als één meetbare commerciële SEO-keten:

`zoekintentie -> dominante landingpage -> bewijs -> CTA -> lead -> afspraak -> order -> omzet`

SEO is geen garantie op positie 1. De architectuur maximaliseert wel crawlbaarheid, semantische duidelijkheid, topical authority, conversie en meetbaarheid, en voorkomt dat nieuwe content de bestaande structuur verwatert.

## Niet-onderhandelbare regels

1. Iedere commerciële zoekintentie heeft exact één primaire canonical landingpage.
2. Nieuwe blogs mogen nooit een bestaande money page kannibaliseren.
3. Alle intern gegenereerde HTML-links gebruiken volledige URLs onder `https://www.bedrijfsgeheugen.nl/...`.
4. Iedere indexeerbare pagina houdt exact één title, meta description, robots-tag, canonical en H1.
5. Iedere niet-homepage heeft een zichtbaar breadcrumb-pad en `BreadcrumbList` structured data.
6. Iedere blog heeft `Article`, `Person` en `Organization` structured data, een zichtbare auteur/reviewer, een datum, bronnen/bewijs, contextuele interne links en een relevante CTA.
7. Iedere money page heeft een expliciete zoekintentie, bewijs, commerciële volgende stap en meetbare conversie-acties.
8. Build/deploy faalt bij ontbrekende SEO-contracten, orphaned money pages, duplicate primary intent, root-relative gegenereerde links of interne links naar niet-canonical routes.
9. Structured data beschrijft alleen zichtbare en ware content; geen review-stars, FAQ-claims of organisatiegegevens verzinnen.
10. De bestaande canonical Brand Shell blijft de enige globale shell.

## Architectuur

### 1. SEO Intent Registry

Nieuwe bron van waarheid: `site/seo-order-map.json`.

Per primaire route bevat deze registry:
- `route`: volledige canonical URL;
- `role`: `pillar`, `money`, `support`, `blog-index` of `article`;
- `primary_intent`: één natuurlijke zoekintentie;
- `primary_keyword`: één hoofdzoekwoord;
- `secondary_keywords`: varianten en ondersteunende termen;
- `funnel_stage`: `discover`, `consider`, `decide`;
- `primary_cta`: conversiedoel met volledige URL;
- `supporting_routes`: relevante interne targets;
- `schema_type`: `WebPage`, `Service`, `CollectionPage` of `Article`.

De registry voorkomt keyword-cannibalization en maakt interne linking deterministisch.

### 2. Estate-wide SEO Enrichment

`tools/seo-order-engine/enrich.mjs` draait na alle historische contentbuilders en na de canonical shell normalisatie, maar vóór de finale SEO-gate en sitemap.

De enrichment is idempotent en mag geen inhoud herschrijven. Hij:
- voegt/actualiseert zichtbare auteur/reviewerblokken op artikelen;
- voegt canonical JSON-LD toe: `Organization`, `Person`, `BreadcrumbList` en page-type schema;
- markeert primaire CTA's met `data-bg-conversion`;
- voegt alleen wanneer nodig een compacte relevante CTA/related-links sectie toe;
- gebruikt uitsluitend volledige interne URLs;
- verwijdert geen handgeschreven bewijs of content.

### 3. Future Blog Contract

Iedere nieuwe `blog/<slug>/index.html` moet vóór publicatie voldoen aan:
- unieke self-canonical, behalve expliciet geregistreerde canonical aliases;
- unieke title en meta description;
- exact één H1;
- `meta name="robots" content="index, follow"`;
- zichtbaar breadcrumb-pad;
- zichtbare auteur/reviewer `Arthur Prinsen` en inhoudelijke updated/published datum;
- minstens één expliciete bewijs-/bronnen-sectie of bronverwijzing;
- minstens twee contextuele interne links naar relevante indexeerbare pagina's;
- minstens één directe link naar de dominante money/pillar page voor de intentie;
- één primaire CTA;
- `Article`, `Person`, `Organization`, `BreadcrumbList` structured data;
- geen `href="/..."` voor intern gegenereerde links.

Een nieuw blog dat dit contract niet haalt blokkeert de build.

### 4. Money Page Contract

Voor routes met `role=money` controleert de engine bovendien:
- primary intent en keyword zijn uniek in de registry;
- pagina bevat minimaal één zichtbaar bewijsblok of expliciete bron/case/resultaatsectie;
- pagina bevat een primaire CTA naar een geregistreerde conversieroute;
- minstens twee support/article routes linken naar de money page, tenzij expliciet als bootstrap-uitzondering geregistreerd;
- pagina heeft `Service` of passende `WebPage` structured data;
- CTA clicks zijn meetbaar.

### 5. Internal Link Graph

`tools/seo-order-engine/link-graph.mjs` bouwt tijdens de build een graaf van alle indexeerbare canonicals en zichtbare anchors.

De gate faalt op:
- orphaned money pages;
- links naar duplicate/canonical alias URLs als de canonical landingpage bekend is;
- root-relative interne anchors in gegenereerde output;
- commerciële artikelen zonder link naar hun dominante money page;
- duplicate `primary_intent` of `primary_keyword` in de registry.

De engine voegt alleen links toe waar de registry een expliciete relatie definieert; er wordt geen keyword-stuffing of willekeurige auto-linking toegepast.

### 6. Structured Data Layer

Eén centrale renderer genereert JSON-LD met vaste `@id`s:
- Organization: `https://www.bedrijfsgeheugen.nl/#organization`;
- Person: `https://www.bedrijfsgeheugen.nl/over-ons#arthur-prinsen`;
- WebSite: `https://www.bedrijfsgeheugen.nl/#website`;
- page entity: `<canonical>#webpage`;
- breadcrumb: `<canonical>#breadcrumb`;
- article/service waar van toepassing.

JSON-LD wordt uit bestaande zichtbare metadata en registry-data opgebouwd; nooit uit onbewezen ratings, aantallen of awards.

### 7. Conversion Attribution

`tools/seo-order-engine/conversion.mjs` injecteert één kleine, idempotente browsermodule die voor elementen met `data-bg-conversion` een `dataLayer.push` verstuurt met:
- `event: 'bg_conversion_intent'`;
- `conversion_action`;
- `landing_path`;
- `target_url`;
- `page_role`;
- `funnel_stage`.

Dit maakt organic landingpage -> CTA/lead attributie mogelijk zonder bestaande formulieren of analytics-consent te omzeilen. De module verzendt zelf geen persoonsgegevens.

### 8. Gates en CI

De bestaande `controleer-technische-seo.mjs` blijft de low-level technische gate.

Nieuwe high-level gate: `tools/seo-order-engine/validate.mjs`.

Deze controleert:
- registry-integriteit;
- future-blog contract;
- money-page contract;
- structured data aanwezigheid en geldige IDs;
- internal-link graph;
- conversion markers;
- geen duplicate intents/keywords;
- geen orphaned money pages.

Een dedicated GitHub workflow draait unittests plus de volledige Netlify-equivalente build. Netlify gebruikt dezelfde finale gate zodat preview en productie geen afwijkend contract hebben.

## Eerste commerciële clusters

De eerste registry bevat uitsluitend bestaande, bewezen routes en wordt daarna uitgebreid via dezelfde contracten:

- `https://www.bedrijfsgeheugen.nl/` -> digitalisering mkb / pillar;
- `https://www.bedrijfsgeheugen.nl/prijzen` -> kosten/prijzen digitalisering mkb / money;
- `https://www.bedrijfsgeheugen.nl/product` -> bedrijfsgeheugen platform / money;
- `https://www.bedrijfsgeheugen.nl/afas-koppeling` -> AFAS koppeling / money;
- `https://www.bedrijfsgeheugen.nl/ai-adoptie` -> AI adoptie mkb / support-money;
- `https://www.bedrijfsgeheugen.nl/ai-act` -> EU AI Act mkb / support;
- `https://www.bedrijfsgeheugen.nl/bedrijfsgeheugen` -> bedrijfskennis borgen / money;
- `https://www.bedrijfsgeheugen.nl/blog/` -> kennisbank / blog-index.

Nieuwe commerciële landingspagina's worden pas toegevoegd na SERP/intentieonderzoek; de engine creëert niet automatisch dunne SEO-pagina's.

## Conversie-ontwerp

Een money page stuurt één primaire actie. De default prioriteit is:

1. gratis zelfscan voor vroege/middenfunnel;
2. Frisse Blik Scan voor hoge intentie;
3. contact/afspraak waar de pagina direct koopintentie heeft.

De engine borgt de aanwezigheid en meetbaarheid van de CTA, maar herschrijft geen page-specific salescopy zonder expliciet contentontwerp.

## Succescriteria

Release is technisch geslaagd wanneer:
- de volledige huidige indexeerbare estate door beide SEO-gates komt;
- alle nieuwe blogfixtures aantoonbaar RED zijn vóór enrichment/metadata en GREEN erna;
- iedere geregistreerde money page intern bereikbaar is en ondersteunende links heeft;
- structured data op alle relevante pagina's aanwezig en consistent is;
- sitemap exact de finale canonicals bevat;
- Netlify preview en productie dezelfde gates draaien.

Businesssucces wordt daarna gemeten op organic impressions, CTR, CTA clicks, scan starts/completions, leads, afspraken, voorstellen, orders en omzet per organic landingpage. Ranking is een middel, niet het eind-KPI.