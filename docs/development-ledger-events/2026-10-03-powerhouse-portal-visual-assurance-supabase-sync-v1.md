# Portal visual assurance GitHub → Supabase sync — 2026-10-03

Fingerprint: `powerhouse-portal-visual-assurance-github-supabase-sync-v1`.

Production was first applied as Supabase migration version `20261003075748` and Edge Function `powerhouse-visual-assurance-sync` v1. The repository source mirrors that exact runtime contract. The sync is fail-closed on missing/failed GitHub main evidence and reuses the existing scheduler token, Loop Assurance tables and Quality Events.
