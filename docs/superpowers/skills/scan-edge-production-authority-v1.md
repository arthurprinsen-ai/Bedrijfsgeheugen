# Scan Edge production declaration
- Preserve `powerhouse-scan-ingest` as one canonical Supabase Edge function with explicit `supabase/config.toml` declaration.
- It is intentionally `verify_jwt=false` because the existing serverless gateway uses a strict SHA-256 service-token gate. Never expose the service token to browser users.
- Privileged scan history and claim remain routed through authenticated `/api/portal-scans`.
- Protected GitHub main + provider attestation + Edge content readback is required for live truth. Never report a changed scan route as green until provider source and DB downstream agree.
- Do not create a duplicate scheduler, Edge endpoint, Brain lineage or migration to solve a missing declaration.
