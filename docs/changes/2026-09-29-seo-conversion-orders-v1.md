# SEO conversion-to-orders v1 — 2026-09-29

## Doel
Bedrijfsgeheugen SEO stuurt voortaan niet op verkeer als einddoel, maar op de keten: commerciële zoekintentie → message match → engagement → CTA → gekwalificeerde lead → order → omzet → learning.

## Wat gewijzigd is
- De bestaande SEO Growth Intelligence is uitgebreid met search intent, JTBD, PAS, AIDA, 4P, risk reversal, message match, information scent, topic clusters, E-E-A-T evidence, conversion hierarchy, objection handling en outcome memory.
- De opportunity-prioritering weegt commerciële intentie, zoekvraag, ranking feasibility, conversion gap en verwachte orderwaarde.
- Per dagelijkse cyclus zijn maximaal drie high-confidence, reversible wijzigingen toegestaan.
- CRO-acties zoals hero/message match, risk reversal, objection FAQ, snippet, proof, schema freshness en CTA-frictie zijn evidence-gated toegevoegd.
- De money page voor bedrijfsprocessen automatiseren heeft een scherpere hero, meta description, lagere CTA-frictie en risk reversal gekregen.
- Homepage structured data is uitgelijnd met het actuele Powerhouse-aanbod.

## Guardrails
Geen doorway pages, scaled thin AI content, keyword stuffing, cloaking, link schemes, duplicate intent pages, onbewezen testimonials/resultaten of schema dat afwijkt van zichtbare actuele content.

## Meting
Promotie van deze learning naar PROVEN vereist productie-readback plus gemeten CTA-, lead-, order- en revenue-outcomes. Geen waargenomen outcome betekent geen omzetclaim.


## Borging en skills
- Nieuwe canonieke skill: `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`.
- Growth Swarm erft deze regels expliciet via `.agents/skills/powerhouse-growth-swarm/SKILL.md`.
- Systeemkaart/component-registry bevat `CAPABILITY_SEO_CONVERSION_ORDERS`.
- Machine-enforcement: `tests/brain-seo-conversion-orders-v1.test.mjs`.
- Brain-learning: `brain/learning/2026-09-29-seo-conversion-orders-v1.json`.

Scope-contract refreshed after skill/system-map registration so delivery hygiene evaluates the complete canonical change set.

## Borgingscorrectie — systeemkaartbron
De eerdere closure-documentatie verwees al naar `CAPABILITY_SEO_CONVERSION_ORDERS` in het componentregister, maar de bron `platform/system-map/canonical-system-map.mjs` bevatte de capability nog niet expliciet. Dat is nu gecorrigeerd.

De systeemkaart registreert voortaan `seo-conversion-orders` met:
- de canonieke skill, runtime-config, allowlist, money-page authority en learning;
- maximaal drie autonome wijzigingen per dagelijkse cyclus;
- reversible + evidence-gated uitvoering;
- bestaande money-page eerst;
- verplichte productie-readback;
- geen omzetclaim zonder waargenomen outcome.

De regressietest bewaakt nu expliciet dat systeemkaart, skill en componentregister discoverable en synchroon blijven.

## Bestaande money pages toegepast
De revenue-first SEO/CRO-regels zijn toegepast op de bestaande commerciële pagina's met hoogste koopintentie:
- homepage;
- prijzen;
- product/portaal;
- bedrijfsprocessen automatiseren;
- AFAS-koppeling;
- Exact Online-koppeling;
- API-koppeling;
- Power BI implementatie;
- AI-automatisering voor het mkb.

De primaire conversieroute is nu uniform: **gratis Frisse Blik van 30 minuten → alleen bij aantoonbare fit een betaalde vervolgstap**. De pagina's maken prijs/werkwijze, risicoverlaging en eigenaarschap explicieter en sturen niet langer primair naar een generiek contactformulier.

Tegelijk zijn conversierisico's verwijderd: een betaalde Frisse Blik werd op één pagina onjuist beschreven, een verouderde monitoringprijs op de AFAS-pagina is verwijderd, onbewezen social-proof/security-copy op home/product is vervangen door controleerbare producteigenschappen en een foutieve geneste CTA-markup is hersteld.

Regressie: `tests/seo-money-page-order-conversion-v2.test.mjs` borgt de primaire Frisse-Blik-route, risk reversal en de genoemde evidence-safe correcties.

## Money-page conversion wave 2
De conversion-to-orders aanpak is verder uitgerold naar de resterende relevante bestaande commerciële pagina's:
- Twinfield-koppeling;
- AI-adoptie;
- Bedrijfsgeheugen;
- Voor MKB.

Deze pagina's sturen primair naar een gratis Frisse Blik van 30 minuten met expliciete risk reversal. Generieke contact-first CTA's zijn op deze routes naar secundair of later in de funnel verschoven. De AI-adoptie authority in `site/seo-order-map.json` is hiermee gelijkgetrokken met de zichtbare primaire conversieroute.

De bestaande regressietest bewaakt nu ook deze tweede golf.

## Build-authority borging
De V18-build reconstrueert de homepage uit een pinned payload en genereert onder meer de productpagina opnieuw. Daarom is alleen bron-HTML aanpassen onvoldoende als blijvende conversieborging.

De canonieke build sluit nu af met `applyMoneyPageOrderConversion()` vanuit `tools/site-shell/apply-money-page-order-conversion.mjs`. Deze finalizer draait ná de V18 generators, shell-normalisatie, SEO Order Engine en publicatie-markers. Hij:
- herstelt op de gegenereerde homepage de primaire hero-route naar de gratis Frisse Blik;
- injecteert op de gegenereerde productpagina een expliciete gratis kwalificatiestap;
- valideert alle negen priority money pages op Frisse-Blik-primary, expliciete risk reversal en geen generiek contact als primary CTA;
- markeert het uiteindelijke deploy-artifact met `data-money-order-contract="money-page-order-conversion-v2"`;
- faalt de build als een latere generator deze commerciële contracten terugdraait.

Dit maakt de gegenereerde deploy-output, en niet alleen de leesbare repository-HTML, onderdeel van de regressiegrens.


## Behavioral revenue integration
De conversion-to-orders capability is uitgebreid tot één canonieke behavioral revenue-engine binnen Powerhouse, niet tot een losse CRO-stack.

Dezelfde capability wordt nu expliciet geërfd door:
- SEO Conversion-to-Orders;
- Growth Swarm;
- Persuasion Revenue Optimizer;
- Powerhouse Brain/component registry;
- de canonieke systeemkaart.

Powerhouse mag binnen de bestaande evidence-gated autonomie hero/message match, CTA-hiërarchie, bewijsvolgorde, bezwaren, risk reversal, pricing framing, progressive disclosure, commitmentstap en sectievolgorde aanpassen. De optimalisatievolgorde is: gerealiseerde omzet → betaalde orders → gekwalificeerde voorstellen → meetings → leads → CTA-progressie → engagement.

Gebruikte gedragsmodellen zijn onder andere Cialdini, loss aversion/prospect theory, Fogg, Hick-Hyman, cognitive fluency, commitment ladders, specificity en choice architecture.

Guardrails blijven hard: maximaal drie reversibele high-confidence wijzigingen per dagelijkse cyclus; rollback bij regressie op trust, accessibility, mobiele leesbaarheid of gekwalificeerde conversie; geen fake scarcity, fake urgency, fake social proof, hidden costs, confirmshaming of preselected consent.

De canonieke systeemkaartbron en Brain-learning bevatten deze laag nu expliciet, zodat agents en toekomstige optimalisatieruns dezelfde authority en outcome-hiërarchie erven.
