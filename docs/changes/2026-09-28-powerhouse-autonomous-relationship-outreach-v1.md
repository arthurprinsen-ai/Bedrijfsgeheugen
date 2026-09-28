# Powerhouse autonomous relationship outreach v1

Date: 2026-09-28

The relationship revenue engine no longer stops after trigger detection. The user explicitly authorized autonomous commercial follow-up. Powerhouse now prepares and dispatches bounded Gmail follow-up to existing relationships only when there is fresh evidence-backed trigger context.

Safety and quality limits: active/dormant known relationship only; trigger confidence >= 0.60; trigger age <= 30 days; maximum 5 sends/day; 30-day per-person cooldown; opt-out/complaint/negative-reply suppression; provider acknowledgement before an action becomes done; no fabricated LinkedIn DM path.

Delivery remains inside the existing `powerhouse-commercial-learning-v1` scheduler and existing action/outcome/learning lineage. No second CRM or scheduler.
