# Development ledger — linkedin-composio-capability-proof-v1

- Date: 2026-09-22
- Problem: dashboard connectivity alone did not prove that the canonical Powerhouse runtime could use LinkedIn, nor that organization/page publishing was authorized.
- Change: add a read-only Composio LinkedIn capability verifier to the canonical content closed loop.
- Personal proof: resolve the authenticated posting identity through `LINKEDIN_GET_MY_INFO`.
- Company proof: resolve managed organizations through `LINKEDIN_GET_COMPANY_INFO`; personal connection alone never implies company write capability.
- Safety: zero LinkedIn write tools are invoked by this verifier. External side effects remain owned by `powerhouse-social-publisher`.
- State: write one canonical `linkedin-composio-setup-current-state-v1` Brain record without secret values.
- Closure: exact-head CI + protected merge + Supabase Edge Function provider readback + live state readback required.
