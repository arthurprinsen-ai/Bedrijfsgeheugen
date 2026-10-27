# NL/EN SEO revenue architecture — 30 september 2026

## Doel
SEO is geen verkeersproject maar een omzetketen:

`query → canonical intent owner → interne link → CTA → lead → voorstel → betaalde order → gerealiseerde omzet → learning`.

## Gebouwd
- één canonieke NL/EN keyword ownership map: `site/seo-locale-revenue-map.json`;
- Engelse keywords worden gekozen op Engels zoekgedrag en SERP-intentie, niet letterlijk vertaald uit het Nederlands;
- actuele DataForSEO-evidence vastgelegd voor Nederland, UK en US;
- Engelse titles, descriptions en voor prioriteitspagina's H1's worden tijdens de static-locale build toegepast;
- self-canonical locale routes + `hreflang=nl/en/x-default` blijven leidend;
- absolute same-origin links worden nu ook naar de actieve locale herschreven;
- sitemap wordt na locale-output gebouwd en neemt `/en/*` canonicals plus hreflang alternates op;
- SEO Order Engine draait voortaan in de Netlify production build vóór locale-output;
- Modelwijzer bezit de modelvergelijking/-selectie-intent;
- `/data-soevereiniteit` bezit de aparte data-soevereiniteit/sovereign-AI-intent en routeert commercieel naar AI governance;
- AI Modelwijzer, governance, implementatie, business case, adoptie en data-soevereiniteit zijn contextueel met elkaar verbonden;
- release gates blokkeren keyword collisions, orphan revenue pages, locale-linklekkage en incomplete locale ownership.

## Gemeten vraag
DataForSEO 30-09-2026:
- NL: `ai governance` 390/mnd, CPC 15,86; `data soevereiniteit` 260/mnd, CPC 6,33; `bedrijfsprocessen automatiseren` 480/mnd, CPC 14,53.
- EN/UK: `ai model comparison` 390/mnd; `ai governance` 1.300/mnd; `sovereign ai` 2.400/mnd.
- EN/US: `ai model comparison` 1.300/mnd; `ai governance` 5.400/mnd. `sovereign ai` heeft sterk volume maar een volatiele reeks en mag daarom alleen met SERP-intentbewijs worden opgeschaald.

## Omzetregel
Ranking, impressies, clicks en engagement blijven tussenmetrics. Optimalisatie wint alleen wanneer downstream signalen verbeteren richting gekwalificeerde leads, voorstellen, betaalde orders en gerealiseerde omzet.
