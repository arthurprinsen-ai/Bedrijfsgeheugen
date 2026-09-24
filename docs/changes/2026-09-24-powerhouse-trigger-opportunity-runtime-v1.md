# MKB trigger opportunity runtime v1

Datum: 2026-09-24  
Fingerprint: `powerhouse-trigger-opportunity-runtime-v1`

## Wat nu uitvoerbaar is
Powerhouse kan een geobserveerd, company-scoped koop-/verandersignaal veilig opnemen en automatisch projecteren naar de bestaande commerciële lineage:

`observed company signal → powerhouse_predictive_signals → powerhouse_forecasts → powerhouse_opportunities → powerhouse_sales_actions → decision cycle → outcome/learning`.

De runtime hergebruikt bestaande tabellen. Er komt geen parallel CRM.

## Truth boundary
Een extern signaal is bewijs dát iets is waargenomen, niet dat de probleemhypothese waar is. Daarom bewaart de opportunity expliciet:
- trigger type;
- source/evidence ref;
- observed_at;
- probleemhypothese;
- economische-impacthypothese;
- waarschijnlijke beslissersrol;
- recommended next action;
- content angle;
- `hypothesis_not_fact=true`.

## Revenue en outbound guard
Signal-derived opportunities starten met:
- `expected_value_eur = 0`;
- `expected_revenue_value = 0`;
- stage `signal`;
- eerste sales action channel `internal_research`;
- `outbound_allowed=false`.

Bestaande positive-value-, experiment-, dedupe- en provider-gates blijven de enige autoriteit om later outbound mogelijk te maken.

## Triggerfamilies
Growth, new management, buy/sell/M&A, investor/PE, post-merger integration, ERP/AFAS change, margin/cost/cashflow pressure, talent shortage/key-person risk, regulation, financing, turnaround en AI/data/digitalisation.

## Ingest
Edge Function `powerhouse-company-trigger-ingest` accepteert uitsluitend service-role requests en vereist:
- signal key;
- source type + source ref;
- company entity key;
- topic + signal type;
- observed timestamp;
- evidence.observed_fact;
- evidence.provenance.

Zonder deze velden wordt niets gematerialiseerd.

## Definition of Done
LIVE & BEWEZEN vereist repo merge, migration/provider readback, deployed Edge Function readback, security advisor check en canarybewijs zonder persistente fictieve bedrijfsdata.
