# Powerhouse Relationship External Intelligence v1

Vanaf 28 september 2026 is de vaste architectuur voor externe relatie-intelligentie:

**externe/publieke evidence → persoon → bedrijf → klant → opportunity/NBA → actie → outcome → learning.**

Daarmee zijn bedrijfsnieuws, publieke internetupdates en beschikbare LinkedIn-context geen los eindproduct meer. Na geldige entity matching worden ze onderdeel van de context voor relatie-/bedrijfsscore, timing, research, Growth Swarm, kanaalkeuze en next-best-action.

Guardrails: provenance en freshness blijven behouden; externe evidence is geen automatisch koopbewijs; geen gevoelige persoonsinferenties; geen scraping of platform-bypass; bestaande suppression/cooldown/dedupe/provider-ack regels blijven leidend.

Runtime: `powerhouse_refresh_relationship_external_intelligence_v1(date)` en `powerhouse_relationship_context_enriched_v1`, uitgevoerd binnen de bestaande `powerhouse-commercial-learning-v1` scheduler lineage.
