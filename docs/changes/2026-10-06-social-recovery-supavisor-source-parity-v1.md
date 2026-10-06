# Canonical Supavisor recovery transport

The social-publication recovery path no longer treats Vault introspection as an executable recovery step.

The production database was independently proven healthy through direct SQL while the Data API/PostgREST path had produced gateway failures. The structural defect was therefore transport and source parity: production Edge Functions had already moved to the EU Supavisor transaction pooler, but repository source and the GitHub recovery workflow still contained PostgREST dependencies. A routine redeploy could reintroduce the incident.

This change makes the working transport canonical:

- content-operations, powerhouse-social-publisher, powerhouse-content-orchestrator and powerhouse-content-loop are reconciled from proven production source into the repository;
- social-recovery-runner retrieves the scheduler authority internally through the EU Supavisor transaction pooler and returns only sanitized state;
- the GitHub recovery workflow calls that runner with the existing service-role credential and no longer queries Vault or publication tables through /rest/v1;
- the canonical content loop remains the single owner of generation, provider dispatch, reconciliation and provider-truth readback;
- regression tests reject /rest/v1 in the critical recovery path and require the eu-central-1 Supavisor endpoint.

Security remains fail-closed: no secret value is logged or returned, no provider writer is bypassed, and provider-side readback remains required for terminal success.
