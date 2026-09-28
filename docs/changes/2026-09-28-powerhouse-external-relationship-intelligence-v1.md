# Powerhouse external relationship intelligence v1

Verified updates from public internet sources, public LinkedIn context and approved external providers are no longer allowed to remain isolated signal records when Powerhouse can match them to an existing person or company.

The canonical projection is:

**external evidence → person/connection → company → customer → predictive signal → opportunity / next-best-action → outcome → learning**

The runtime reuses the existing Powerhouse relationship graph and scheduler. It does not introduce a second CRM, second company store or separate intelligence scheduler.

For a known connection, a compact external-intelligence snapshot is projected into `bg_connecties.extra.powerhouse_external_intelligence`. Company-level evidence is normalized into the existing `powerhouse_predictive_signals` lineage so `powerhouse_company_intelligence_v1` and all downstream commercial scoring can consume it. Customers receive the same context through `powerhouse_customer_external_intelligence_v1`.

LinkedIn updates are treated as evidence features with provenance, freshness and confidence. They can affect context, intent, research priority, timing and next-best-action, but they never become automatic proof of purchase intent by themselves.

The existing `powerhouse-commercial-learning-v1` owner remains canonical. The external relationship projection runs before relationship-revenue and trigger acquisition in the same commercial cycle.
