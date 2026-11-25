# Canonical Supavisor recovery transport

The social-publication recovery path no longer treats Vault introspection as an executable recovery step.

The production database was independently proven healthy through direct SQL while the Data API/PostgREST path had produced gateway failures. The structural defect was therefore transport and source parity: production Edge Functions had already moved to the EU Supavisor transaction pooler, but repository source and the GitHub recovery workflow still contained PostgREST dependencies. A routine redeploy could reintroduce the incident.

This change makes the working transport canonical:

- the social recovery control plane is reconciled from proven production source into the repository; provider runtime parity is handled by the separate publication-delivery recovery lane;
- social-recovery-runner retrieves the scheduler authority internally through the EU Supavisor transaction pooler and returns only sanitized state;
- the GitHub recovery workflow calls that runner with the existing service-role credential and no longer queries Vault or publication tables through /rest/v1;
- powerhouse-social-publisher remains the only provider side-effect authority; the recovery runner may only delegate bounded publish_only work to it;
- regression tests reject /rest/v1 in the critical recovery path and require the eu-central-1 Supavisor endpoint.

Security remains fail-closed: no secret value is logged or returned, no provider writer is bypassed, and provider-side readback remains required for terminal success.
