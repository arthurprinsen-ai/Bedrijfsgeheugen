# Powerhouse relationship-to-revenue engine v1 — 28 september 2026

## Aanleiding
Het commerciële brein bevatte al person/company intelligence, buying-window scoring, opportunities, actions, forecasts en outcome learning. Tegelijk stonden 23.295 connecties en 17.034 bedrijven in de bestaande graph, terwijl de trigger-runtime terecht 0 bedrijven als actuele expliciete kooptrigger kwalificeerde.

## Besluit
Powerhouse blijft zelf de canonical intelligence- en orchestratielaag. De bronvolgorde is vastgelegd als **Powerhouse first-party → publieke web-evidence → optionele vendor fallback**. Apollo is geen dependency en geen eigenaar van waarheid, score of outreach.

## Implementatie
Nieuwe server-only view `powerhouse_relationship_revenue_intelligence_v1` rankt relaties op relatie-warmte, beslissingsinvloed, company intent, externe signalen, recency en beschikbare kanalen. De refresh `powerhouse_refresh_relationship_revenue_v1(date)` maakt bounded interne research-acties en alleen bij echte opportunity-/waarde-evidence een human-authorized activation review.

De bestaande `powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)` voert deze relatie-activatie vóór trigger acquisition en commercial learning uit. De bestaande cron `powerhouse-commercial-learning-v1` blijft de enige scheduler owner.

## Live readback
Migration `20260928103246 powerhouse_relationship_revenue_engine_v1` is toegepast in productie. Eerste refresh: 2.105 relaties boven de research-drempel, 50 research-acties aangeraakt, 0 activation reviews en 0 externe outreach. `apollo_required=false`.

## Veiligheidsgrens
Een sterke relatie is geen kooptrigger. Geen scraping/platform-bypass, geen bulk-DM en geen ongevraagde externe outreach zonder menselijke autorisatie.


## Automatische research execution
De tweede production migration `powerhouse_relationship_research_auto_enrichment_v1` voert geselecteerde research-acties automatisch uit tegen de bestaande publieke Powerhouse-evidencestores. Alleen evidence-hits worden als VERIFIED runtime-event aan dezelfde trigger/opportunity lineage toegevoegd. De bestaande werkdagelijkse bedrijfsnieuws-ingest en uurcyclus blijven de canonical producer/scheduler; er is geen extra vendor of scheduler toegevoegd.
