# Powerhouse Daily Full Connection Enrichment v1

Vanaf 28 september 2026 geldt één permanente regel: **iedere canonieke connectie wordt dagelijks verrijkt**.

De runtime projecteert alle reeds ingeladen relevante informatie uit LinkedIn-engagement/profile-evidence, externe intelligence, bedrijfsnieuws, runtime evidence, relatie-/bedrijfscontext en bestaande commerciële lineage opnieuw op de volledige connectiegraph.

Canonical flow:

`all ingested evidence → person → company → customer → opportunity/NBA → action/outcome → learning`

De full-graph refresh is set-based en draait binnen de bestaande `powerhouse-commercial-learning-v1` scheduler. Er is geen tweede CRM, geen tweede scheduler en geen los nieuwsarchief.

De dagelijkse rollup dupliceert niet alle brondata. Details blijven in de canonical source stores; de enrichment-state bewaart dagstatus, volledigheid, evidence-counts, freshness en provenance-pointers.

Production proof 28-09-2026: 23.295 connecties totaal, 23.295 verrijkt, 0 resterend, completion ratio 1.0, `full_graph_daily_refresh=true`.

Guardrails: alleen publieke of geautoriseerde bronnen; geen gevoelige persoonsinferenties; geen platform-bypass; externe evidence is niet automatisch koopintentie; dure externe discovery blijft bounded en geprioriteerd.
