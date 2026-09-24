# SEO Opportunity Intelligence / first-mover — 2026-09-24

- Obligation: `seo-opportunity:first-mover:v1`
- Root cause: the daily analysis did not reliably consume the already available GSC table and valid DataForSEO cache before declaring CPC/volume/rank evidence unavailable.
- Runtime truth observed: DataForSEO scheduler and credentials are healthy, but the domain ranked-keywords endpoint currently returns zero items; cached keyword intelligence remains populated. GSC sync is active and fresh.
- Build: new `powerhouse-seo-opportunity-resolver-v1` fuses fresh GSC, DataForSEO cache and active market forecasts; it ranks at most five opportunities and writes pre-outcome forecasts.
- Owner gate: existing canonical owner -> `UPDATE_MONEY_PAGE`; distinct evidenced gap -> `CREATE_INTENT_GAP_CONTENT`; otherwise fail closed.
- Autonomous path: only distinct intent gaps create a blog recommendation; the existing Powerhouse orchestrator and protected publisher remain the only delivery authority.
- Timing: resolver scheduled at 05:25 UTC, after DataForSEO 04:20 and GSC 05:15, before the canonical morning blog window.
- Skills/config/docs are updated in the same lineage.
- Terminal status requires protected merge, deployed Edge Function/migration, scheduler readback, first runtime evidence and downstream production readback.
