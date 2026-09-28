# Development ledger — Daily Full Connection Enrichment v1

Date: 2026-09-28  
Fingerprint: `powerhouse-daily-full-connection-enrichment-v1`

## Purpose
Guarantee that every canonical Powerhouse connection is refreshed daily with all already-ingested LinkedIn and external evidence.

## Runtime
- Table: `public.powerhouse_connection_enrichment_state_v1`
- View: `public.powerhouse_connection_enrichment_v1`
- RPC: `public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)`
- Scheduler owner: `powerhouse-commercial-learning-v1`
- Commercial cycle integration: `powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)`

## Production proof
A controlled production refresh on 2026-09-28 returned:
- total connections: 23,295
- enriched today: 23,295
- remaining: 0
- completion ratio: 1.0
- full graph daily refresh: true

## Source authorities
`bg_connecties`, `linkedin_engagement_events`, `powerhouse_predictive_signals`, `bg_bedrijfsnieuws`, `bg_externe_signalen`, `powerhouse_runtime_events`, person/company intelligence and the existing opportunity/outcome lineage.

## Guardrails
No parallel CRM, no sensitive inference, no platform bypass. Detailed source evidence stays canonical and is referenced rather than copied into a shadow evidence store. Expensive public discovery remains bounded/prioritized.
