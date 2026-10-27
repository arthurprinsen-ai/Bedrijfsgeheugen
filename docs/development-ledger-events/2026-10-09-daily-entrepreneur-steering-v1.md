# 2026-10-09 — PRODUCT / IMPROVEMENT — Daily entrepreneur steering

- **Fingerprint:** `powerhouse|one-brain|daily-entrepreneur-steering|v1`.
- **Signal:** existing Powerhouse modules and data become truly indispensable only when an entrepreneur experiences a repeatable daily habit, not a catalogue of dashboards.
- **Impact:** without visible outcome and learning, customer experience stops at suggestions/actions even when the actual ONE BRAIN contract extends beyond them.
- **Root cause:** daily executive portal exposed knowing/deciding/doing prominently but lacked equally legible evidence-first measuring/learning.
- **Fix:** reuse Portal V2 executive projection and existing `monitoring-learning` tab for a five-stage daily cockpit, no new feature silo, scheduler, database, or sending engine.
- **Owner:** Portal V2 + ONE BRAIN.
- **Verification:** candidate regression `portal-v2/tests/daily-entrepreneur-steering.test.mjs`; production not yet proven until protected merge + deploy + authenticated end-to-end test.
- **Production SHA/deploy:** not verified; do not claim LIVE until provider and tenant readback match.
- **Rollback:** revert the Portal V2 executive cockpit/style presentation change, preserving other ONE BRAIN internals.
- **Reusable lesson:** a coherent daily interface requires independently evidenced measure/learn stages with a next decision; an executed action alone is never realized value.
- **Related existing P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
