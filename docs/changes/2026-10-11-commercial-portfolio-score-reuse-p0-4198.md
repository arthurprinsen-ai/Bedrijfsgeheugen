# P0 #4198: single-pass portfolio learning

**Owner:** existing Powerhouse commercial learning function and existing cron job 116. No new executor.

## Production evidence
After non-destructive lookup index repair, the original 2026-10-11 10:27 UTC hourly commercial job ran to the next bottleneck and again hit the 120-second statement timeout. The new traceback named `WITH ranked AS (... FROM public.powerhouse_portfolio_allocator_v1 ...)` in `powerhouse_commercial_learning_cycle_v1`. The same view was already evaluated just before this statement in an UPDATE over the 633 open opportunities. Its expansion includes about 24,000 existing contacts through `powerhouse_person_intelligence_v1`.

## Narrow change
The first update continues to calculate the exact authoritative `powerhouse_portfolio_allocator_v1` view and stores the same portfolio score, confidence, modeled value and buyer counts in existing `opportunity.score_components.commercial_learning_v1`. It now also saves the original `source_updated_at` to keep the original deterministic tie-break. The second top-five INSERT gets the newly-scored output from `powerhouse_opportunities`, filtered by its `scored_at = v_now`, instead of evaluating the heavy view again.

No forecast method, value formula, eligibility threshold, top-five cap, channel, message, contact pressure, consent or proof gate is changed. The extra field represents prior row freshness; it does not promote modeled revenue to realized revenue. Function role remains restricted to `service_role`.

## Acceptance
Source control has focused tests and learning/failure evidence. Protected GitHub CI and the source migration must merge before deployment. Do not mark full-green without a subsequent actual **original** hourly cron job 116 success, externally verified publications/outreach, revenue attribution, and learning. Do not manually fabricate migration history or proof.
