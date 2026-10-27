# Daily growth measurement, €1m evidence and fail-closed learning

## Canonical integration
The new `public.powerhouse_growth_source_daily_v1` is a restricted read model over existing GSC, GA4 campaign batches, filtered site interactions, social post snapshots, and observed commercial outcomes. It is **not** a second decision engine or an alternative CRM. Existing Brein, Powerhouse and Heartbeat continue to own learning, actions and assurance.

## Why
On 2026-10-19 the social snapshot writer had no post performance data later than 2026-10-08; social learning evaluations were last written on 2026-09-19. Existing GA4 ingestion reports status `ok` on empty/misattributed batches. The upstream linked GA4 and LinkedIn organic connectors were able to return current provider metrics, which shows the missing step is durable daily ingestion into the canonical data spine.

## Behavior
- Every six hours, cron reconciles yesterday and today in `Europe/Amsterdam`, replacing only derived daily source facts.
- GSC's normal reporting delay is explicitly distinguished from missing sources.
- GA4 campaign attribution records are never represented as full website analytics.
- Only existing observed post snapshots are counted; disabled Buffer is not re-enabled.
- Robot events remain separate from human interactions.
- The €1,000,000 target is a **rolling 365-day goal**, measured against **positive amounts recorded in `powerhouse_sales_outcomes`** only. When no revenue is recorded, this is **missing revenue evidence**, not a claim the business made €0.
- Heartbeat writes a diagnostic result with concrete source gaps and never declares missing evidence green.

## Production acceptance
Protected Required CI, CodeQL and native Supabase Preview must pass first; then protected merge, production migration, cron readback and RLS verification. Provider-pull repair (LinkedIn/Instagram) and true full-scope GA4 sessions remain separate open acceptance criteria until actual daily provider evidence exists.
