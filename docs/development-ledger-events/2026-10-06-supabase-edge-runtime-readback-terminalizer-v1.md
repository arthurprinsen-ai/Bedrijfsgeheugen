# 2026-10-06 — Supabase Edge runtime terminal readback closure

Obligation: `content-publication:2026-10-06:delivery-recovery`

Observed:
- PR #3856 merged through protected gates on candidate `54df072e...`;
- the post-merge Powerhouse Obligation Terminalizer failed at runtime routing with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`;
- the failing non-governance paths were `supabase/functions/powerhouse-blog-queue/index.ts` and `supabase/functions/powerhouse-social-publisher/index.ts`;
- Supabase provider readback independently showed production social publisher v107 and blog queue v11 active.

Implemented in this lineage:
- added exact source fingerprints to the two affected functions;
- added side-effect-free runtime identity endpoints exposing `DENO_DEPLOYMENT_ID`;
- added `tools/delivery/supabase-edge-runtime-readback.mjs`;
- extended the canonical production-readback contract and workflow;
- extended the post-merge terminalizer to route Supabase Edge runtime explicitly;
- added regression coverage that requires the probe to execute before secret/database setup.

Terminal condition:
- exact-HEAD gates green;
- protected auto-merge only;
- production Supabase deployment exposes the expected runtime fingerprints;
- terminalizer readback succeeds before `LIVE_BEWEZEN`.
