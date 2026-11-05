# AFAS money-page zoekintentieherstel — 5 november 2026

## Geobserveerd in echte bronnen
- Google Search Console domain `sc-domain:bedrijfsgeheugen.nl`, 1 oktober t/m 2 november 2026: 260 Google-impressies, 2 kliks. September 2026: 429 impressies, 11 kliks.
- `afas webshop koppeling`: 39 impressies, 0 kliks, gemiddelde positie 95,46; Google toonde de kostenblog `/blog/wat-kost-een-afas-koppeling/`.
- Eigen SEO-baseline `site/seo-baseline.json` kent `afas koppeling` toe aan `/afas-koppeling` en `afas koppeling kosten` aan het kostenartikel, maar de dienstpagina stond ten onrechte op `bg-zoekwoord=AFAS koppeling kosten`.
- Site crawled HTTP 200, HTTPS/canonical goed; GSC sitemap 271 ingediend, 0 sitemapfouten, wat niet hetzelfde is als 271 geïndexeerd.
- DataForSEO NL recente indicatie: `afas koppeling` 170 zoekopdrachten/maand, `afas oci koppeling` 30; geen gegarandeerde kliks of positieverbetering.

## Afgebakende verbetering in bestaande website-eigenaar
1. `/afas-koppeling` krijgt interne focus-identifier `afas koppeling` terug, zonder de cost-blogkeyword te kapen.
2. De bestaande landingspagina geeft een concreet, niet-gegarandeerd scenario voor AFAS webshopintegraties (Shopify, WooCommerce, Lightspeed alleen na API/veiligheidstoets), zonder nieuwe dunne keywordpagina.
3. Kostenartikel verwijst voor webshopimplementatie met een expliciete betekenisvolle link naar de bestaande canonieke dienstenroute.
4. `tests/seo-afas-search-intent-route-20261105.test.mjs` verifieert eigendom, canonical en contextual link.

## First-Time-Right en release
Vóór GitHub-PR admission machinevelden vastleggen: één `Obligation-ID`, `Delivery-Lane: website`, `Candidate-Type: implementation`, oorspronkelijke `Base-SHA`, `Change-Scope`, `Scope-Budget`. De originele PR #5447 faalde eerst op missende metadata, daarna op ontbrekende activity_ledger, brain_learning, human_documentation; de rode controles blijven historisch bewijs. Alle drie deze verplichte bewijsfamilies zitten nu in dezelfde PR, zonder workflow-uitzondering of false-green.

## Werkelijke acceptatie
Behoud bestaande SEO eigenaar, blogwriter, GitHub protectie, consent en canonical regels. Required, CodeQL, website-tests, protected merge, Netlify exacte commit readback en onafhankelijke publiek beschikbare pagina's. Pas dan LIVE_PROVEN; nu CANDIDATE. Meet na 28 en 56 dagen de query→pagina koppeling, gemiddelde positie (met impressiecontext), niet-branded impressies, organische kliks, CTA-kliks en gekwalificeerde leads. Schrijf alleen werkelijk providerbewijs naar bestaande ONE BRAIN/Heartbeat; lage volumes = INSUFFICIENT_EVIDENCE, geen gefingeerde conversie.

Bronnen: originele Search Console en Google Analytics 4 via verbonden read-only provider; PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5447.
