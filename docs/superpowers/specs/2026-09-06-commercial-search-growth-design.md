# Commercial Search Growth + Revenue Loop — ontwerp

Datum: 2026-09-06

## Doel

Bedrijfsgeheugen moet niet alleen technisch SEO-correct zijn, maar systematisch organische bezoekers omzetten naar relevante vervolgstappen, leads, voorstellen, orders en omzet. Dit ontwerp bouwt voort op de bestaande SEO Order Engine en SEO-to-Order Intelligence Loop; er komt geen parallel SEO-systeem.

## Ontwerpprincipes

1. **Eén intentie, één primaire eigenaar.** Voor ieder belangrijk zoekcluster bestaat exact één canonical primary owner. Andere pagina's zijn supporting of krijgen een andere intentie. Dit voorkomt keyword cannibalization.
2. **SERP-type bepaalt paginatype.** Commercial/transactional intent krijgt een money page; informational intent krijgt een guide/article; mixed intent krijgt een pillar of sterke hybride pagina. We forceren geen salespagina tegen een informatieve SERP in.
3. **Bestaande sterke pagina's eerst.** Nieuwe pagina's worden alleen toegevoegd wanneer een unieke intentie niet geloofwaardig door een bestaande pagina kan worden owned. Geen thin/scaled SEO-content.
4. **Money Page Contract v2 blijft de commerciële minimumstandaard.** Probleem/antwoord, bewijs of controleerbare methode, werkwijze, deliverables, doelgroep, kostenlogica, risico/bezwaren, FAQ/inhoudelijke verdieping, één primaire CTA en contextuele interne links.
5. **E-E-A-T zonder verzonnen bewijs.** Auteur/reviewer, bronnen, methodologie, voorbeelden en first-hand expertise alleen waar aantoonbaar. Geen gefabriceerde cases, reviews of resultaten.
6. **Omzet boven rankings.** Evaluatiepad: impressions → clicks/CTR → engaged visit → CTA/microconversion → lead → qualified lead → afspraak → voorstel → won order → omzet.
7. **Powerhouse closed loop.** Growth events gebruiken het bestaande BG211-envelope; Brain mag alleen bounded aanbevelingen doen. Automatische aanpassingen mogen nooit claims, bewijs of klantresultaten verzinnen.
8. **Fail-open voor site, fail-closed voor Brain-writeback claims.** De site blijft werken wanneer Make/DataHub tijdelijk niet uitvoerbaar is. Geen claim van centrale learning zonder execution/readback evidence.

## Clusterregister

De bestaande `site/seo-order-map.json` blijft de canonical intent/owner registry. We breiden deze uit met bestaande publieke pagina's die nu al commerciële of sterke ondersteunende zoekintenties bedienen. Het register bevat alleen pagina's die daadwerkelijk bestaan en een onderscheidbare primaire intentie hebben.

Prioritaire commerciële owners omvatten minimaal:

- digitalisering mkb → `/`
- digitalisering mkb kosten → `/prijzen`
- kennis borgen → `/product`
- afas koppeling → `/afas-koppeling`
- exact online koppeling → `/exact-online-koppeling`
- bedrijfsprocessen automatiseren → `/bedrijfsprocessen-automatiseren`
- systemen koppelen → `/systemen-koppelen`
- api koppeling laten maken → `/api-koppeling-laten-maken`
- webshop koppeling → `/webshop-koppeling`
- twinfield koppeling → `/twinfield-koppeling`
- ai adoptie mkb → `/ai-adoptie`
- ai implementeren mkb → `/ai-implementeren`
- ai governance mkb → `/ai-governance`
- ai workshop mkb → `/workshops`
- due diligence digitalisering/kennis → `/due-diligence`
- bedrijfsgeheugen → `/bedrijfsgeheugen`

Ondersteunende informatieve owners, zoals AI Act, data-soevereiniteit, benchmarks en cijfers, mogen topical authority opbouwen maar krijgen geen tweede commerciële primary keyword.

## SERP-fit contract

Nieuw veld per registry-entry:

- `search_intent`: `commercial | informational | mixed | navigational`
- `target_page_type`: `money | guide | pillar | trust | tool`
- `business_goal`: `lead | assisted-conversion | trust | self-serve`
- `priority`: integer 1–5

Validatieregels:

- `commercial` vereist `target_page_type=money` of expliciet `mixed` wanneer een pillar bewezen de intentie draagt.
- `money`-role kan niet als informational worden gemarkeerd.
- één primary keyword/intent blijft uniek over de hele registry.
- alle CTA- en supporting URLs zijn absolute Bedrijfsgeheugen URLs.
- geen nieuwe primary owner zonder bestaande indexeerbare canonical pagina.

## Interne linkarchitectuur

Contextuele links krijgen beschrijvende anchors. Supporting pages en artikelen wijzen naar hun dominante money page; money pages linken naar relevante uitleg en een commerciële volgende stap. Navigation-only links tellen niet als voldoende topical ondersteuning.

## Conversie

Iedere money page heeft één primaire conversiedoelstelling. Waar mogelijk is de secundaire route laagdrempeliger (zelfscan/kennisartikel) maar nooit concurrerend met de primaire CTA. Growth measurement koppelt canonical route + intent + funnel stage + CTA/event aan de latere outcome.

## Brain / DataHub

Bestaand pad blijft leidend:

`website/blog → growth event → Netlify receiver → BG212 → BG211 → evidence/lineage → BG168/BG166 voor duurzame learning → bounded recommendation → governed website change → release/readback → outcome opnieuw meten`

Wanneer Make organization/team capacity niet uitvoerbaar is blijft `BG211_DELIVERY_ENABLED=false`; events mogen fail-open/queueën volgens de bestaande contracten. Activeren gebeurt pas na één bounded canary en readback.

## Niet doen

- geen 30 bijna-identieke landingspagina's genereren;
- geen keyword stuffing;
- geen pagina's alleen voor search engines;
- geen fictieve klantcases, testimonials, rankings of omzetclaims;
- geen automatische publicatie van Brain-aanbevelingen zonder tests/releasegates;
- geen tweede SEO/analytics eventbus naast de bestaande Powerhouse-contracten.

## Succescriteria

Technisch:
- registry valideert alle commerciële owners en SERP-fit;
- alle publieke indexeerbare pagina's blijven door estate-wide SEO Order gates gaan;
- toekomstige pagina's/blogs erven ownership/measurement/contracts;
- full build en exact-SHA production readback groen.

Commercieel:
- organisch verkeer en CTR per intentie zichtbaar;
- CTA/microconversions per landing page zichtbaar;
- qualified lead/order/revenue attribution kan op dezelfde attribution root aansluiten;
- Brain kan op echte outcomes prioriteren zodra runtime-writeback weer uitvoerbaar is.
