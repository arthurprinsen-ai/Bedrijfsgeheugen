# 2026-09-24 — Powerhouse 50 canonical Problem Library v1

Fingerprint: `powerhouse-50-problem-library-v1`

## Waarom
Powerhouse had al veel losse bouwstenen voor intelligence, benchmarks, execution, capabilities en learning, maar nog geen enkele canonieke probleemtaal die website, Problem Radar, portal, sales en outcome-meting aan elkaar bindt.

## Oplossing
De eerste versie van de Powerhouse Problem Library introduceert 30 gecodeerde MKB-problemen (`PH-P001` t/m `PH-P030`) met één vast contract:

`TRIGGER → PROBLEM_ID → EVIDENCE → IMPACT → ACTION → CAPABILITY → OUTCOME → LEARNING`

Per probleem worden minimaal signalen, triggers, evidence-categorieën, confidence-policy, impactsoorten, acties, capabilities en outcomes vastgelegd. Financiële of operationele impact moet expliciet als `OBSERVED`, `ESTIMATED` of `POTENTIAL` worden gelabeld.

## Betrouwbaarheid
Een extern signaal is nooit automatisch een bewezen intern probleem. Feit, signaal en hypothese blijven gescheiden. Cross-customer learning mag alleen geaggregeerd/geanonimiseerd plaatsvinden en tenantdata blijft geïsoleerd.

## Delivery-learning
De eerste pogingen bewezen twee preventieregels:
1. testbestanden moeten binnen een bestaande delivery-lane namespace vallen; daarom staat de guard onder `tests/brain-`;
2. feature-validatie moet stale main/production drift onderscheiden van de feature zelf. De isolated baseline-preview was groen, terwijl huidige main een reeds bestaande Netlify-buildregressie erft.

## Volgende productlaag
De executive cockpit en Problem Radar moeten deze Problem IDs lezen als projectie van dezelfde canonieke waarheid; zij mogen geen eigen probleem-taxonomie creëren.


## P0 executive projection

De volgende productlaag projecteert de canonieke Problem Library nu naar de executive cockpit:
- maximaal vijf `PH-Pxxx`-problemen onder “Wat vraagt vandaag aandacht?”;
- evidence drawer “Waarom zegt Powerhouse dit?”;
- impactlabel fail-safe naar `POTENTIAL` wanneer de bron geen geldig label levert;
- zichtbare mapping naar actie, capability en outcome;
- lokale/niet-canonieke probleem-ID's worden uitgesloten.

Fingerprint: `powerhouse-50-problem-radar-executive-p0-v1`.
