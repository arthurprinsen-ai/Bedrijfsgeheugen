# Netlify bridge timeout repair — 2026-11-04

- Obligation: netlify-bridge-timeout-recovery-20261104-v1
- Original owner: Production Source Snapshot / powerhouse-terminal-delivery
- Incident: #4447; parent #4547
- Evidence: workflow run 41870321838 returned HTTP 000 after 20s; Supabase bridge logs recorded successful proxy_ready after 25.166s.
- Change: bounded GitHub curl timeout 20s → 60s, without modifying OIDC or Netlify authorization.
- Verification: pending protected merge, exact-SHA Netlify deployment and mobile DOM readback. Not yet live.
