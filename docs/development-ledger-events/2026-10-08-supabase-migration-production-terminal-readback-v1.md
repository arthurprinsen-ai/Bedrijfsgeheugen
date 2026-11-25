# Production terminal readback — migration-only fix, 2026-10-08

- Incident: PR #4128 merged and production Supabase migration `20261008104000` applied, yet terminal closure failed waiting for unrelated Netlify release identity.
- Provider: Supabase production migration ledger, authenticated read-only Management API SQL.
- Change: exact version-set verification in reusable module, tests, and conditional delivery gate.
- Fail-closed: absent token, malformed versions, provider errors or missing rows remain nonterminal.
- Scope: only Supabase migration changes without Netlify/portal/website/Edge changes.
- Postmerge: dispatch Obligation Terminal Closure for PR #4128; verify terminal outcome and live Heartbeat readback.
