# Powerhouse organism — canonical propagation contract

Status: canonical
Owner: Powerhouse Brain
Version: powerhouse-organism-v1

Bedrijfsgeheugen is één causale bedrijfsgraph. Een wijziging in Portal V2, een connector, AI-register, bronfeed of regulatory source is geen lokaal pagina-event.

Bronwaarheid en afleiding zijn strikt gescheiden. SourceObservation bewaart de aangeleverde JSON-invoer ongewijzigd naast een hash. BusinessInput en CurrentState normaliseren die bron voor canonical state. ImpactAssessment bevat alleen afleidingen: geraakte domeinen, causaliteit en recompute-opdrachten. Afleidingen mogen opnieuw worden berekend; de bronobservatie wordt nooit door AI of een algoritme overschreven.

AI en algoritmen mogen classificeren, prioriteren, voorspellen en adviseren, maar claims blijven gekoppeld aan evidence, provenance en confidence.

De graph koppelt organisatieprofiel aan regulatory scope, AI Act/NIS2-Cbw/AVG, AI inventory aan AI risk/data/suppliers/security, compliance gaps aan risk register en actions, actions aan capacity/finance, en deze aan executive cockpit, advice en Powerhouse Brain.

Portal V2 gebruikt dezelfde graph als de server. Een wijziging kan daardoor automatisch compliance, risico, uren/FTE, geld, prioriteit, roadmap, executive overzicht, audit/evidence en advies raken.

Nieuwe of gewijzigde wettelijke bronfeiten moeten dezelfde eventroute gebruiken. Regulatory facts zijn versioned en bevatten source, effective_from, effective_until, jurisdiction en evidence. Geen complianceclaim wordt VERIFIED door een LLM-conclusie alleen.
