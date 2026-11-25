# 2026-10-06 — Terminalizer Supabase provider readback

Obligation: `github-terminalizer:supabase-provider-readback:2026-10-06`

Observed:
- PR #3856 passed protected merge and canonical production-release readback.
- The lease-owning Powerhouse Obligation Terminalizer still failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` for changed `supabase/functions/*` paths.
- The separate terminal-closure lane already defined a per-function `Terminal-Supabase-Provider-Readback` contract.

Implemented:
- classify `config/brain-delivery-system.json` as governance;
- classify Supabase Edge Function, Netlify and unknown runtime paths separately;
- require version plus 64-hex runtime digest for every changed Supabase function;
- keep unknown runtime surfaces fail-closed;
- persist Supabase provider readbacks in immutable terminal evidence;
- support Supabase-only and mixed Netlify plus Supabase readback modes.

Production evidence for the triggering recovery:
- `powerhouse-social-publisher`: ACTIVE v107, runtime digest `a7dfb0f03079126148ab09919147ebf830fa525398c3d4aa36b37ff7672ce758`;
- `powerhouse-blog-queue`: ACTIVE v11, runtime digest `1cf117b00363839ec57431f8360f328fd3a4168667c21a59b08c5b336e8a32f1`;
- both deployed `index.ts` sources matched merge SHA `8a681b96233606e2c7bf2f9472b3ab42eb67d964` exactly.
