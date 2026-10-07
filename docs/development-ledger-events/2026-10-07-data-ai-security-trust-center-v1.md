# 2026-10-07 — Data, AI Sovereignty & Security Trust Center v1

Material change: one evidence-first security trust capability added on top of the existing sovereignty/compliance control plane.

Canonical owner: Powerhouse Trust, Security & Compliance.

Topology: Portal Security Trust Center → authenticated Netlify security API → existing EU portal gateway → Supabase security snapshot/catalog + existing sovereignty snapshot → same Powerhouse heartbeat → evidence/learning/System Map.

No second scheduler, no parallel customer-data store, no implicit certification claims.


Connector event topology: `connector_definitions INSERT/UPDATE/DELETE → connector_definitions_trust_refresh_v1 → refresh_data_sovereignty_snapshot_v1(tenant) + refresh_security_trust_snapshot_v1(tenant) → tenant snapshots → Portal/Powerhouse`. Tenant moves refresh both old and new tenants. The existing Powerhouse sovereignty heartbeat remains the periodic verification/recovery owner.
