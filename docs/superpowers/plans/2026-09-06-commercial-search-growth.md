# Commercial Search Growth — Implementation Plan

**Goal:** vergroot organische zoekdekking en conversiekracht zonder cannibalization, terwijl iedere toekomstige pagina/blog dezelfde intent-, CRO-, evidence- en Powerhouse-contracten erft.

## Taak 1 — RED: SERP-fit en commerciële coverage contract

Maak `tests/seo-commercial-coverage.test.mjs` dat faalt op de huidige registry omdat:
- `search_intent`, `target_page_type`, `business_goal`, `priority` nog niet verplicht zijn;
- bestaande high-intent pagina's `/exact-online-koppeling`, `/bedrijfsprocessen-automatiseren`, `/systemen-koppelen`, `/api-koppeling-laten-maken`, `/webshop-koppeling`, `/twinfield-koppeling`, `/ai-implementeren`, `/ai-governance`, `/workshops`, `/due-diligence` nog geen expliciete primary owner in de registry hebben;
- commerciële entries een passend money-page contract moeten krijgen.

Verifieer RED via GitHub Actions.

## Taak 2 — GREEN: registry/schema uitbreiden

Wijzig `tools/seo-order-engine/registry.mjs`:
- valideer nieuwe velden en toegestane waarden;
- commercial intent mag alleen bij passende money/mixed target horen;
- money-role mag niet informational zijn;
- priority moet 1–5 zijn;
- behoud unieke primary keyword/intent en absolute URL-contracten.

Breid `site/seo-order-map.json` uit met bestaande bewezen pagina's en unieke intenties. Gebruik bestaande pagina's voor clusters waar ze al sterk genoeg voor zijn; maak geen duplicates voor homepage/product.

## Taak 3 — Contextuele linkgraph + future contract

Borg dat supporting routes/blogs naar hun dominante owner wijzen en dat nieuwe geregistreerde money pages minimaal de bestaande Money Page v2 eisen krijgen. Voeg tests toe voor descriptive/contextual owner links zonder root-relative URLs.

## Taak 4 — Conversie-attributie per commerciële owner

Breid measurement markers uit met `search_intent`, `business_goal`, `priority` en canonical owner. Zorg dat CTA/microconversion events deze velden meenemen zonder PII.

## Taak 5 — Powerhouse/BRAIN borging

Breid producer/delivery contracttests uit zodat wijzigingen aan cluster registry, SERP-fit en revenue measurement onder de website/growth/BG211-delivery lane vallen. Geen nieuwe eventbus.

## Taak 6 — Homepage pricing-tool regressie

Voeg een gerichte regressietest toe die op alle niet-`/prijzen` pagina's de pricing-only tools blokkeert en `/prijzen` expliciet toestaat. Herstel de generator/remover indien de test rood is.

## Taak 7 — Full build + preview

Draai de Netlify-equivalente build en alle SEO-order/growth/BRAIN tests. Open draft PR vroeg, self-heal failures, daarna ready for review.

## Taak 8 — Merge + exact-SHA production readback

Merge alleen groen. Wacht op de exacte Netlify production commit en bewijs live:
- cluster ownership;
- Money Page v2 op representatieve commerciële owners;
- geen pricing-only tools buiten `/prijzen`;
- growth measurement/receiver aanwezig;
- canonical shell + SEO-order live-readback groen.

## Taak 9 — Brain runtime boundary

Zolang Make organization/team runtime `status=paused` blijft: `BG211_DELIVERY_ENABLED=false`, geen herhaalde betaalde canaries. Zodra runtime authority aantoonbaar terug is: exact één deduplicated canary BG212→BG211, persistence/idempotency/readback bewijzen, daarna delivery pas aanzetten.
