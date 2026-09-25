# Agent Factory: Supabase and Notion fast path

## Root cause

The repository's Supabase PR workflow watched `portal/**`, `portal-next/**`, `portal-v2/**` and `netlify/functions/**`. This meant ordinary application work could create a second database-oriented CI flight even when no Supabase schema, migration, function or configuration changed.

At the same time, Notion is useful as a knowledge/projection target but must not become part of the synchronous delivery critical path.

## Implementation

- Scope `supabase-pr-preview.yml` to `supabase/**` and its own workflow file.
- Retain PR-scoped `cancel-in-progress: true`.
- Add regression coverage that forbids broad portal/Netlify trigger paths.
- Add regression coverage that forbids Notion from Required test, release lanes, production snapshot and production readback.
- Keep the existing authenticated Notion sync API as an explicit projection operation.
- Record the current Supabase migration-history divergence as a separate reconciliation obligation; do not repair or replay production blindly.

## Operational configuration

In Supabase Dashboard → Project Settings → Integrations → GitHub Integration, Automatic branching should be enabled with **Supabase changes only**. The current tool surface can inspect branches but cannot safely mutate that GitHub integration setting, so repository behavior is made safe independently.
