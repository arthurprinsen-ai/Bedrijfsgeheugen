# SEO-to-Order Intelligence Loop Design

## Doel
Bedrijfsgeheugen.nl wordt één gesloten groeisysteem waarin bestaande pagina's, nieuwe landingspagina's en nieuwe blogs automatisch volgens hetzelfde SEO-, conversie- en learningcontract worden gebouwd, gemeten en verbeterd. Ranking is geen einddoel; de optimalisatiedoelstelling is duurzame organische omzet via relevante zoekintentie, klik, engagement, CTA, lead, order en omzet.

## Bestaande basis
De implementatie bouwt voort op de bestaande `tools/seo-order-engine/`, `site/seo-order-map.json`, canonical brand shell, technische SEO-gate, Netlify production readback en Powerhouse universal event architecture. De canonical learning route blijft `BG211 -> BG168 -> BG166 -> BG167`; graph-lineage blijft via BG205. Er komt geen parallel Brain of los analytics-systeem.

## 1. Paginarollen
Iedere publieke indexeerbare pagina heeft exact één rol:
- `pillar`: brede categorie/merkzoekintentie en verdeling van autoriteit;
- `money`: commerciële zoekintentie met koop-/beslisdoel;
- `support`: informatieve of compliance-intentie die een money/pillar route ondersteunt;
- `article`: blog/kennisartikel;
- `trust`: bewijs, cases, over-ons of risicoreductie;
- `blog-index`: navigatie-/collectiepagina.

Niet-indexeerbare, functionele of app-routes vallen buiten de SEO-to-order graph.

## 2. Money Page Conversion Contract v2
Iedere `money`-pagina moet machineleesbaar aantonen dat de volgende elementen zichtbaar aanwezig zijn:
1. zoekintentie en concrete probleemformulering boven de vouw;
2. unieke propositie/oplossing;
3. bewijs: case, methode, berekening, bron, benchmark of aantoonbare praktijk;
4. hoe-het-werkt/aanpak;
5. concrete deliverables of wat de klant krijgt;
6. voor-wie/wel-niet of duidelijke doelgroepfit;
7. prijs, prijslogica of transparante route naar kosten;
8. risico/bezwaar/voorwaarden of expliciete risicoreductie;
9. koopvragen/FAQ wanneer zichtbaar en inhoudelijk echt aanwezig;
10. exact één primaire CTA uit de registry;
11. minimaal één secundaire microconversie;
12. contextuele links naar relevante support/article/trust content;
13. structured data passend bij de inhoud;
14. conversie-attributiemarkers.

De engine mag bestaande inhoud markeren of veilige presentatielagen toevoegen. Hij mag nooit klantresultaten, reviews, keurmerken, prijzen, garanties of bewijs verzinnen. Bij ontbrekende inhoud faalt de releasegate met concrete contractfouten.

## 3. Future Blog Contract v2
Iedere nieuwe blog wordt automatisch gekoppeld aan één dominante commerciële intentie en moet vóór publicatie bevatten:
- canonical, title, description en precies één H1;
- zichtbare auteur/reviewer;
- zichtbare publicatie/inhoudsdatum;
- bewijs/bronnen/praktijkmethode;
- minimaal twee contextuele interne links;
- minimaal één link naar de dominante money/pillar page;
- primaire CTA;
- Article/Person/Breadcrumb structured data;
- absolute interne URLs onder `https://www.bedrijfsgeheugen.nl/...`;
- `bg-order-contract` versie 2;
- page role, funnel stage en intent markers.

Nieuwe blogs die hier niet aan voldoen worden niet naar productie gebracht.

## 4. Measurement Contract
De website verzamelt uitsluitend privacybewuste first-party gedrags- en attributie-events; geen vrije formulierinhoud, e-mailadressen, telefoonnummers of namen in deze learningloop.

