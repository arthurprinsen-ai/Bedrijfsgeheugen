# Automatic terminal closure for Edge-only delivery

## Incident

Merged LinkedIn company OAuth setup change #4134 deployed to Supabase as Edge Function `powerhouse-composio-linkedin-setup` version 24, but terminal closure run #37760879023 failed because it waited for a separate website release. The previous mandatory Edge provider-readback step passed.

## Change

When an automation PR changes Edge Functions only, the production gate accepts the successful prior Edge provider evidence plus protected main ancestry and sets `mode=edge_provider_readback`. If website source, Netlify functions or Supabase database migrations are also changed, retain the canonical website release readback. The Edge provider verification remains a prerequisite for all Edge changes.

## Acceptance

Exact-head PR gate, CodeQL, protected merge and canonical Brain closure must pass. Do not mark fulfilled because this file exists; use immutable provider readback, commit and runtime evidence.
