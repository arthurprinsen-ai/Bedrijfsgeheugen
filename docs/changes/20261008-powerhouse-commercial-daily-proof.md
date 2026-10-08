# Daily commercial output must be proven

The Heartbeat/Powerhouse sales loop must not treat a repeated analysis, expired action or historical `OBSERVE` decision as a fresh commercial intervention. On 8 October 2026, an expired LinkedIn-reply record from 7 October was repeatedly selected for the current day merely because the scheduler refreshed its `updated_at` timestamp. This caused the commercial assurance to report healthy zero-output despite no delivery that day.

The existing canonical selector now relies on actual due dates, excludes expired rows and cleans previously active terminalized rows. Supabase production readback observed zero active eligible actions and changed output assurance to `DEGRADED_NO_CURRENT_DAILY_ACTION_SET`. This correctly exposes the next existing-Powerhouse obligation: source-backed, quality-ready actions must be materialized and executed by authorized channels, with provider delivery proof and learning. The code change does not claim delivery or revenue.

Failure memory: `brain/learning/powerhouse-commercial-daily-proof-self-reselection-20261008.json`. No duplicate task owner, channel schedule, CRM or queue was added.

## Native provider preview recovery (8 October 2026)

Original PR #4115's Supabase-owned check was `skipped` because its Git branch lacked a managed preview association. A source-identical replacement PR #4119 was created for the **existing** Powerhouse obligation; the first native provider check reported `cancelled` due to the provider's maximum concurrent preview-branch limit. Obsolete ephemeral preview branches subsequently disappeared from the Supabase branch inventory, freeing capacity. This source-only documentation refresh reissues the candidate's existing PR synchronization to request native provider evaluation without a second scheduler, bypass or manual paid branch. Acceptance remains exact-HEAD Supabase-owned `success` plus protected Required + CodeQL; a skipped/cancelled result is never considered green.
