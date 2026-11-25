# Daily blog: choose keyword demand before news freshness

**Date:** 28 October 2026. **Status:** candidate, not production-proven until protected delivery and manual edge deploy.

The orchestrator limited the daily blog to source-backed news recommendations whenever any existed and scored them +750. The daily SEO resolver's keyword briefs (`seo_first_mover_intent_gap`: keyword, volume, CPC, CTA target) were never selected. About half of the recent blogs followed subsidy and cyber news that the target audience does not search for, while Search Console showed 0 clicks in 28 days.

## Bounded implementation
- Blog channel only: remove the source-backed-only shortcut; score keyword briefs +1000 plus volume/5; make developer-intent keywords ineligible.
- `linkedin_company`, Instagram and personal selection are unchanged. News stays the blog fallback.
- No new scheduler, publisher, collector or table.

## Independent validation
Replay/shadow/canary test extracts the real selection block from the function source. After merge the edge function must be deployed by hand (migration drift) with a parity run; then the next daily blog must show a keyword brief as its recommendation, and Search Console impressions for that keyword must be tracked after 2 to 4 weeks. Keyword briefs for an existing owner page need a separate check; `seo_first_mover_intent_gap` only covers gaps without owner.