Eventtypes:
- `page_view`;
- `organic_landing`;
- `money_link_click`;
- `primary_cta_click`;
- `secondary_cta_click`;
- `engaged_view` (tijd/scroll drempel, zonder fingerprinting);
- `selfscan_start`;
- `frisse_blik_start`;
- `lead_outcome` wanneer downstream een niet-persoonlijke outcome-id levert;
- `order_outcome` wanneer downstream order/omzet aan dezelfde attribution root kan worden gekoppeld.

Verplichte dimensies:
`event_id`, `occurred_at`, `canonical`, `page_role`, `funnel_stage`, `intent_id`, `keyword_cluster`, `source`, `medium`, `landing_canonical`, `cta_action`, `attribution_root`, `schema_version`.

## 5. Search Intelligence Contract
Externe zoekdata (Search Console wanneer beschikbaar, DataForSEO waar passend) wordt genormaliseerd naar dezelfde canonical/intentie-key. Minimaal:
- query/zoekwoordcluster;
- impressions;
- clicks;
- CTR;
- gemiddelde/gediscretiseerde positie;
- periode;
- canonical;
- intent_id.

Zoekdata en onsite gedrag worden nooit als losse optimalisatiewerelden behandeld.

## 6. Unified Growth Observation
DataHub/Brain ontvangt één normalisatievorm:
`page + intent + search signal + behavior signal + conversion/outcome + evidence`.

Een observation bevat geen persoonsgegevens en gebruikt dedupe/idempotency op `source + canonical + period/event_id + metric/event_type`.

## 7. Optimization Decision Contract
Brain mag alleen gebonden optimalisatievoorstellen of -acties produceren binnen een allowlist:
- title/meta variant;
- CTA copy/positie;
- contextuele interne link;
- ontbrekende contentsectie signaleren;
- supporting blog opportunity;
- cannibalization consolidatievoorstel;
- keywordcluster uitbreiding;
- bewijs-/trust-gap signaleren.

Automatische publicatie is uitsluitend toegestaan wanneer de wijziging geen nieuwe feitelijke claim introduceert en alle bestaande releasegates groen zijn. Nieuwe claims, nieuwe klantresultaten, prijswijzigingen, juridische claims en testimonials vereisen expliciete bron/evidence in de contentbron.

## 8. Business Objective
De primaire score is niet traffic of ranking alleen. De engine berekent per canonical/intentie een gewogen score op basis van beschikbare signalen:
`visibility -> CTR -> engaged visit -> CTA -> lead -> order -> revenue`.

Ontbrekende downstream data verlaagt confidence maar veroorzaakt geen verzonnen nulmetingen.

## 9. Closed Loop
De vaste lifecycle is:
1. content/page build;
2. SEO Order enrichment;
3. Money/Blog contract validation;
4. preview + technische releasegates;
5. productie + exact-commit readback;
6. behavioral/search events naar universal growth adapter;
7. BG211 universele event envelope;
8. DataHub/Brain learning en graph lineage;
9. bounded optimization candidate;
10. TDD/releasegate/preview;
11. productie;
12. outcome/readback terug naar Brain.

## 10. Failure/Cost Contract
- fail-closed voor onbekende producers of ongeldige eventversies;
- browser-event delivery is best-effort en mag UX nooit blokkeren;
- batching/dedupe voorkomt Make-creditverbranding;
- geen retry storms;
- runtime Brain writeback mag alleen als succesvol worden geclaimd met execution + target readback;
- bij paused/capacity blocker blijft de observation als dedupebare open learning obligation bestaan.

## 11. Productie-evidence
Een release is pas volledig groen wanneer:
- unit/contract tests groen zijn;
- full Netlify-equivalente build groen is;
- deploy-preview groen is;
- production deploy exact de merge-SHA bevat;
- live readback Money/Blog/measurement markers controleert;
- geen secrets in deploy scan staan.

## 12. Niet-doelen
- geen garantie op positie #1;
- geen automatische thin-content paginafabriek;
- geen black-hat linkbuilding of keyword stuffing;
- geen persoonsgegevens in SEO-learning events;
- geen autonome feitelijke claims zonder evidence.
