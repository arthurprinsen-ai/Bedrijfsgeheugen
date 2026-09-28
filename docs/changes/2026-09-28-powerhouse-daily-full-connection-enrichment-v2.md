# Powerhouse Daily Full Connection Enrichment v2

Vanaf 28 september 2026 is dagelijkse verrijking een vaste Powerhouse-breinregel.

Iedere connectie in `bg_connecties` krijgt minimaal één volledige enrichment-pass per kalenderdag. De pass gebruikt alle op dat moment beschikbare en toegestane LinkedIn-observaties, bedrijfsnieuws, predictive/external signals en runtime evidence. De dagelijkse pass is een minimumgarantie; nieuwe evidence kan binnen dezelfde bestaande commerciële cyclus opnieuw worden verwerkt.

## Canonieke flow
`ingested LinkedIn/public/company evidence -> connection enrichment -> person/company intelligence -> customer/opportunity/NBA -> action/outcome -> learning`.

## Authorities
- State: `public.powerhouse_connection_enrichment_state_v1`
- Profile view: `public.powerhouse_connection_enrichment_v1`
- Coverage: `public.powerhouse_connection_enrichment_coverage_v1`
- Refresh: `public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)`
- Scheduler owner: `powerhouse-commercial-learning-v1`

## Data-quality contract
LinkedIn/social observations may fill missing name/company/role values, but do not overwrite an existing canonical value merely because a newer social observation exists. Missing data is never fabricated. Detailed source evidence stays in canonical source stores. Only public or authorized sources are allowed; no platform bypass and no sensitive-person inference.

## Production proof
Controlled production refresh on 2026-09-28 covered all 23,295 canonical connections: 23,295 enriched today, completion ratio 1.0000. At readback, 11 connections had recent LinkedIn activity evidence, 8 had external intelligence signals and 7 had matched company-news evidence. Average profile completeness was 0.8035.
