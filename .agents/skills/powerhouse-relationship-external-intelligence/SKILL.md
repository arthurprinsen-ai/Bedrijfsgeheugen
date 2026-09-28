# Skill: Powerhouse Relationship External Intelligence

Fingerprint: `powerhouse-relationship-external-intelligence-v1`

## Permanente regel
Publiek beschikbare en rechtmatig verkregen externe updates over een bestaande connectie, klant of gekoppeld bedrijf worden standaard als evidence aan de canonieke relatiegraph gekoppeld. Dit omvat bedrijfsnieuws, website/newsroom, vacatures, marktontwikkelingen en LinkedIn-context voor zover die via ondersteunde bronnen/capabilities beschikbaar is.

## Canonieke lineage
`external/public evidence -> runtime event -> person -> company -> customer -> opportunity/NBA -> action/outcome -> learning`.

Geen los nieuwsarchief als eindpunt. Een relevant signaal moet terugkomen in de context die Powerhouse gebruikt voor scoring, timing, kanaalkeuze en next-best-action.

## Beslisregels
- Extern signaal is evidence, niet automatisch koopintentie.
- Match eerst op persoon/bedrijf en provenance; daarna pas scoring.
- Freshness, source trust, corroboration en confidence blijven zichtbaar.
- Geen gevoelige persoonsinferenties of afleiding van bijzondere persoonsgegevens.
- Geen scraping/platform-bypass; LinkedIn alleen via toegestane publieke/provider-capabilities.
- Customer linkage gebruikt de bestaande klant- en company-lineage; geen parallel CRM.
- Opportunity/NBA mag alleen wijzigen via bestaande evidence-, fatigue-, suppression- en outcome-gates.
- Alle downstream acties blijven dedupe-, identity- en provider-ack gebonden.

## Runtime
- Projector: `public.powerhouse_refresh_relationship_external_intelligence_v1(date)`.
- Context view: `public.powerhouse_relationship_context_enriched_v1`.
- Scheduler owner: uitsluitend `powerhouse-commercial-learning-v1`.
- Volgorde: external intelligence projection -> relationship scoring -> research -> trigger/opportunity -> Growth Swarm/NBA -> execution -> learning.

## Doel
Powerhouse moet bij iedere relevante connectie/klant/bedrijf weten wat er extern veranderd is en dit gebruiken om betere commerciële beslissingen te nemen, zonder losse datasilo's of vendor-afhankelijkheid.
