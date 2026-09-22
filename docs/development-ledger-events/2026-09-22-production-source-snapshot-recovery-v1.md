# 2026-09-22 — Production source snapshot recovery

- Fingerprint: `production-source-snapshot-recovery-v1`
- Observation: Netlify production uses `deploy_source=api`; GitHub main can advance without a corresponding Netlify build.
- Recovery: trigger the canonical Production Source Snapshot workflow and use its exact-main artifact as deploy source.
- Security: no deployment credentials or application secrets are committed.
- Terminal proof: artifact SHA = merged main; Netlify production commit_ref = artifact SHA; Composio/Supabase readiness readback succeeds.
