# Bedrijfslek — authenticated customer claim guard
Fingerprint: `powerhouse|bedrijfslek|authenticated-portal-claim|v2`
- Reuse `portalStateClient.authHeaders()`; every read and claim must have an actual Netlify JWT Bearer token.
- Keep the first scan entirely ungated and aggregate-only; cache only server-confirmed scan receipt, seven-day TTL.
- Never transfer a verified scan between distinct tenants, even with a leaked submission key.
- Never display one tenant's scan history in another authenticated user session; stale requests are discarded.
- A claim is only successful when existing `/api/portal-scans` confirms `claimed=true` and `tenant_identity_status=verified`.
- Do not generate additional Heartbeats, marketing permission, pseudo-sales or another Brain.
- Historical replay + security shadow + canary + exact Edge source equality are required before declaring live.
