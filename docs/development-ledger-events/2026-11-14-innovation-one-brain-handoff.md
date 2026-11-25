# 2026-11-14 — Existing Innovation owner to original ONE BRAIN consumer handoff

- Canonical P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original delivery obligation: `powerhouse|innovation|candidate-to-one-brain-delivery-gap|20261114-v1`
- Owner: original Powerhouse Self-Improvement + ONE BRAIN/Heartbeat, not a new execution agent.
- Actual observed production: cron 52 and 107 both running, hourly replay efficiency at the 12-hour safe floor, 14 original candidates dating up to 29 October 2026, all lacking measured outcome and producer→consumer execution proof.
- Root cause: `buildAutonomousInnovationPortfolio` and `buildAllAgentInnovationDuties` were assignment/read-only; the daily `powerhouse_run_self_improvement_layer_v1` created candidates but never reconciled them into executable, accountable original `brain_obligations`. A green SQL job hid the handoff deficit.
- Immediate verified remedy: 14 idempotent rows inserted into existing `brain_obligations` as type `INNOVATION_DELIVERY`; separate SELECT confirmed 14 OPEN, 0 missing source candidates, 0 wrong owners at 2026-11-14 17:45 UTC. This creates producer intent only, not consumer ACK or product impact.
- Permanent guarded change: PR #5789 adds a single original daily routine migration, inserts or revision-updates original obligations, verifies exact source→obligation identity/count before returning, fails with `INNOVATION_HANDOFF_INCOMPLETE` on missing handoff; preserves terminal records, source review restrictions, tenant boundary and old working scheduler.
- Machine prevention: `tests/brain-innovation-canonical-handoff-20261114.test.mjs` invoked by the existing daily workflow and learning replay; agent skill `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` updated to demand same correlation, next natural consumer ACK, independently tested release, observed effect and learning.
- No additional cron, worker, queue, DB registry, publisher, external contact or unauthorized release.
- State: **BACKFILL_LIVE; CODE_CANDIDATE_AWAITING_PROTECTED_CI/DEPLOYMENT**. No customer value, proven agent implementation, or automated delivery success asserted.
- Final acceptance: protected Required/CodeQL success, merge, Supabase migration application and exact function readback, next natural daily job confirms all sources, then each candidate separately shows owner consumption, protected deploy, independent effect and learning, else stays pending.
