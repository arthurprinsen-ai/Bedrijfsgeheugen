# Development ledger — Powerhouse Relationship External Intelligence v1

Date: 2026-09-28  
Obligation: `powerhouse-relationship-external-intelligence-v1`

## Purpose
Make external public internet, company and supported LinkedIn updates first-class evidence in the canonical Powerhouse relationship graph rather than isolated news/events.

## Canonical flow
`external evidence -> runtime event -> person -> company -> customer -> opportunity/NBA -> action/outcome -> learning`

## Runtime
- Projector: `public.powerhouse_refresh_relationship_external_intelligence_v1(date)`
- Context view: `public.powerhouse_relationship_context_enriched_v1`
- Scheduler owner: `powerhouse-commercial-learning-v1`
- Predictive signal type: `relationship_external_intelligence`

## Guardrails
External evidence is not buying intent by itself. Entity matching, provenance, freshness, confidence, suppression, cooldown, channel capability and outcome learning remain mandatory. No sensitive-person inference and no platform bypass.

## Production evidence
The production migration was applied successfully. A verified refresh projected 10 company signals and 10 person signals. The enriched context covers 23,295 relationships; matched external updates are now available to the relationship/company intelligence path.

## Governance
The capability is registered in the canonical system map, Powerhouse quality surface registry, dedicated skill, Relationship Revenue skill, LinkedIn Sales Machine skill and Brain learning record.
