# 2026-11-14 — protected Edge config registration for original email source research

Fingerprint: `powerhouse|commercial|original-relationship-research-edge-not-declared-for-provider-deploy|20261114`.

Independent original project Supabase readback at 14 Nov 2026 14:43 UTC: original Edge `powerhouse-relationship-public-research` version 13 remains on old code (no `researchNoSourceFeedback`) even though original PR #5768 main has updated worker and native 856/857 service-only consumer reconciliation. Original config had NO `[functions.powerhouse-relationship-public-research]` entry. Original #116 runs and is provider-source owner, not a new executor.

Repair only `supabase/config.toml` exact missing function section with `enabled=true`, `verify_jwt=false` (existing private `x-powerhouse-token` gate), correct canonical entrypoint. Regression verifies ONLY original slug in modified config deploy scope, no all-Edge redeploy, worker no Gmail send, exact waiting/prepared source feedback. Protected Supabase GitHub Integration is sole production source writer. Staged candidate is NOT live until verified actual provider version/source and next due #116 readback; sender safe authorization never bypassed.
